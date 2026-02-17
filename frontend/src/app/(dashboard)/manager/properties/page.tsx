"use client";

import Link from "next/link";
import { useProperties } from "@/hooks/use-properties";
import { CreatePropertyDialog } from "@/components/manager/create-property-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2 } from "lucide-react";

const propertyTypeLabels: Record<string, string> = {
  APPARTAMENTO: "Appartamento",
  VILLA: "Villa",
  ALTRO: "Altro",
};

export default function PropertiesPage() {
  const { data: properties, isLoading } = useProperties();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Immobili</h1>
        <CreatePropertyDialog />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      ) : !properties?.length ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
          <Building2 className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nessun immobile presente. Crea il primo immobile per iniziare.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Codice</TableHead>
                <TableHead className="hidden sm:table-cell">Indirizzo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Task</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <Link
                      href={`/manager/properties/${property.id}`}
                      className="font-medium hover:underline"
                    >
                      {property.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{property.code}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {property.address}
                  </TableCell>
                  <TableCell>
                    {propertyTypeLabels[property.property_type] ?? property.property_type}
                  </TableCell>
                  <TableCell className="text-right">
                    {property._count.cleaning_tasks}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
