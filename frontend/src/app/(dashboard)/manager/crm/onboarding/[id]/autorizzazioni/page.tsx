"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Copy,
  Check,
  MessageCircle,
  Download,
  Send,
  Loader2,
  Mail,
  FileText,
} from "lucide-react";
import { useOwner } from "@/hooks/use-owners";
import {
  useAuthFormByOwner,
  useSendAuthLink,
  useSendToClient,
  useGeneratePdf,
} from "@/hooks/use-authorizations";

export default function AutorizzazioniManagerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ownerId } = use(params);
  const { data: owner } = useOwner(ownerId);
  const { data: form, isLoading, error } = useAuthFormByOwner(ownerId);
  const sendLink = useSendAuthLink(ownerId);
  const sendToClient = useSendToClient(ownerId);
  const generatePdf = useGeneratePdf(ownerId);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [linkResult, setLinkResult] = useState<{ token: string; url: string } | null>(null);

  const ownerName = owner?.name ?? "...";
  const ownerPhone = owner?.phone ?? null;
  const ownerEmail = owner?.email ?? null;

  const handleSendLink = useCallback(async () => {
    try {
      const result = await sendLink.mutateAsync();
      setLinkResult(result);

      // Open WhatsApp
      if (ownerPhone) {
        const phone = ownerPhone.replace(/\D/g, "");
        const text = encodeURIComponent(
          `Ciao ${ownerName}, per completare le autorizzazioni compila questo modulo: ${result.url}`
        );
        window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
      }
    } catch {
      toast({ title: "Errore", description: "Impossibile generare il link", variant: "destructive" });
    }
  }, [sendLink, ownerPhone, ownerName, toast]);

  const handleCopyLink = useCallback(async () => {
    const url = linkResult?.url ?? (form ? `${window.location.origin}/autorizzazioni?token=${form.token}` : "");
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [linkResult, form]);

  const handleSendToClient = useCallback(async () => {
    try {
      await sendToClient.mutateAsync();
      toast({ title: "PDF inviato", description: `PDF inviato a ${ownerEmail}` });
    } catch (err) {
      toast({
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore invio PDF",
        variant: "destructive",
      });
    }
  }, [sendToClient, ownerEmail, toast]);

  const handleGeneratePdf = useCallback(async () => {
    try {
      await generatePdf.mutateAsync();
      toast({ title: "PDF generato", description: "Il documento PDF è stato generato con successo" });
    } catch (err) {
      toast({
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore generazione PDF",
        variant: "destructive",
      });
    }
  }, [generatePdf, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No form created yet (404 from API is captured as error)
  const noForm = error || !form;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/manager/crm/onboarding/${ownerId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Autorizzazioni — {ownerName}
          </h1>
        </div>
      </div>

      {noForm ? (
        /* ---------- No form created ---------- */
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-muted-foreground">Modulo non ancora inviato</p>
            <Button onClick={handleSendLink} disabled={sendLink.isPending}>
              {sendLink.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Invia link al cliente
            </Button>
            {linkResult && (
              <div className="space-y-2">
                <p className="text-sm text-green-600 font-medium">Link generato!</p>
                <div className="flex items-center justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopyLink}>
                    {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                    {copied ? "Copiato!" : "Copia link"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : !form.submitted_at ? (
        /* ---------- Form created, not submitted ---------- */
        <Card>
          <CardContent className="py-8 space-y-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-yellow-100 text-yellow-800">In attesa</Badge>
              <span className="text-sm text-muted-foreground">
                Link inviato il{" "}
                {new Date(form.created_at).toLocaleDateString("it-IT")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleCopyLink}>
                {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                {copied ? "Copiato!" : "Copia link"}
              </Button>
              {ownerPhone && (
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={`https://wa.me/${ownerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Ciao ${ownerName}, ti ricordo di compilare il modulo di autorizzazione: ${window.location.origin}/autorizzazioni?token=${form.token}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                    Reminder WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ---------- Submitted ---------- */
        <>
          <Card>
            <CardContent className="py-6 space-y-3">
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-800">
                  Compilato il{" "}
                  {new Date(form.submitted_at).toLocaleDateString("it-IT")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Read-only form data */}
          <ReadOnlySection title="Dati personali" fields={[
            ["Cognome", form.cognome], ["Nome", form.nome],
            ["Nato/a a", form.nato_a], ["Prov.", form.nato_prov],
            ["Data nascita", form.nato_il ? new Date(form.nato_il).toLocaleDateString("it-IT") : null],
            ["Codice Fiscale", form.codice_fiscale],
            ["Residente a", form.residente_a], ["CAP", form.residente_cap],
            ["Indirizzo", form.indirizzo_res],
            ["Telefono", form.telefono], ["Email", form.email],
            ["PEC", form.pec],
          ]} />

          <ReadOnlySection title="Ruolo" fields={[
            ["Qualità", form.ruolo],
          ]} />

          <ReadOnlySection title="Immobile" fields={[
            ["Via nel comune", form.immobile_via], ["N. civico", form.immobile_n],
            ["Indirizzo", form.immobile_indirizzo], ["N.", form.immobile_n2],
            ["Piano", form.immobile_piano],
            ["Comune", form.immobile_comune], ["CAP", form.immobile_cap],
            ["Provincia", form.immobile_prov],
          ]} />

          <ReadOnlySection title="Dati catastali" fields={[
            ["Sezione", form.sezione], ["Foglio", form.foglio],
            ["Particella", form.particella], ["Sub", form.sub],
            ["Categoria", form.categoria],
          ]} />

          <ReadOnlySection title="Disponibilità" fields={[
            ["Denominazione", form.denominazione],
            ["N. camere", form.n_camere], ["N. bagni", form.n_bagni],
            ["N. posti letto", form.n_posti_letto],
            ["Periodo", form.periodo_disponibilita],
            ["Luogo e data", form.luogo_data],
          ]} />

          {/* Generate PDF button (when no documents yet) */}
          {(!form.documents || form.documents.length === 0) && (
            <Card>
              <CardContent className="py-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Nessun documento generato. Assicurati di aver caricato un template PDF in Template PDF.
                </p>
                <Button onClick={handleGeneratePdf} disabled={generatePdf.isPending}>
                  {generatePdf.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <FileText className="mr-2 h-4 w-4" />
                  Genera PDF
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Generated documents */}
          {form.documents && form.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documenti generati</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {form.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-md border"
                  >
                    <div>
                      <p className="text-sm font-medium">{doc.template.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Generato il{" "}
                        {new Date(doc.generated_at).toLocaleDateString("it-IT")}
                      </p>
                      {doc.sent_to_client_at && (
                        <div className="flex items-center gap-1 mt-1">
                          <Mail className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600">
                            Inviato il{" "}
                            {new Date(doc.sent_to_client_at).toLocaleDateString("it-IT")}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={doc.generated_url} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          Scarica PDF
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}

                {!form.documents[0]?.sent_to_client_at && ownerEmail && (
                  <Button
                    onClick={handleSendToClient}
                    disabled={sendToClient.isPending}
                    className="w-full"
                  >
                    {sendToClient.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Send className="mr-2 h-4 w-4" />
                    Invia al cliente per firma
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// Read-only section
// ============================================

function ReadOnlySection({
  title,
  fields,
}: {
  title: string;
  fields: [string, string | number | null | undefined][];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {fields.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium">
                {value !== null && value !== undefined && value !== "" ? String(value) : "—"}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
