"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Check } from "lucide-react";
import {
  useAuthFormByToken,
  useSaveAuthForm,
  useSubmitAuthForm,
} from "@/hooks/use-authorizations";
import type { AuthorizationFormData } from "@/hooks/use-authorizations";

// ============================================
// Required fields for progress + validation
// ============================================
const REQUIRED_FIELDS = [
  "cognome", "nome", "nato_a", "nato_prov", "nato_il",
  "codice_fiscale", "residente_a", "residente_cap", "indirizzo_res",
  "telefono", "email", "ruolo",
  "immobile_via", "immobile_n",
  "immobile_indirizzo", "immobile_comune", "immobile_cap", "immobile_prov",
  "foglio", "particella",
  "n_camere", "n_bagni", "n_posti_letto", "periodo_disponibilita",
] as const;

function getProgress(data: Record<string, unknown>): number {
  let filled = 0;
  for (const field of REQUIRED_FIELDS) {
    const val = data[field];
    if (val === null || val === undefined || val === "") continue;
    // Numbers: 0 is a valid value for fields like n_camere
    if (typeof val === "number") { filled++; continue; }
    // Strings: non-empty after trimming
    if (typeof val === "string" && val.trim() !== "") { filled++; continue; }
    // Other truthy values
    if (val) filled++;
  }
  return Math.round((filled / REQUIRED_FIELDS.length) * 100);
}

// ============================================
// Main page with Suspense boundary
// ============================================
export default function AutorizzazioniPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AutorizzazioniForm />
    </Suspense>
  );
}

// ============================================
// Form component
// ============================================
function AutorizzazioniForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();
  const { data, isLoading, error } = useAuthFormByToken(token);
  const saveMutation = useSaveAuthForm(token);
  const submitMutation = useSubmitAuthForm(token);
  const [savedField, setSavedField] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Local form state merged from server data
  const [form, setForm] = useState<Record<string, unknown>>({});

  // Sync server data into local state on load
  useEffect(() => {
    if (data) {
      const fields: Record<string, unknown> = {};
      const allFields = [
        "cognome", "nome", "nato_a", "nato_prov", "nato_il",
        "codice_fiscale", "residente_a", "residente_cap", "indirizzo_res",
        "telefono", "email", "pec", "ruolo",
        "immobile_via", "immobile_n", "immobile_indirizzo", "immobile_n2",
        "immobile_piano", "immobile_comune", "immobile_cap", "immobile_prov",
        "sezione", "foglio", "particella", "sub", "categoria",
        "denominazione", "n_camere", "n_bagni", "n_posti_letto",
        "periodo_disponibilita", "luogo_data",
      ];
      for (const f of allFields) {
        fields[f] = (data as unknown as Record<string, unknown>)[f] ?? "";
      }
      setForm(fields);
    }
  }, [data]);

  const saveField = useCallback(
    (field: string, value: unknown) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      saveMutation.mutate({ [field]: value });
      setSavedField(field);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSavedField(null), 2000);
    },
    [saveMutation]
  );

  async function handleSubmit() {
    try {
      await submitMutation.mutateAsync(form);
      router.push("/autorizzazioni/grazie");
    } catch {
      // error shown via submitMutation.error
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-sm w-full">
          <CardContent className="py-10 text-center">
            <p className="text-destructive">Link non valido o scaduto</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-sm w-full">
          <CardContent className="py-10 text-center">
            <p className="text-destructive">
              {error?.message || "Link non valido o scaduto"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.submitted_at) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-sm w-full">
          <CardContent className="py-10 text-center space-y-2">
            <Check className="h-10 w-10 text-green-500 mx-auto" />
            <p className="font-medium">Modulo già inviato</p>
            <p className="text-sm text-muted-foreground">
              Questo modulo è stato compilato il{" "}
              {new Date(data.submitted_at).toLocaleDateString("it-IT")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = getProgress(form);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto max-w-lg px-4 py-8 sm:py-12 space-y-6 pb-20">
        {/* Header */}
        <div className="text-center">
          <Image
            src="/propertize-logo.png"
            alt="Propertize"
            width={240}
            height={60}
            className="h-14 w-auto mx-auto rounded-lg"
            priority
          />
          <p className="mt-3 text-sm text-muted-foreground">
            Modulo autorizzazioni per <strong>{data.owner_name}</strong>
          </p>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Completamento</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Section: Dati personali */}
        <FormSection title="Dati personali">
          <FieldText label="Cognome *" field="cognome" form={form} onSave={saveField} saved={savedField === "cognome"} />
          <FieldText label="Nome *" field="nome" form={form} onSave={saveField} saved={savedField === "nome"} />
          <FieldText label="Nato/a a *" field="nato_a" form={form} onSave={saveField} saved={savedField === "nato_a"} />
          <FieldText label="Provincia *" field="nato_prov" form={form} onSave={saveField} saved={savedField === "nato_prov"} />
          <FieldText label="Data di nascita *" field="nato_il" form={form} onSave={saveField} saved={savedField === "nato_il"} type="date" />
          <FieldText label="Codice Fiscale *" field="codice_fiscale" form={form} onSave={saveField} saved={savedField === "codice_fiscale"} />
          <FieldText label="Residente a *" field="residente_a" form={form} onSave={saveField} saved={savedField === "residente_a"} />
          <FieldText label="CAP *" field="residente_cap" form={form} onSave={saveField} saved={savedField === "residente_cap"} />
          <FieldText label="Indirizzo residenza *" field="indirizzo_res" form={form} onSave={saveField} saved={savedField === "indirizzo_res"} />
          <FieldText label="Telefono *" field="telefono" form={form} onSave={saveField} saved={savedField === "telefono"} />
          <FieldText label="Email *" field="email" form={form} onSave={saveField} saved={savedField === "email"} type="email" />
          <FieldText label="PEC (opzionale)" field="pec" form={form} onSave={saveField} saved={savedField === "pec"} />
        </FormSection>

        {/* Section: Ruolo */}
        <FormSection title="Ruolo">
          <FieldRadio
            label="In qualità di *"
            value={(form.ruolo as string) || ""}
            options={["Proprietario", "Locatario/sublocatario/comodatario"]}
            onSave={(v) => saveField("ruolo", v)}
            saved={savedField === "ruolo"}
          />
        </FormSection>

        {/* Section: Immobile (via nel comune) */}
        <FormSection title="Immobile (via nel comune)">
          <FieldText label="Via nel comune *" field="immobile_via" form={form} onSave={saveField} saved={savedField === "immobile_via"} />
          <FieldText label="Numero civico *" field="immobile_n" form={form} onSave={saveField} saved={savedField === "immobile_n"} />
        </FormSection>

        {/* Section: Dati immobile */}
        <FormSection title="Dati immobile">
          <FieldText label="Indirizzo completo *" field="immobile_indirizzo" form={form} onSave={saveField} saved={savedField === "immobile_indirizzo"} />
          <FieldText label="N. civico" field="immobile_n2" form={form} onSave={saveField} saved={savedField === "immobile_n2"} />
          <FieldText label="Piano" field="immobile_piano" form={form} onSave={saveField} saved={savedField === "immobile_piano"} />
          <FieldText label="Comune *" field="immobile_comune" form={form} onSave={saveField} saved={savedField === "immobile_comune"} />
          <FieldText label="CAP *" field="immobile_cap" form={form} onSave={saveField} saved={savedField === "immobile_cap"} />
          <FieldText label="Provincia *" field="immobile_prov" form={form} onSave={saveField} saved={savedField === "immobile_prov"} />
        </FormSection>

        {/* Section: Dati catastali */}
        <FormSection title="Dati catastali">
          <FieldText label="Sezione" field="sezione" form={form} onSave={saveField} saved={savedField === "sezione"} />
          <FieldText label="Foglio *" field="foglio" form={form} onSave={saveField} saved={savedField === "foglio"} />
          <FieldText label="Particella *" field="particella" form={form} onSave={saveField} saved={savedField === "particella"} />
          <FieldText label="Sub" field="sub" form={form} onSave={saveField} saved={savedField === "sub"} />
          <FieldText label="Categoria" field="categoria" form={form} onSave={saveField} saved={savedField === "categoria"} />
        </FormSection>

        {/* Section: Disponibilità */}
        <FormSection title="Disponibilità">
          <FieldText label="Denominazione immobile" field="denominazione" form={form} onSave={saveField} saved={savedField === "denominazione"} />
          <FieldNumber label="N. camere da letto *" field="n_camere" form={form} onSave={saveField} saved={savedField === "n_camere"} />
          <FieldNumber label="N. bagni *" field="n_bagni" form={form} onSave={saveField} saved={savedField === "n_bagni"} />
          <FieldNumber label="N. posti letto *" field="n_posti_letto" form={form} onSave={saveField} saved={savedField === "n_posti_letto"} />
          <FieldText label="Periodo di disponibilità *" field="periodo_disponibilita" form={form} onSave={saveField} saved={savedField === "periodo_disponibilita"} placeholder="Es: Tutto l'anno, Giugno-Settembre" />
          <FieldText label="Luogo e data" field="luogo_data" form={form} onSave={saveField} saved={savedField === "luogo_data"} placeholder="Es: Cagliari, 05/03/2026" />
        </FormSection>

        {/* Submit */}
        <Card>
          <CardContent className="pt-6">
            {submitMutation.error && (
              <p className="text-sm text-destructive mb-4">
                {submitMutation.error.message}
              </p>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={progress < 100 || submitMutation.isPending}
                >
                  {submitMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Invia modulo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Conferma invio</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sei sicuro di voler inviare il modulo? Dopo l&apos;invio non
                    sarà più possibile modificare i dati.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit}>
                    Conferma invio
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {progress < 100 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Completa tutti i campi obbligatori per abilitare l&apos;invio
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// Subcomponents
// ============================================

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function SavedBadge({ saved }: { saved?: boolean }) {
  if (!saved) return null;
  return (
    <span className="text-xs text-green-600 flex items-center gap-0.5">
      <Check className="h-3 w-3" /> Salvato
    </span>
  );
}

function FieldText({
  label,
  field,
  form,
  onSave,
  saved,
  type = "text",
  placeholder,
}: {
  label: string;
  field: string;
  form: Record<string, unknown>;
  onSave: (field: string, value: string) => void;
  saved?: boolean;
  type?: string;
  placeholder?: string;
}) {
  const serverVal = (form[field] as string) || "";
  const [local, setLocal] = useState(serverVal);
  const prevVal = useRef(serverVal);

  useEffect(() => {
    if (serverVal !== prevVal.current) {
      setLocal(serverVal);
      prevVal.current = serverVal;
    }
  }, [serverVal]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm">{label}</Label>
        <SavedBadge saved={saved} />
      </div>
      <Input
        type={type}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== serverVal) onSave(field, local);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(field, local);
        }}
        placeholder={placeholder}
        className="text-sm"
      />
    </div>
  );
}

function FieldNumber({
  label,
  field,
  form,
  onSave,
  saved,
}: {
  label: string;
  field: string;
  form: Record<string, unknown>;
  onSave: (field: string, value: number | null) => void;
  saved?: boolean;
}) {
  const serverVal = form[field] as number | null;
  const [local, setLocal] = useState(serverVal?.toString() || "");

  useEffect(() => {
    if (serverVal !== undefined && serverVal !== null) setLocal(serverVal.toString());
  }, [serverVal]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm">{label}</Label>
        <SavedBadge saved={saved} />
      </div>
      <Input
        type="number"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          const num = local ? parseInt(local, 10) : null;
          if (num !== serverVal) onSave(field, num);
        }}
        className="text-sm"
        min={0}
      />
    </div>
  );
}

function FieldRadio({
  label,
  value,
  options,
  onSave,
  saved,
}: {
  label: string;
  value: string;
  options: string[];
  onSave: (value: string) => void;
  saved?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm">{label}</Label>
        <SavedBadge saved={saved} />
      </div>
      <RadioGroup value={value} onValueChange={onSave} className="space-y-2">
        {options.map((opt) => (
          <div key={opt} className="flex items-center gap-2">
            <RadioGroupItem value={opt} id={`radio-${opt}`} />
            <Label htmlFor={`radio-${opt}`} className="text-sm cursor-pointer">
              {opt}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
