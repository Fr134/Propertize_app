"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Upload,
  FileText,
  Loader2,
  Check,
  ExternalLink,
  Plus,
} from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";
import { usePdfTemplates, useUpsertPdfTemplate } from "@/hooks/use-authorizations";

export default function TemplatesPage() {
  const { data: grouped, isLoading } = usePdfTemplates();
  const upsert = useUpsertPdfTemplate();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [location, setLocation] = useState("");
  const [documentType, setDocumentType] = useState("comunicazione_locazione");
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { startUpload, isUploading } = useUploadThing("pdfTemplate");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!file || !location || !label) {
        toast({ title: "Errore", description: "Compila tutti i campi e seleziona un PDF", variant: "destructive" });
        return;
      }

      try {
        // Upload PDF
        const uploadResult = await startUpload([file]);
        if (!uploadResult?.[0]?.ufsUrl) {
          throw new Error("Upload fallito");
        }

        // Save template record
        await upsert.mutateAsync({
          location,
          document_type: documentType,
          label,
          template_url: uploadResult[0].ufsUrl,
        });

        toast({ title: "Template salvato", description: `Template "${label}" caricato per ${location}` });
        setShowForm(false);
        setLocation("");
        setLabel("");
        setFile(null);
      } catch (err) {
        toast({
          title: "Errore",
          description: err instanceof Error ? err.message : "Errore durante il salvataggio",
          variant: "destructive",
        });
      }
    },
    [file, location, documentType, label, startUpload, upsert, toast]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const locations = grouped ? Object.entries(grouped) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Template PDF</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? "Annulla" : "Nuovo template"}
        </Button>
      </div>

      {/* Upload form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Carica template PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Localita</Label>
                  <Input
                    id="location"
                    placeholder="es. Cagliari"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document_type">Tipo documento</Label>
                  <Input
                    id="document_type"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Nome template</Label>
                <Input
                  id="label"
                  placeholder="es. Comunicazione Locazione Turistica - Cagliari"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdf">File PDF (compilabile)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="pdf"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="cursor-pointer"
                  />
                  {file && (
                    <Badge variant="outline" className="shrink-0">
                      <FileText className="mr-1.5 h-3 w-3" />
                      {file.name}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Carica un PDF con campi compilabili (form fields). Max 16 MB.
                </p>
              </div>

              <Button type="submit" disabled={isUploading || upsert.isPending}>
                {(isUploading || upsert.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Upload className="mr-2 h-4 w-4" />
                Carica e salva
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Existing templates */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nessun template caricato</p>
            <p className="text-sm text-muted-foreground mt-1">
              Carica un PDF compilabile per iniziare a generare documenti automaticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        locations.map(([loc, templates]) => (
          <Card key={loc}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {loc}
                <Badge variant="secondary" className="text-xs">
                  {templates.length} template
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-md border"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{t.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Tipo: {t.document_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.is_active ? (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <Check className="mr-1 h-3 w-3" />
                        Attivo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Disattivato
                      </Badge>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <a href={t.template_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Apri PDF
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLocation(loc);
                        setDocumentType(t.document_type);
                        setLabel(t.label);
                        setFile(null);
                        setShowForm(true);
                      }}
                    >
                      Sostituisci
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
