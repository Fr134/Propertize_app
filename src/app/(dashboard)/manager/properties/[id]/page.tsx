"use client";

import { use } from "react";
import Link from "next/link";
import { useProperty } from "@/hooks/use-properties";
import { ChecklistEditor } from "@/components/manager/checklist-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin } from "lucide-react";
import type { ChecklistTemplateItem } from "@/types";

const propertyTypeLabels: Record<string, string> = {
  APPARTAMENTO: "Appartamento",
  VILLA: "Villa",
  ALTRO: "Altro",
};

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: property, isLoading } = useProperty(id);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  }

  if (!property) {
    return <p className="text-sm text-destructive">Immobile non trovato.</p>;
  }

  const checklistItems: ChecklistTemplateItem[] =
    (property.checklist_template?.items as ChecklistTemplateItem[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/manager/properties">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{property.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {property.address}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Codice</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{property.code}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tipologia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{propertyTypeLabels[property.property_type]}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aree checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{checklistItems.length}</p>
          </CardContent>
        </Card>
      </div>

      <ChecklistEditor propertyId={id} initialItems={checklistItems} />
    </div>
  );
}
