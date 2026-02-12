import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";

// PATCH /api/tasks/[id]/complete - Operator completes a task
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const task = await prisma.cleaningTask.findUnique({
    where: { id },
    include: { photos: true },
  });

  if (!task) return errorResponse("Task non trovato", 404);
  if (task.assigned_to !== session!.user.id) return errorResponse("Accesso negato", 403);
  if (task.status !== "IN_PROGRESS") return errorResponse("Il task non e' in corso");

  // Validate: all items completed, required photos uploaded
  const checklistData = task.checklist_data as {
    completed: boolean;
    photo_required: boolean;
    photo_urls: string[];
  }[] | null;

  if (checklistData) {
    for (let i = 0; i < checklistData.length; i++) {
      const item = checklistData[i];
      if (!item.completed) {
        return errorResponse(`L'area ${i + 1} non e' stata completata`);
      }
      if (item.photo_required && (!item.photo_urls || item.photo_urls.length === 0)) {
        return errorResponse(`Foto obbligatoria mancante per l'area ${i + 1}`);
      }
    }
  }

  const updated = await prisma.cleaningTask.update({
    where: { id },
    data: {
      status: "COMPLETED",
      completed_at: new Date(),
    },
  });

  return json(updated);
}
