import { prisma } from "@/lib/prisma";
import { json, requireAuth } from "@/lib/api-utils";
import { type NextRequest } from "next/server";

// GET /api/users?role=OPERATOR - List users by role
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const role = req.nextUrl.searchParams.get("role");

  const users = await prisma.user.findMany({
    where: role ? { role: role as "MANAGER" | "OPERATOR" } : undefined,
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
    },
    orderBy: { first_name: "asc" },
  });

  return json(users);
}
