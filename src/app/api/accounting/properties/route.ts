import { prisma } from "@/lib/prisma";
import { json, requireManager } from "@/lib/api-utils";

// GET /api/accounting/properties - Property list with billing totals (manager only)
export async function GET() {
  const { error } = await requireManager();
  if (error) return error;

  const properties = await prisma.property.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      address: true,
      expenses: {
        select: {
          amount: true,
          is_billed: true,
          is_paid: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = properties.map((p) => {
    const billedTotal = p.expenses
      .filter((e) => e.is_billed)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const paidTotal = p.expenses
      .filter((e) => e.is_paid)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const dueTotal = p.expenses
      .filter((e) => e.is_billed && !e.is_paid)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const totalExpenses = p.expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      address: p.address,
      expenseCount: p.expenses.length,
      totalExpenses,
      billedTotal,
      paidTotal,
      dueTotal,
    };
  });

  return json(result);
}
