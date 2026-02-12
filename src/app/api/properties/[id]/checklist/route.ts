import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";
import { updateChecklistTemplateSchema } from "@/lib/validators";

// PUT /api/properties/[id]/checklist - Update checklist template (MANAGER only)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireManager();
  if (error) return error;

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
  });

  if (!property) {
    return errorResponse("Immobile non trovato", 404);
  }

  const body = await req.json();
  const parsed = updateChecklistTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0].message);
  }

  const template = await prisma.checklistTemplate.upsert({
    where: { property_id: id },
    update: { items: parsed.data.items },
    create: {
      property_id: id,
      items: parsed.data.items,
    },
  });

  return json(template);
}
