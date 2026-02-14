import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";

// POST /api/tasks/[id]/photos - Save photo reference after upload
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { checklistItemIndex, photoUrl } = body as {
    checklistItemIndex: number;
    photoUrl: string;
  };

  if (typeof checklistItemIndex !== "number" || !photoUrl) {
    return errorResponse("checklistItemIndex e photoUrl sono richiesti");
  }

  const task = await prisma.cleaningTask.findUnique({ where: { id } });

  if (!task) return errorResponse("Task non trovato", 404);
  if (task.assigned_to !== session!.user.id) return errorResponse("Accesso negato", 403);
  if (task.status !== "IN_PROGRESS") return errorResponse("Il task non e' in corso");

  // Save photo record
  const photo = await prisma.taskPhoto.create({
    data: {
      task_id: id,
      checklist_item_index: checklistItemIndex,
      photo_url: photoUrl,
    },
  });

  // Also update checklist_data photo_urls
  // Handle both old array format and new object format
  const raw = task.checklist_data;
  if (raw) {
    const isArray = Array.isArray(raw);
    const areas = isArray
      ? (raw as Record<string, unknown>[])
      : ((raw as Record<string, unknown>).areas as Record<string, unknown>[] ?? []);

    if (checklistItemIndex < areas.length) {
      const urls = (areas[checklistItemIndex].photo_urls as string[]) || [];
      urls.push(photoUrl);
      areas[checklistItemIndex].photo_urls = urls;

      const updatedData = isArray ? areas : raw;
      await prisma.cleaningTask.update({
        where: { id },
        data: { checklist_data: updatedData as unknown as import("@prisma/client").Prisma.InputJsonValue },
      });
    }
  }

  return json(photo, 201);
}
