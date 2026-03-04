"use client";

import { useSession } from "next-auth/react";
import { SidebarNav } from "./sidebar-nav";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

export function AppSidebar() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  if (!role) return null;

  return (
    <aside className="hidden w-60 flex-col border-r bg-background md:flex">
      <div className="flex h-14 items-center px-6">
        <Image
          src="/propertize-logo.png"
          alt="Propertize"
          width={160}
          height={40}
          className="h-8 w-auto rounded-lg"
          priority
        />
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto py-2">
        <SidebarNav role={role} />
      </div>
    </aside>
  );
}
