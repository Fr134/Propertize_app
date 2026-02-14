import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";
import { createExpenseSchema } from "@/lib/validators";
import { type NextRequest } from "next/server";

// GET /api/properties/[id]/expenses - List expenses for a property (manager only)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireManager();
  if (error) return error;

  const { id } = await params;

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return errorResponse("Immobile non trovato", 404);

  const expenses = await prisma.expense.findMany({
    where: { property_id: id },
    include: {
      author: { select: { id: true, first_name: true, last_name: true } },
      photos: { orderBy: { uploaded_at: "asc" } },
    },
    orderBy: { expense_date: "desc" },
  });

  return json(expenses);
}

// POST /api/properties/[id]/expenses - Create expense (manager only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireManager();
  if (error) return error;

  const { id } = await params;

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return errorResponse("Immobile non trovato", 404);

  const body = await req.json();
  const parsed = createExpenseSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400);
  }

  const expense = await prisma.expense.create({
    data: {
      property_id: id,
      created_by: session!.user.id,
      description: parsed.data.description,
      amount: parsed.data.amount,
      vat_amount: parsed.data.vat_amount ?? null,
      expense_date: parsed.data.expense_date
        ? new Date(parsed.data.expense_date)
        : new Date(),
    },
    include: {
      author: { select: { id: true, first_name: true, last_name: true } },
      photos: true,
    },
  });

  return json(expense, 201);
}
