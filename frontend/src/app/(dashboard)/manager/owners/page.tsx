"use client";

import Link from "next/link";
import { useOwners } from "@/hooks/use-owners";
import { OwnerTable } from "@/components/manager/owners/owner-table";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";

export default function OwnersPage() {
  const { data: owners, isLoading } = useOwners();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Proprietari</h1>
        <Button asChild>
          <Link href="/manager/owners/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo proprietario
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : !owners?.length ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
          <Users className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nessun proprietario presente. Crea il primo per iniziare.
          </p>
        </div>
      ) : (
        <OwnerTable owners={owners} />
      )}
    </div>
  );
}
