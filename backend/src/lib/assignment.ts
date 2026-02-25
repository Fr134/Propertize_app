import { prisma } from "./prisma";

export type AssignmentCategory =
  | "leads"
  | "analysis"
  | "operations"
  | "onboarding";

/**
 * Get the next assignee using round-robin (least-assigned-first).
 * Only considers active MANAGERs with the required permission or super_admin.
 * Returns null if no eligible user is found.
 */
export async function getNextAssignee(
  category: AssignmentCategory
): Promise<string | null> {
  const permissionFilter = {
    leads: { can_manage_leads: true },
    analysis: { can_do_analysis: true },
    operations: { can_manage_operations: true },
    onboarding: { can_manage_onboarding: true },
  }[category];

  const orderByFields = {
    leads: "leads_assignment_count",
    analysis: "analysis_assignment_count",
    operations: "operations_assignment_count",
    onboarding: "onboarding_assignment_count",
  } as const;
  const orderByField = orderByFields[category];

  const users = await prisma.user.findMany({
    where: {
      active: true,
      role: "MANAGER",
      OR: [{ is_super_admin: true }, permissionFilter],
    },
    select: { id: true },
    orderBy: { [orderByField]: "asc" },
    take: 1,
  });

  return users.length > 0 ? users[0].id : null;
}

/**
 * Increment the assignment count for a user in a given category.
 */
export async function incrementAssignmentCount(
  userId: string,
  category: AssignmentCategory
): Promise<void> {
  const data = {
    leads: { leads_assignment_count: { increment: 1 } },
    analysis: { analysis_assignment_count: { increment: 1 } },
    operations: { operations_assignment_count: { increment: 1 } },
    onboarding: { onboarding_assignment_count: { increment: 1 } },
  }[category];

  await prisma.user.update({ where: { id: userId }, data });
}

/**
 * Decrement the assignment count for a user in a given category.
 * Ensures the count never goes below 0.
 */
export async function decrementAssignmentCount(
  userId: string,
  category: AssignmentCategory
): Promise<void> {
  const selectFields = {
    leads: { leads_assignment_count: true },
    analysis: { analysis_assignment_count: true },
    operations: { operations_assignment_count: true },
    onboarding: { onboarding_assignment_count: true },
  } as const;
  const selectField = selectFields[category];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: selectField,
  });

  if (!user) return;

  const currentCount = Object.values(user)[0] as number;
  if (currentCount <= 0) return;

  const data = {
    leads: { leads_assignment_count: { decrement: 1 } },
    analysis: { analysis_assignment_count: { decrement: 1 } },
    operations: { operations_assignment_count: { decrement: 1 } },
    onboarding: { onboarding_assignment_count: { decrement: 1 } },
  }[category];

  await prisma.user.update({ where: { id: userId }, data });
}
