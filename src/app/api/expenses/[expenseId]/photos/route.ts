import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";

// POST /api/expenses/[expenseId]/photos - Attach photo to expense (manager only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const { error } = await requireManager();
  if (error) return error;

  const { expenseId } = await params;
  const body = await req.json();
  const { photoUrl } = body as { photoUrl: string };

  if (!photoUrl) return errorResponse("photoUrl richiesto", 400);

  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense) return errorResponse("Spesa non trovata", 404);

  const count = await prisma.expensePhoto.count({ where: { expense_id: expenseId } });
  if (count >= 10) return errorResponse("Massimo 10 foto per spesa");

  const photo = await prisma.expensePhoto.create({
    data: {
      expense_id: expenseId,
      photo_url: photoUrl,
    },
  });

  return json(photo, 201);
}
