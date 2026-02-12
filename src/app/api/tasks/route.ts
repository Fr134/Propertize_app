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
    return errorResponse(parsed.error.errors[0].message);
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
  const templateItems = property.checklist_template?.items;
  const checklistData = Array.isArray(templateItems)
    ? (templateItems as { area: string; description: string; photo_required: boolean }[]).map((item) => ({
        ...item,
        completed: false,
        photo_urls: [],
        notes: "",
      }))
    : null;

  const task = await prisma.cleaningTask.create({
    data: {
      property_id: parsed.data.property_id,
      assigned_to: parsed.data.assigned_to,
      scheduled_date: new Date(parsed.data.scheduled_date),
      notes: parsed.data.notes,
      checklist_data: checklistData,
    },
    include: {
      property: { select: { id: true, name: true, code: true } },
      operator: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  return json(task, 201);
}
