import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";

interface UserItem {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export function useOperators() {
  return useQuery({
    queryKey: ["users", "operators"],
    queryFn: () => fetchJson<UserItem[]>("/api/users?role=OPERATOR"),
  });
}

export type { UserItem };
