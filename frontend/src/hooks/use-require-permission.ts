"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { hasPermission, type Permission } from "@/lib/permissions";

export function useRequirePermission(permission: Permission) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const allowed =
    status === "loading" ? true : hasPermission(session, permission);

  useEffect(() => {
    if (status === "loading") return;

    if (!allowed) {
      toast({
        variant: "destructive",
        title: "Accesso negato",
        description: "Non hai i permessi per accedere a questa sezione.",
      });
      router.replace("/manager");
    }
  }, [status, allowed, router, toast]);

  return { allowed, loading: status === "loading" };
}
