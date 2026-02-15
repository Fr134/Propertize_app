import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireManager } from "@/lib/api-utils";
import { createOwnerSchema } from "@/lib/validators";

// GET /api/owners - List all owners (manager only)
export async function GET() {
  const { error } = await requireManager();
  if (error) return error;

  const owners = await prisma.owner.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { properties: true } },
    },
  });

  return json(owners);
}

// POST /api/owners - Create owner (manager only)
export async function POST(req: Request) {
  const { error } = await requireManager();
  if (error) return error;

  const body = await req.json();
  const parsed = createOwnerSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const owner = await prisma.owner.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email || null,
    },
  });

  return json(owner, 201);
}
