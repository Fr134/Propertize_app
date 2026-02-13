import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";
import { reopenTaskSchema } from "@/lib/validators";
import { type NextRequest } from "next/server";

/**
 * PATCH /api/tasks/[id]/reopen
 * Manager reopens a rejected task (REJECTED -> IN_PROGRESS)
 * Requires a note explaining what to fix.
 * Checklist progress is preserved.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireManager();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = reopenTaskSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400);
  }

  // Atomic conditional update: only if status is REJECTED
  const { count } = await prisma.cleaningTask.updateMany({
    where: { id, status: "REJECTED" },
    data: {
      status: "IN_PROGRESS",
      reopen_note: parsed.data.note,
      reopen_at: new Date(),
      reopen_by: session!.user.id,
      reviewed_at: null,
      reviewed_by: null,
      completed_at: null,
      // checklist_data is NOT reset — operator keeps their progress
    },
  });

  if (count === 0) {
    const task = await prisma.cleaningTask.findUnique({ where: { id } });
    if (!task) return errorResponse("Task non trovata", 404);
    if (task.status === "IN_PROGRESS") {
      return json({ ...task, alreadyApplied: true });
    }
    return errorResponse(
      `Impossibile riaprire: lo stato attuale e' ${task.status} (richiesto REJECTED)`,
      400
    );
  }

  const updatedTask = await prisma.cleaningTask.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, name: true, code: true } },
      operator: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  return json(updatedTask);
}
