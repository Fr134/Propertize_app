import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";

// Helper: parse checklist_data (old array format or new object format)
function parseChecklistData(raw: unknown): {
  areas: Array<Record<string, unknown>>;
  staySupplies: Array<Record<string, unknown>>;
  isObject: boolean;
} {
  if (Array.isArray(raw)) {
    return { areas: raw, staySupplies: [], isObject: false };
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return {
      areas: Array.isArray(obj.areas) ? (obj.areas as Array<Record<string, unknown>>) : [],
      staySupplies: Array.isArray(obj.staySupplies)
        ? (obj.staySupplies as Array<Record<string, unknown>>)
        : [],
      isObject: true,
    };
  }
  return { areas: [], staySupplies: [], isObject: false };
}

// Serialize back to the stored format
function serializeChecklistData(
  areas: Array<Record<string, unknown>>,
  staySupplies: Array<Record<string, unknown>>,
  wasObject: boolean,
) {
  // Always write new object format if it was already object, or if we have staySupplies
  if (wasObject || staySupplies.length > 0) {
    return { areas, staySupplies };
  }
  // Old format: just the array
  return areas;
}

// PATCH /api/tasks/[id]/checklist - Update checklist item, sub-task, or supply
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

  if (!task.checklist_data) {
    return errorResponse("Checklist non presente");
  }

  const { areas, staySupplies, isObject } = parseChecklistData(task.checklist_data);

  // --- SUPPLY_TOGGLE: toggle a stay supply's checked state ---
  if (body.type === "SUPPLY_TOGGLE") {
    const { supplyId, checked } = body as {
      supplyId: string;
      checked: boolean;
    };

    if (!supplyId || typeof checked !== "boolean") {
      return errorResponse("supplyId e checked sono richiesti");
    }

    const supplyIndex = staySupplies.findIndex((s) => s.id === supplyId);
    if (supplyIndex === -1) {
      return errorResponse("Scorta non trovata");
    }

    staySupplies[supplyIndex].checked = checked;

    const updated = await prisma.cleaningTask.update({
      where: { id },
      data: {
        checklist_data: serializeChecklistData(areas, staySupplies, isObject) as unknown as import("@prisma/client").Prisma.InputJsonValue,
      },
    });

    return json(updated);
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

    if (itemIndex >= areas.length) {
      return errorResponse("Indice checklist non valido");
    }

    const subTasks = areas[itemIndex].subTasks as
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
    areas[itemIndex].subTasks = subTasks;

    const updated = await prisma.cleaningTask.update({
      where: { id },
      data: {
        checklist_data: serializeChecklistData(areas, staySupplies, isObject) as unknown as import("@prisma/client").Prisma.InputJsonValue,
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

  if (itemIndex >= areas.length) {
    return errorResponse("Indice checklist non valido");
  }

  if (typeof completed === "boolean") {
    areas[itemIndex].completed = completed;
  }
  if (typeof notes === "string") {
    areas[itemIndex].notes = notes;
  }

  const updated = await prisma.cleaningTask.update({
    where: { id },
    data: {
      checklist_data: serializeChecklistData(areas, staySupplies, isObject) as unknown as import("@prisma/client").Prisma.InputJsonValue,
    },
  });

  return json(updated);
}
