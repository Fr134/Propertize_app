import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    return { session: null, error: errorResponse("Non autorizzato", 401) };
  }
  return { session, error: null };
}

export async function requireManager() {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };
  if (session!.user.role !== "MANAGER") {
    return { session: null, error: errorResponse("Accesso riservato al manager", 403) };
  }
  return { session, error: null };
}
