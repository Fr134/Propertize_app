"use client";

import { useSession } from "next-auth/react";
import { hasPermission, type Permission } from "@/lib/permissions";

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { data: session } = useSession();

  if (!hasPermission(session, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
