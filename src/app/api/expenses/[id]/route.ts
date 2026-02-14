import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";
import { z } from "zod";

const updateExpenseSchema = z.object({
  is_billed: z.boolean().optional(),
  is_paid: z.boolean().optional(),
});

// PATCH /api/expenses/[id] - Toggle billed/paid status (manager only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireManager();
  if (error) return error;

  const { id } = await params;

  const body = await req.json();
  const parsed = updateExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400);
  }

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return errorResponse("Spesa non trovata", 404);

  const data: Record<string, unknown> = {};

  // Handle is_billed toggle
  if (parsed.data.is_billed !== undefined) {
    data.is_billed = parsed.data.is_billed;
    data.billed_at = parsed.data.is_billed ? new Date() : null;

    // If un-billing, also un-pay
    if (!parsed.data.is_billed) {
      data.is_paid = false;
      data.paid_at = null;
    }
  }

  // Handle is_paid toggle
  if (parsed.data.is_paid !== undefined) {
    // Cannot pay if not billed
    const willBeBilled = data.is_billed !== undefined
      ? data.is_billed
      : expense.is_billed;

    if (parsed.data.is_paid && !willBeBilled) {
      return errorResponse(
        "Non puoi segnare come pagata una spesa non fatturata",
        400
      );
    }

    data.is_paid = parsed.data.is_paid;
    data.paid_at = parsed.data.is_paid ? new Date() : null;
  }

  const updated = await prisma.expense.update({
    where: { id },
    data,
    include: {
      author: { select: { id: true, first_name: true, last_name: true } },
      photos: { orderBy: { uploaded_at: "asc" } },
    },
  });

  return json(updated);
}
