import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";

// PATCH /api/tasks/[id]/checklist - Update checklist item or sub-task
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const task = await prisma.cleaningTask.findUnique({ where: { id } });

  if (!task) return errorResponse("Task non trovato", 404);
  if (
    session!.user.role === "OPERATOR" &&
    task.assigned_to !== session!.user.id
  ) {
    return errorResponse("Accesso negato", 403);
  }
  if (task.status !== "IN_PROGRESS")
    return errorResponse("Il task non e' in corso");

  const checklistData = task.checklist_data as Array<
    Record<string, unknown>
  > | null;
  if (!checklistData) {
    return errorResponse("Checklist non presente");
  }

  // --- AREA_SUBTASK_TOGGLE: toggle a sub-task's completed state ---
  if (body.type === "AREA_SUBTASK_TOGGLE") {
    const { itemIndex, subTaskId, completed } = body as {
      itemIndex: number;
      subTaskId: string;
      completed: boolean;
    };

    if (
      typeof itemIndex !== "number" ||
      !subTaskId ||
      typeof completed !== "boolean"
    ) {
      return errorResponse("itemIndex, subTaskId e completed sono richiesti");
    }

    if (itemIndex >= checklistData.length) {
      return errorResponse("Indice checklist non valido");
    }

    const subTasks = checklistData[itemIndex].subTasks as
      | { id: string; text: string; completed: boolean }[]
      | undefined;

    if (!subTasks) {
      return errorResponse("Nessun sub-task per questa area");
    }

    const stIndex = subTasks.findIndex((st) => st.id === subTaskId);
    if (stIndex === -1) {
      return errorResponse("Sub-task non trovato");
    }

    subTasks[stIndex].completed = completed;
    checklistData[itemIndex].subTasks = subTasks;

    const updated = await prisma.cleaningTask.update({
      where: { id },
      data: {
        checklist_data:
          checklistData as unknown as import("@prisma/client").Prisma.InputJsonValue,
      },
    });

    return json(updated);
  }

  // --- Legacy: update area-level completed / notes ---
  const { itemIndex, completed, notes } = body as {
    itemIndex: number;
    completed?: boolean;
    notes?: string;
  };

  if (typeof itemIndex !== "number") {
    return errorResponse("itemIndex richiesto");
  }

  if (itemIndex >= checklistData.length) {
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
    data: {
      checklist_data:
        checklistData as unknown as import("@prisma/client").Prisma.InputJsonValue,
    },
  });

  return json(updated);
}
