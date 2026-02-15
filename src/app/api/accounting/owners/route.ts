import { prisma } from "@/lib/prisma";
import { json, requireManager } from "@/lib/api-utils";

// GET /api/accounting/owners - Owner list with aggregated billing totals (manager only)
export async function GET() {
  const { error } = await requireManager();
  if (error) return error;

  const owners = await prisma.owner.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      properties: {
        select: {
          id: true,
          name: true,
          code: true,
          expenses: {
            select: {
              amount: true,
              is_billed: true,
              is_paid: true,
            },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = owners.map((owner) => {
    const properties = owner.properties.map((p) => {
      const totalExpenses = p.expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );
      const billedTotal = p.expenses
        .filter((e) => e.is_billed)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const paidTotal = p.expenses
        .filter((e) => e.is_paid)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const dueTotal = p.expenses
        .filter((e) => e.is_billed && !e.is_paid)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        id: p.id,
        name: p.name,
        code: p.code,
        expenseCount: p.expenses.length,
        totalExpenses,
        billedTotal,
        paidTotal,
        dueTotal,
      };
    });

    const totals = properties.reduce(
      (acc, p) => ({
        totalExpenses: acc.totalExpenses + p.totalExpenses,
        billedTotal: acc.billedTotal + p.billedTotal,
        paidTotal: acc.paidTotal + p.paidTotal,
        dueTotal: acc.dueTotal + p.dueTotal,
      }),
      { totalExpenses: 0, billedTotal: 0, paidTotal: 0, dueTotal: 0 }
    );

    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      propertyCount: properties.length,
      properties,
      ...totals,
    };
  });

  return json(result);
}
