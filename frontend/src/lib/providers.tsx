"use client";

import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, useSession } from "next-auth/react";
import { getQueryClient } from "@/lib/query-client";
import { setAuthToken } from "@/lib/fetch";

function AuthTokenSync() {
  const { data: session } = useSession();
  useEffect(() => {
    setAuthToken(session?.user?.accessToken ?? null);
  }, [session?.user?.accessToken]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AuthTokenSync />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
