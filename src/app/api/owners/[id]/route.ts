import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";
import { updateOwnerSchema } from "@/lib/validators";

// PATCH /api/owners/[id] - Update owner (manager only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireManager();
  if (error) return error;

  const { id } = await params;

  const body = await req.json();
  const parsed = updateOwnerSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400);
  }

  const owner = await prisma.owner.findUnique({ where: { id } });
  if (!owner) return errorResponse("Proprietario non trovato", 404);

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.email !== undefined) data.email = parsed.data.email || null;

  const updated = await prisma.owner.update({
    where: { id },
    data,
  });

  return json(updated);
}
