import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";

// PATCH /api/tasks/[id]/complete - Operator completes a task
// Atomic: only transitions IN_PROGRESS -> COMPLETED
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  // First fetch to validate checklist (needed before we transition)
  const task = await prisma.cleaningTask.findUnique({
    where: { id },
    include: { photos: true },
  });

  if (!task) return errorResponse("Task non trovato", 404);
  if (task.assigned_to !== session!.user.id)
    return errorResponse("Accesso negato", 403);

  // Idempotent: already completed or beyond
  if (task.status !== "IN_PROGRESS") {
    return json({ ...task, alreadyApplied: true });
  }

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

  // Atomic conditional update
  const { count } = await prisma.cleaningTask.updateMany({
    where: { id, status: "IN_PROGRESS", assigned_to: session!.user.id },
    data: {
      status: "COMPLETED",
      completed_at: new Date(),
    },
  });

  if (count === 0) {
    // Race: someone else transitioned between our read and write
    const current = await prisma.cleaningTask.findUnique({ where: { id } });
    return json({ ...current, alreadyApplied: true });
  }

  const updated = await prisma.cleaningTask.findUnique({ where: { id } });
  return json(updated);
}
