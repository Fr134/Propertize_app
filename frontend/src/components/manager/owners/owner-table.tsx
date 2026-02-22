"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OwnerListItem } from "@/hooks/use-owners";

interface OwnerTableProps {
  owners: OwnerListItem[];
}

export function OwnerTable({ owners }: OwnerTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead className="hidden md:table-cell">Telefono</TableHead>
            <TableHead className="text-center">Immobili</TableHead>
            <TableHead>Stato</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {owners.map((owner) => (
            <TableRow key={owner.id}>
              <TableCell>
                <Link
                  href={`/manager/owners/${owner.id}`}
                  className="font-medium hover:underline"
                >
                  {owner.name}
                </Link>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                {owner.email ?? "—"}
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {owner.phone ?? "—"}
              </TableCell>
              <TableCell className="text-center">
                {owner._count.properties}
              </TableCell>
              <TableCell>
                <Badge variant={owner.status === "active" ? "default" : "secondary"}>
                  {owner.status === "active" ? "Attivo" : "Inattivo"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
