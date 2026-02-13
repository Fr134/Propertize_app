import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";

// PATCH /api/tasks/[id]/checklist - Update checklist item
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { itemIndex, completed, notes } = body as {
    itemIndex: number;
    completed?: boolean;
    notes?: string;
  };

  if (typeof itemIndex !== "number") {
    return errorResponse("itemIndex richiesto");
  }

  const task = await prisma.cleaningTask.findUnique({ where: { id } });

  if (!task) return errorResponse("Task non trovato", 404);
  if (task.assigned_to !== session!.user.id) return errorResponse("Accesso negato", 403);
  if (task.status !== "IN_PROGRESS") return errorResponse("Il task non e' in corso");

  const checklistData = task.checklist_data as Array<Record<string, unknown>> | null;
  if (!checklistData || itemIndex >= checklistData.length) {
    return errorResponse("Indice checklist non valido");
  }

  if (typeof completed === "boolean") {
    checklistData[itemIndex].completed = completed;
  }
  if (typeof notes === "string") {
    checklistData[itemIndex].notes = notes;
  }

  const updated = await prisma.cleaningTask.update({
    where: { id },
    data: { checklist_data: checklistData as unknown as import("@prisma/client").Prisma.InputJsonValue },
  });

  return json(updated);
}
