import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";

// PATCH /api/tasks/[id]/start - Operator starts a task
// Atomic: only transitions TODO -> IN_PROGRESS
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  // Atomic conditional update: only succeeds if status is TODO and assigned to this user
  const { count } = await prisma.cleaningTask.updateMany({
    where: { id, status: "TODO", assigned_to: session!.user.id },
    data: { status: "IN_PROGRESS" },
  });

  if (count === 0) {
    // Fetch current task to determine why
    const task = await prisma.cleaningTask.findUnique({ where: { id } });
    if (!task) return errorResponse("Task non trovato", 404);
    if (task.assigned_to !== session!.user.id)
      return errorResponse("Non sei assegnata a questo task", 403);
    // Already past TODO — idempotent response
    return json({ ...task, alreadyApplied: true });
  }

  const updated = await prisma.cleaningTask.findUnique({ where: { id } });
  return json(updated);
}
