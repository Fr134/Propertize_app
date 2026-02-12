import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";

// GET /api/tasks/[id] - Task detail
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const task = await prisma.cleaningTask.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, name: true, code: true, address: true } },
      operator: { select: { id: true, first_name: true, last_name: true, email: true } },
      reviewer: { select: { id: true, first_name: true, last_name: true } },
      photos: { orderBy: { checklist_item_index: "asc" } },
    },
  });

  if (!task) {
    return errorResponse("Task non trovato", 404);
  }

  // Operators can only see their own tasks
  if (session!.user.role === "OPERATOR" && task.assigned_to !== session!.user.id) {
    return errorResponse("Accesso negato", 403);
  }

  return json(task);
}
