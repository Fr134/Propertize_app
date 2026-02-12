import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";

// PATCH /api/tasks/[id]/start - Operator starts a task
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const task = await prisma.cleaningTask.findUnique({ where: { id } });

  if (!task) return errorResponse("Task non trovato", 404);
  if (task.assigned_to !== session!.user.id) return errorResponse("Non sei assegnata a questo task", 403);
  if (task.status !== "TODO") return errorResponse("Il task non e' in stato TODO");

  const updated = await prisma.cleaningTask.update({
    where: { id },
    data: { status: "IN_PROGRESS" },
  });

  return json(updated);
}
