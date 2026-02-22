"use client";

import { use } from "react";
import Link from "next/link";
import { useProperty } from "@/hooks/use-properties";
import { useChecklistTemplate } from "@/hooks/use-checklist-template";
import { TemplateEditor } from "@/components/manager/checklist/template-editor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ChecklistTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: property, isLoading: loadingProperty } = useProperty(id);
  const { data: templateData, isLoading: loadingTemplate } = useChecklistTemplate(id);

  if (loadingProperty || loadingTemplate) {
    return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  }

  if (!property) {
    return <p className="text-sm text-destructive">Immobile non trovato.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/manager/properties/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Template Checklist &mdash; {property.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Definisci le aree da controllare durante la pulizia
          </p>
        </div>
      </div>

      <TemplateEditor
        propertyId={id}
        initialAreas={templateData?.items ?? []}
      />
    </div>
  );
}
