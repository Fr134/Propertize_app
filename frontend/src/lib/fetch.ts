export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Module-level auth token, set by AuthTokenSync in providers.tsx
let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}

export async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  // Prepend backend base URL for relative API paths
  const base =
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL ?? "")
      : (process.env.API_URL ?? "");

  const url = path.startsWith("http") ? path : `${base}${path}`;

  const existingHeaders = (options?.headers ?? {}) as Record<string, string>;
  const headers: Record<string, string> = { ...existingHeaders };

  if (_authToken && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${_authToken}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Errore di rete");
  return data;
}
