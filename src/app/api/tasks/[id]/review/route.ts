import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";
import { reviewTaskSchema } from "@/lib/validators";
import { type NextRequest } from "next/server";

/**
 * PATCH /api/tasks/[id]/review
 * Approva o rigetta una task completata (solo MANAGER)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireManager();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = reviewTaskSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0].message, 400);
  }

  const task = await prisma.cleaningTask.findUnique({
    where: { id },
  });

  if (!task) {
    return errorResponse("Task non trovata", 404);
  }

  if (task.status !== "COMPLETED") {
    return errorResponse("Solo task completate possono essere revisionate", 400);
  }

  const updatedTask = await prisma.cleaningTask.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewed_at: new Date(),
      reviewed_by: session!.user.id,
      rejection_notes: parsed.data.status === "REJECTED" ? parsed.data.notes : null,
    },
    include: {
      property: { select: { id: true, name: true, code: true } },
      operator: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  return json(updatedTask);
}
