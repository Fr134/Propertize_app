import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth, requireManager } from "@/lib/api-utils";
import { createTaskSchema } from "@/lib/validators";
import { getPaginationParams, createPaginatedResponse } from "@/lib/pagination";
import { type NextRequest } from "next/server";

// GET /api/tasks - List tasks with filters and pagination
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const assignedTo = searchParams.get("assigned_to");
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const { page, limit, skip } = getPaginationParams(req);

  const where: Record<string, unknown> = {};

  // Operators can only see their own tasks
  if (session!.user.role === "OPERATOR") {
    where.assigned_to = session!.user.id;
  } else if (assignedTo) {
    where.assigned_to = assignedTo;
  }

  if (status) {
    where.status = status;
  }

  if (date) {
    where.scheduled_date = new Date(date);
  }

  // Query parallele per ottimizzare performance
  const [tasks, total] = await Promise.all([
    prisma.cleaningTask.findMany({
      where,
      include: {
        property: { select: { id: true, name: true, code: true } },
        operator: { select: { id: true, first_name: true, last_name: true } },
      },
      orderBy: [{ scheduled_date: "desc" }, { created_at: "desc" }],
      take: limit,
      skip,
    }),
    prisma.cleaningTask.count({ where }),
  ]);

  return json(createPaginatedResponse(tasks, total, page, limit));
}

// POST /api/tasks - Create task (MANAGER only)
export async function POST(req: Request) {
  const { error } = await requireManager();
  if (error) return error;

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  // Verify property exists and has a checklist template
  const property = await prisma.property.findUnique({
    where: { id: parsed.data.property_id },
    include: { checklist_template: true },
  });

  if (!property) {
    return errorResponse("Immobile non trovato", 404);
  }

  // Verify operator exists and has OPERATOR role
  const operator = await prisma.user.findUnique({
    where: { id: parsed.data.assigned_to },
  });

  if (!operator || operator.role !== "OPERATOR") {
    return errorResponse("Operatrice non trovata");
  }

  // Build checklist_data from template
  // Template can be old format (array) or new format ({ items, staySupplies })
  const rawTemplate = property.checklist_template?.items;
  type TemplateArea = { area: string; description: string; photo_required: boolean; subTasks?: { id: string; text: string }[] };
  type TemplateSupply = { id: string; text: string; supplyItemId?: string | null; expectedQty?: number };

  const templateAreas: TemplateArea[] = Array.isArray(rawTemplate)
    ? (rawTemplate as unknown as TemplateArea[])
    : ((rawTemplate as Record<string, unknown>)?.items as TemplateArea[] ?? []);
  const templateSupplies: TemplateSupply[] = Array.isArray(rawTemplate)
    ? []
    : ((rawTemplate as Record<string, unknown>)?.staySupplies as TemplateSupply[] ?? []);

  const checklistData = templateAreas.length > 0
    ? {
        areas: templateAreas.map((item) => ({
          area: item.area,
          description: item.description,
          photo_required: item.photo_required,
          completed: false,
          photo_urls: [] as string[],
          notes: "",
          subTasks: (item.subTasks ?? []).map((st) => ({
            id: st.id,
            text: st.text,
            completed: false,
          })),
        })),
        staySupplies: templateSupplies.map((s) => ({
          id: s.id,
          text: s.text,
          checked: false,
          ...(s.supplyItemId ? { supplyItemId: s.supplyItemId, expectedQty: s.expectedQty ?? 1, qtyUsed: 0 } : {}),
        })),
      }
    : null;

  // Collect supply items that need CleaningTaskSupplyUsage rows
  const linkedSupplies = templateSupplies.filter((s) => s.supplyItemId);

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.cleaningTask.create({
      data: {
        property_id: parsed.data.property_id,
        assigned_to: parsed.data.assigned_to,
        scheduled_date: new Date(parsed.data.scheduled_date),
        notes: parsed.data.notes,
        checklist_data: checklistData ?? undefined,
      },
      include: {
        property: { select: { id: true, name: true, code: true } },
        operator: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    // Create supply usage rows for linked supplies
    if (linkedSupplies.length > 0) {
      await tx.cleaningTaskSupplyUsage.createMany({
        data: linkedSupplies.map((s) => ({
          task_id: created.id,
          supply_item_id: s.supplyItemId!,
          expected_qty: s.expectedQty ?? 1,
          qty_used: 0,
        })),
      });
    }

    return created;
  });

  return json(task, 201);
}
