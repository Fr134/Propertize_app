"use client";

import { use, useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Upload, Loader2, Check, Plus, Trash2 } from "lucide-react";
import {
  useOnboardingFileByToken,
  useSaveOnboardingFile,
  useSubmitOnboardingFile,
} from "@/hooks/use-onboarding-file";
import type {
  OnboardingFileData,
  OnboardingFileRoom,
  OnboardingFileBathroom,
} from "@/hooks/use-onboarding-file";
import { useUploadThing } from "@/lib/uploadthing-client";

// ============================================
// Required fields list (for progress bar)
// ============================================
const REQUIRED_FIELDS: (keyof OnboardingFileData)[] = [
  "owner_first_name", "owner_last_name", "owner_fiscal_code",
  "billing_type", "owner_language", "owner_birth_date",
  "owner_phone", "owner_email",
  "residence_address", "residence_zip", "residence_country",
  "document_type", "document_number", "document_issue_place", "document_issue_date",
  "bank_account_holder", "bank_iban", "bank_name", "bank_bic_swift",
  "property_address", "property_zip", "property_floor",
  "property_intercom_name", "property_sqm_internal",
  "num_rooms", "num_bathrooms", "num_kitchens",
  "internet_provider", "wifi_name", "wifi_password", "modem_serial_number",
  "keys_availability_date", "privacy_consent",
];

function getProgress(data: OnboardingFileData): number {
  let filled = 0;
  for (const field of REQUIRED_FIELDS) {
    const val = data[field];
    if (field === "privacy_consent") {
      if (val === true) filled++;
    } else if (typeof val === "number") {
      if (val > 0) filled++;
    } else if (typeof val === "string" && val.trim() !== "") {
      filled++;
    }
  }
  return Math.round((filled / REQUIRED_FIELDS.length) * 100);
}

// ============================================
// Constants
// ============================================
const LANGUAGES = [
  "Italiano", "Inglese", "Francese", "Tedesco", "Spagnolo",
  "Portoghese", "Russo", "Cinese", "Arabo", "Altro",
];

const BED_TYPES = [
  "Matrimoniale", "Singolo", "Letto a castello", "Divano letto", "Futon",
];

const KITCHEN_AMENITIES_OPTIONS = [
  "Forno", "Microonde", "Lavastoviglie", "Frigorifero", "Congelatore",
  "Piano cottura a gas", "Piano cottura induzione", "Tostapane",
  "Bollitore", "Macchina caffè", "Moka", "Frullatore",
];

const GENERAL_AMENITIES_OPTIONS = [
  "Lavatrice", "Asciugatrice", "Ferro da stiro", "Aspirapolvere",
  "Phon", "TV", "Netflix", "Amazon Prime", "Aria condizionata",
  "Riscaldamento", "Ventilatore", "Cassaforte",
];

const SERVICES_OPTIONS = [
  "Piscina", "Giardino", "Terrazza", "Barbecue",
  "Palestra", "Sauna", "Jacuzzi", "Biciclette",
  "Ascensore", "Portineria",
];

const SAFETY_OPTIONS = [
  "Estintore", "Rilevatore CO", "Kit primo soccorso", "Rilevatore fumo",
];

const GAS_CONNECTION_TYPES = ["GPL bombola", "Metano rete", "Nessuno"];

const KITCHEN_LAYOUTS = ["Angolo cottura", "Cucina separata", "Cucina a vista"];
const KITCHEN_TYPES = ["Completa", "Angolo cottura", "Solo frigorifero"];

// ============================================
// Main Component
// ============================================
export default function OnboardingFilePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { data, isLoading, error } = useOnboardingFileByToken(token);
  const saveMutation = useSaveOnboardingFile(token);
  const submitMutation = useSubmitOnboardingFile(token);
  const [savedField, setSavedField] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // UploadThing hooks for photos and docs
  const { startUpload: uploadPhoto, isUploading: isUploadingPhoto } =
    useUploadThing("onboardingPhoto");
  const { startUpload: uploadDoc, isUploading: isUploadingDoc } =
    useUploadThing("onboardingDoc");

  const saveField = useCallback(
    (field: string, value: unknown) => {
      saveMutation.mutate({ [field]: value } as Record<string, unknown>);
      setSavedField(field);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSavedField(null), 2000);
    },
    [saveMutation]
  );

  const saveFields = useCallback(
    (fields: Record<string, unknown>) => {
      saveMutation.mutate(fields as Record<string, unknown>);
    },
    [saveMutation]
  );

  async function handleFileUpload(
    field: string,
    e: React.ChangeEvent<HTMLInputElement>,
    type: "photo" | "doc"
  ) {
    const files = e.target.files;
    if (!files?.length) return;
    try {
      const uploader = type === "photo" ? uploadPhoto : uploadDoc;
      const res = await uploader(Array.from(files));
      if (res?.[0]?.ufsUrl) {
        saveField(field, res[0].ufsUrl);
      }
    } catch {
      // error
    }
    e.target.value = "";
  }

  async function handleSubmit() {
    try {
      await submitMutation.mutateAsync();
      router.push("/onboarding/grazie");
    } catch {
      // error shown via submitMutation.error
    }
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
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-destructive">
            {error?.message || "Onboarding file non trovato"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const progress = getProgress(data);
  const isUploading = isUploadingPhoto || isUploadingDoc;

  return (
    <div className="space-y-6 pb-20">
      {/* Progress bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Completamento</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Section 0 — Before starting */}
      <FormSection title="0. Prima di iniziare">
        <FieldRadio
          label="Numero proprietari"
          value={data.num_owners || ""}
          options={["1", "2", "3", "4+"]}
          onSave={(v) => saveField("num_owners", v)}
          saved={savedField === "num_owners"}
        />
        <FieldText label="Titolo immobile" value={data.title_property} field="title_property" onSave={saveField} saved={savedField === "title_property"} />
        <FieldText label="Descrizione tipo immobile" value={data.property_type_description} field="property_type_description" onSave={saveField} saved={savedField === "property_type_description"} />
        <FieldNumber label="Numero livelli" value={data.num_levels} field="num_levels" onSave={saveField} saved={savedField === "num_levels"} />
        <FieldNumber label="Posti letto totali" value={data.total_beds} field="total_beds" onSave={saveField} saved={savedField === "total_beds"} />
      </FormSection>

      {/* Section 1 — Main owner */}
      <FormSection title="1. Proprietario principale">
        <FieldText label="Nome *" value={data.owner_first_name} field="owner_first_name" onSave={saveField} saved={savedField === "owner_first_name"} required />
        <FieldText label="Cognome *" value={data.owner_last_name} field="owner_last_name" onSave={saveField} saved={savedField === "owner_last_name"} required />
        <FieldText label="Codice fiscale / P.IVA *" value={data.owner_fiscal_code} field="owner_fiscal_code" onSave={saveField} saved={savedField === "owner_fiscal_code"} required />
        <FieldRadio
          label="Tipo fatturazione *"
          value={data.billing_type || ""}
          options={["ESENTE IVA", "10%", "Persona fisica"]}
          onSave={(v) => saveField("billing_type", v)}
          saved={savedField === "billing_type"}
        />
        <FieldSelect
          label="Lingua *"
          value={data.owner_language || ""}
          options={LANGUAGES}
          onSave={(v) => saveField("owner_language", v)}
          saved={savedField === "owner_language"}
        />
        <FieldText label="Data di nascita *" value={data.owner_birth_date} field="owner_birth_date" onSave={saveField} saved={savedField === "owner_birth_date"} type="date" required />
        <FieldText label="Telefono *" value={data.owner_phone} field="owner_phone" onSave={saveField} saved={savedField === "owner_phone"} required />
        <FieldText label="Telefono alternativo" value={data.owner_phone_alt} field="owner_phone_alt" onSave={saveField} saved={savedField === "owner_phone_alt"} />
        <FieldText label="Email *" value={data.owner_email} field="owner_email" onSave={saveField} saved={savedField === "owner_email"} type="email" required />
        <FieldText label="Email alternativa" value={data.owner_email_alt} field="owner_email_alt" onSave={saveField} saved={savedField === "owner_email_alt"} type="email" />
      </FormSection>

      {/* Section 2 — Residence */}
      <FormSection title="2. Residenza">
        <FieldText label="Indirizzo *" value={data.residence_address} field="residence_address" onSave={saveField} saved={savedField === "residence_address"} required />
        <FieldText label="CAP *" value={data.residence_zip} field="residence_zip" onSave={saveField} saved={savedField === "residence_zip"} required />
        <FieldText label="Nazione *" value={data.residence_country} field="residence_country" onSave={saveField} saved={savedField === "residence_country"} required />
      </FormSection>

      {/* Section 3 — Document */}
      <FormSection title="3. Documento">
        <FieldRadio
          label="Tipo documento *"
          value={data.document_type || ""}
          options={["Passaporto", "Carta d'identità"]}
          onSave={(v) => saveField("document_type", v)}
          saved={savedField === "document_type"}
        />
        <FieldText label="Numero *" value={data.document_number} field="document_number" onSave={saveField} saved={savedField === "document_number"} required />
        <FieldText label="Luogo emissione *" value={data.document_issue_place} field="document_issue_place" onSave={saveField} saved={savedField === "document_issue_place"} required />
        <FieldText label="Data emissione *" value={data.document_issue_date} field="document_issue_date" onSave={saveField} saved={savedField === "document_issue_date"} type="date" required />
        <FieldUpload
          label="Carica documento *"
          value={data.document_file_url}
          field="document_file_url"
          onUpload={(e) => handleFileUpload("document_file_url", e, "doc")}
          onRemove={() => saveField("document_file_url", "")}
          uploading={isUploading}
        />
      </FormSection>

      {/* Section 4 — Banking */}
      <FormSection title="4. Dati bancari">
        <FieldText label="Titolare conto *" value={data.bank_account_holder} field="bank_account_holder" onSave={saveField} saved={savedField === "bank_account_holder"} required />
        <FieldText label="IBAN *" value={data.bank_iban} field="bank_iban" onSave={saveField} saved={savedField === "bank_iban"} required />
        <FieldText label="Nome banca *" value={data.bank_name} field="bank_name" onSave={saveField} saved={savedField === "bank_name"} required />
        <FieldText label="BIC/SWIFT *" value={data.bank_bic_swift} field="bank_bic_swift" onSave={saveField} saved={savedField === "bank_bic_swift"} required />
      </FormSection>

      {/* Section 5 — Property data */}
      <FormSection title="5. Dati immobile">
        <FieldRadio
          label="Stato immobile"
          value={data.property_condition || ""}
          options={["No", "Manutenzioni semplici", "Manutenzioni complesse"]}
          onSave={(v) => saveField("property_condition", v)}
          saved={savedField === "property_condition"}
        />
        <FieldText label="Indirizzo *" value={data.property_address} field="property_address" onSave={saveField} saved={savedField === "property_address"} required />
        <FieldText label="CAP *" value={data.property_zip} field="property_zip" onSave={saveField} saved={savedField === "property_zip"} required />
        <FieldText label="Piano *" value={data.property_floor} field="property_floor" onSave={saveField} saved={savedField === "property_floor"} required />
        <FieldText label="Nome citofono *" value={data.property_intercom_name} field="property_intercom_name" onSave={saveField} saved={savedField === "property_intercom_name"} required />
        <FieldText label="Porta n." value={data.property_door_number} field="property_door_number" onSave={saveField} saved={savedField === "property_door_number"} />
        <FieldNumber label="MQ interni *" value={data.property_sqm_internal} field="property_sqm_internal" onSave={saveField} saved={savedField === "property_sqm_internal"} />
        <FieldNumber label="MQ con spazi esterni" value={data.property_sqm_external} field="property_sqm_external" onSave={saveField} saved={savedField === "property_sqm_external"} />
      </FormSection>

      {/* Section 6 — Rooms */}
      <FormSection title="6. Camere">
        <RoomsDynamic
          numRooms={data.num_rooms}
          rooms={data.rooms}
          onSave={(numRooms, rooms) => saveFields({ num_rooms: numRooms, rooms })}
        />
      </FormSection>

      {/* Section 7 — Common areas */}
      <FormSection title="7. Zone comuni">
        <FieldSwitch label="Divano letto" value={data.has_sofa_bed} field="has_sofa_bed" onSave={saveField} />
      </FormSection>

      {/* Section 8 — Bathrooms */}
      <FormSection title="8. Bagni">
        <BathroomsDynamic
          numBathrooms={data.num_bathrooms}
          bathrooms={data.bathrooms}
          onSave={(n, b) => saveFields({ num_bathrooms: n, bathrooms: b })}
        />
      </FormSection>

      {/* Section 9 — Kitchen */}
      <FormSection title="9. Cucina">
        <FieldNumber label="Numero cucine *" value={data.num_kitchens} field="num_kitchens" onSave={saveField} saved={savedField === "num_kitchens"} />
        <FieldRadio label="Layout" value={data.kitchen_layout || ""} options={KITCHEN_LAYOUTS} onSave={(v) => saveField("kitchen_layout", v)} saved={savedField === "kitchen_layout"} />
        <FieldRadio label="Tipo" value={data.kitchen_type || ""} options={KITCHEN_TYPES} onSave={(v) => saveField("kitchen_type", v)} saved={savedField === "kitchen_type"} />
        <FieldCheckboxGroup label="Dotazioni" options={KITCHEN_AMENITIES_OPTIONS} value={data.kitchen_amenities || []} onSave={(v) => saveField("kitchen_amenities", v)} />
        <FieldText label="Extra" value={data.kitchen_extra} field="kitchen_extra" onSave={saveField} saved={savedField === "kitchen_extra"} />
        <FieldTextarea label="Note cucine aggiuntive" value={data.kitchen_notes} field="kitchen_notes" onSave={saveField} saved={savedField === "kitchen_notes"} />
      </FormSection>

      {/* Section 10 — General equipment */}
      <FormSection title="10. Dotazioni generali">
        <FieldCheckboxGroup label="Dotazioni" options={GENERAL_AMENITIES_OPTIONS} value={data.general_amenities || []} onSave={(v) => saveField("general_amenities", v)} />
        <FieldText label="Provider internet *" value={data.internet_provider} field="internet_provider" onSave={saveField} saved={savedField === "internet_provider"} required />
        <FieldText label="Nome WiFi *" value={data.wifi_name} field="wifi_name" onSave={saveField} saved={savedField === "wifi_name"} required />
        <FieldText label="Password WiFi *" value={data.wifi_password} field="wifi_password" onSave={saveField} saved={savedField === "wifi_password"} required />
        <FieldText label="Numero SIM modem" value={data.modem_sim_number} field="modem_sim_number" onSave={saveField} saved={savedField === "modem_sim_number"} />
        <FieldText label="Numero seriale modem *" value={data.modem_serial_number} field="modem_serial_number" onSave={saveField} saved={savedField === "modem_serial_number"} required />
      </FormSection>

      {/* Section 11 — Self check-in */}
      <FormSection title="11. Self check-in">
        <FieldSwitch label="Ha dispositivo self check-in?" value={data.has_self_checkin_device} field="has_self_checkin_device" onSave={saveField} />
        {data.has_self_checkin_device && (
          <>
            <FieldText label="Codice *" value={data.self_checkin_code} field="self_checkin_code" onSave={saveField} saved={savedField === "self_checkin_code"} required />
            <FieldText label="Posizione *" value={data.self_checkin_position} field="self_checkin_position" onSave={saveField} saved={savedField === "self_checkin_position"} required />
            <FieldUpload label="Foto dispositivo" value={data.self_checkin_photo_url} field="self_checkin_photo_url" onUpload={(e) => handleFileUpload("self_checkin_photo_url", e, "photo")} onRemove={() => saveField("self_checkin_photo_url", "")} uploading={isUploading} />
          </>
        )}
      </FormSection>

      {/* Section 12 — Parking */}
      <FormSection title="12. Parcheggio e accessibilità">
        <FieldSwitch label="Parcheggio disponibile" value={data.has_parking} field="has_parking" onSave={saveField} />
        {data.has_parking && (
          <FieldUpload label="Foto parcheggio" value={data.parking_photo_url} field="parking_photo_url" onUpload={(e) => handleFileUpload("parking_photo_url", e, "photo")} onRemove={() => saveField("parking_photo_url", "")} uploading={isUploading} />
        )}
        <FieldSwitch label="Accesso disabili" value={data.has_disabled_access} field="has_disabled_access" onSave={saveField} />
      </FormSection>

      {/* Section 13 — Services */}
      <FormSection title="13. Servizi">
        <FieldCheckboxGroup label="Servizi disponibili" options={SERVICES_OPTIONS} value={data.services || []} onSave={(v) => saveField("services", v)} />
        <FieldSwitch label="Animali ammessi" value={data.allows_pets} field="allows_pets" onSave={saveField} />
        <FieldTextarea label="Altri servizi" value={data.other_services} field="other_services" onSave={saveField} saved={savedField === "other_services"} />
        <FieldSwitch label="Fumatori ammessi" value={data.allows_smoking} field="allows_smoking" onSave={saveField} />
      </FormSection>

      {/* Section 14 — Safety */}
      <FormSection title="14. Sicurezza">
        <FieldCheckboxGroup label="Dotazioni sicurezza" options={SAFETY_OPTIONS} value={data.safety_equipment || []} onSave={(v) => saveField("safety_equipment", v)} />
      </FormSection>

      {/* Section 15 — Installations */}
      <FormSection title="15. Impianti">
        <h4 className="text-sm font-semibold mt-2">Gas</h4>
        <FieldText label="Posizione bombola *" value={data.gas_tank_position} field="gas_tank_position" onSave={saveField} saved={savedField === "gas_tank_position"} />
        <FieldRadio label="Tipo attacco *" value={data.gas_connection_type || ""} options={GAS_CONNECTION_TYPES} onSave={(v) => saveField("gas_connection_type", v)} saved={savedField === "gas_connection_type"} />
        <FieldUpload label="Foto gas *" value={data.gas_photo_url} field="gas_photo_url" onUpload={(e) => handleFileUpload("gas_photo_url", e, "photo")} onRemove={() => saveField("gas_photo_url", "")} uploading={isUploading} />

        <h4 className="text-sm font-semibold mt-4">Elettricità</h4>
        <FieldUpload label="Foto interruttore interno *" value={data.electricity_internal_photo_url} field="electricity_internal_photo_url" onUpload={(e) => handleFileUpload("electricity_internal_photo_url", e, "photo")} onRemove={() => saveField("electricity_internal_photo_url", "")} uploading={isUploading} />
        <FieldText label="Posizione interna *" value={data.electricity_internal_position} field="electricity_internal_position" onSave={saveField} saved={savedField === "electricity_internal_position"} />
        <FieldUpload label="Foto interruttore esterno" value={data.electricity_external_photo_url} field="electricity_external_photo_url" onUpload={(e) => handleFileUpload("electricity_external_photo_url", e, "photo")} onRemove={() => saveField("electricity_external_photo_url", "")} uploading={isUploading} />
        <FieldText label="Posizione esterna" value={data.electricity_external_position} field="electricity_external_position" onSave={saveField} saved={savedField === "electricity_external_position"} />

        <h4 className="text-sm font-semibold mt-4">Acqua</h4>
        <FieldText label="Posizione interno *" value={data.water_internal_position} field="water_internal_position" onSave={saveField} saved={savedField === "water_internal_position"} />
        <FieldUpload label="Foto interno *" value={data.water_internal_photo_url} field="water_internal_photo_url" onUpload={(e) => handleFileUpload("water_internal_photo_url", e, "photo")} onRemove={() => saveField("water_internal_photo_url", "")} uploading={isUploading} />
        <FieldText label="Posizione esterno" value={data.water_external_position} field="water_external_position" onSave={saveField} saved={savedField === "water_external_position"} />
        <FieldUpload label="Foto esterno" value={data.water_external_photo_url} field="water_external_photo_url" onUpload={(e) => handleFileUpload("water_external_photo_url", e, "photo")} onRemove={() => saveField("water_external_photo_url", "")} uploading={isUploading} />
      </FormSection>

      {/* Section 16 — Bureaucracy */}
      <FormSection title="16. Burocrazia">
        <FieldUpload label="Planimetria *" value={data.planimetry_file_url} field="planimetry_file_url" onUpload={(e) => handleFileUpload("planimetry_file_url", e, "doc")} onRemove={() => saveField("planimetry_file_url", "")} uploading={isUploading} />
        <FieldUpload label="Visura catastale *" value={data.cadastral_survey_file_url} field="cadastral_survey_file_url" onUpload={(e) => handleFileUpload("cadastral_survey_file_url", e, "doc")} onRemove={() => saveField("cadastral_survey_file_url", "")} uploading={isUploading} />
        <FieldUpload label="CIN pdf *" value={data.cin_file_url} field="cin_file_url" onUpload={(e) => handleFileUpload("cin_file_url", e, "doc")} onRemove={() => saveField("cin_file_url", "")} uploading={isUploading} />
        <FieldUpload label="Alloggiati Web pdf *" value={data.alloggiati_web_file_url} field="alloggiati_web_file_url" onUpload={(e) => handleFileUpload("alloggiati_web_file_url", e, "doc")} onRemove={() => saveField("alloggiati_web_file_url", "")} uploading={isUploading} />
        <FieldText label="Credenziali ROSS1000 *" value={data.ross1000_credentials} field="ross1000_credentials" onSave={saveField} saved={savedField === "ross1000_credentials"} required />
      </FormSection>

      {/* Section 17 — Waste */}
      <FormSection title="17. Rifiuti">
        <FieldSwitch label="Presenza bidoni" value={data.has_waste_bins} field="has_waste_bins" onSave={saveField} />
        <FieldUpload label="Foto calendario rifiuti" value={data.waste_calendar_photo_url} field="waste_calendar_photo_url" onUpload={(e) => handleFileUpload("waste_calendar_photo_url", e, "photo")} onRemove={() => saveField("waste_calendar_photo_url", "")} uploading={isUploading} />
        <FieldUpload label="Foto ubicazione mastelli" value={data.waste_bins_location_photo_url} field="waste_bins_location_photo_url" onUpload={(e) => handleFileUpload("waste_bins_location_photo_url", e, "photo")} onRemove={() => saveField("waste_bins_location_photo_url", "")} uploading={isUploading} />
        <FieldTextarea label="Note rifiuti" value={data.waste_notes} field="waste_notes" onSave={saveField} saved={savedField === "waste_notes"} />
      </FormSection>

      {/* Section 18 — Conclusion */}
      <FormSection title="18. Conclusione">
        <FieldText label="Data disponibilità chiavi *" value={data.keys_availability_date} field="keys_availability_date" onSave={saveField} saved={savedField === "keys_availability_date"} type="date" required />
        <FieldTextarea label="Date da bloccare" value={data.dates_to_block} field="dates_to_block" onSave={saveField} saved={savedField === "dates_to_block"} placeholder="Es. 25/12 - 06/01, 15/08 - 20/08" />

        <div className="flex items-start gap-3 mt-4 p-4 border rounded-md bg-muted/30">
          <Checkbox
            id="privacy"
            checked={data.privacy_consent === true}
            onCheckedChange={(checked) =>
              saveField("privacy_consent", checked === true)
            }
          />
          <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
            Acconsento al trattamento dei dati personali ai sensi del GDPR
            (Regolamento UE 2016/679). I dati forniti saranno utilizzati
            esclusivamente per la gestione del servizio di property management. *
          </Label>
        </div>
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
                {submitMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Invia onboarding file
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Conferma invio</AlertDialogTitle>
                <AlertDialogDescription>
                  Sei sicuro di voler inviare l&apos;onboarding file? Dopo l&apos;invio
                  non sarà più possibile modificare i dati.
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
  );
}

// ============================================
// Subcomponents
// ============================================

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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
  value,
  field,
  onSave,
  saved,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value?: string | null;
  field: string;
  onSave: (field: string, value: string) => void;
  saved?: boolean;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value || "");
  const prevValue = useRef(value || "");

  useEffect(() => {
    if (value !== undefined && value !== null && value !== prevValue.current) {
      setLocal(value);
      prevValue.current = value;
    }
  }, [value]);

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
          if (local !== (value || "")) onSave(field, local);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(field, local);
        }}
        placeholder={placeholder}
        required={required}
        className="text-sm"
      />
    </div>
  );
}

function FieldTextarea({
  label,
  value,
  field,
  onSave,
  saved,
  placeholder,
}: {
  label: string;
  value?: string | null;
  field: string;
  onSave: (field: string, value: string) => void;
  saved?: boolean;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value || "");

  useEffect(() => {
    if (value !== undefined && value !== null) setLocal(value);
  }, [value]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm">{label}</Label>
        <SavedBadge saved={saved} />
      </div>
      <Textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== (value || "")) onSave(field, local);
        }}
        placeholder={placeholder}
        className="text-sm"
        rows={3}
      />
    </div>
  );
}

function FieldNumber({
  label,
  value,
  field,
  onSave,
  saved,
}: {
  label: string;
  value?: number | null;
  field: string;
  onSave: (field: string, value: number | null) => void;
  saved?: boolean;
}) {
  const [local, setLocal] = useState(value?.toString() || "");

  useEffect(() => {
    if (value !== undefined && value !== null) setLocal(value.toString());
  }, [value]);

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
          if (num !== value) onSave(field, num);
        }}
        className="text-sm"
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
      <RadioGroup
        value={value}
        onValueChange={onSave}
        className="flex flex-wrap gap-3"
      >
        {options.map((opt) => (
          <div key={opt} className="flex items-center gap-1.5">
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

function FieldSelect({
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
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm">{label}</Label>
        <SavedBadge saved={saved} />
      </div>
      <Select value={value} onValueChange={onSave}>
        <SelectTrigger className="text-sm">
          <SelectValue placeholder="Seleziona..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FieldSwitch({
  label,
  value,
  field,
  onSave,
}: {
  label: string;
  value?: boolean | null;
  field: string;
  onSave: (field: string, value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Switch
        checked={value === true}
        onCheckedChange={(checked) => onSave(field, checked)}
      />
    </div>
  );
}

function FieldUpload({
  label,
  value,
  field,
  onUpload,
  onRemove,
  uploading,
}: {
  label: string;
  value?: string | null;
  field: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  uploading: boolean;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      {value ? (
        <div className="flex items-center gap-2 mt-1">
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Apri file
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-destructive"
            onClick={onRemove}
          >
            Rimuovi
          </Button>
        </div>
      ) : (
        <Label className="cursor-pointer block mt-1">
          <span className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Upload className="h-3 w-3" />
            {uploading ? "Caricamento..." : "Carica file"}
          </span>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={onUpload}
            disabled={uploading}
          />
        </Label>
      )}
    </div>
  );
}

function FieldCheckboxGroup({
  label,
  options,
  value,
  onSave,
}: {
  label: string;
  options: string[];
  value: string[];
  onSave: (value: string[]) => void;
}) {
  const toggle = (opt: string) => {
    const next = value.includes(opt)
      ? value.filter((v) => v !== opt)
      : [...value, opt];
    onSave(next);
  };

  return (
    <div>
      <Label className="text-sm mb-2 block">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <div key={opt} className="flex items-center gap-2">
            <Checkbox
              id={`cb-${opt}`}
              checked={value.includes(opt)}
              onCheckedChange={() => toggle(opt)}
            />
            <Label
              htmlFor={`cb-${opt}`}
              className="text-sm cursor-pointer"
            >
              {opt}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Dynamic sections
// ============================================

function RoomsDynamic({
  numRooms,
  rooms,
  onSave,
}: {
  numRooms?: number | null;
  rooms?: OnboardingFileRoom[] | null;
  onSave: (numRooms: number, rooms: OnboardingFileRoom[]) => void;
}) {
  const [num, setNum] = useState(numRooms || 0);
  const [items, setItems] = useState<OnboardingFileRoom[]>(rooms || []);

  function handleNumChange(val: string) {
    const n = parseInt(val, 10) || 0;
    setNum(n);
    const next = [...items];
    while (next.length < n) next.push({ bed_type: "", has_ac: false });
    while (next.length > n) next.pop();
    setItems(next);
    onSave(n, next);
  }

  function updateRoom(idx: number, field: keyof OnboardingFileRoom, value: unknown) {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
    onSave(num, next);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm">Numero camere *</Label>
        <Input
          type="number"
          value={num || ""}
          onChange={(e) => handleNumChange(e.target.value)}
          className="text-sm w-32 mt-1"
          min={0}
        />
      </div>
      {items.map((room, idx) => (
        <div key={idx} className="flex items-center gap-3 rounded-md border p-3">
          <span className="text-sm font-medium shrink-0">Camera {idx + 1}</span>
          <Select
            value={room.bed_type || ""}
            onValueChange={(v) => updateRoom(idx, "bed_type", v)}
          >
            <SelectTrigger className="text-sm flex-1">
              <SelectValue placeholder="Tipo letto" />
            </SelectTrigger>
            <SelectContent>
              {BED_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <Switch
              checked={room.has_ac === true}
              onCheckedChange={(v) => updateRoom(idx, "has_ac", v)}
            />
            <span className="text-xs text-muted-foreground">AC</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BathroomsDynamic({
  numBathrooms,
  bathrooms,
  onSave,
}: {
  numBathrooms?: number | null;
  bathrooms?: OnboardingFileBathroom[] | null;
  onSave: (n: number, b: OnboardingFileBathroom[]) => void;
}) {
  const [num, setNum] = useState(numBathrooms || 0);
  const [items, setItems] = useState<OnboardingFileBathroom[]>(bathrooms || []);

  const BATHROOM_AMENITIES = [
    "Doccia", "Vasca", "Bidet", "Lavatrice", "Asciugatrice",
  ];

  function handleNumChange(val: string) {
    const n = parseInt(val, 10) || 0;
    setNum(n);
    const next = [...items];
    while (next.length < n) next.push({ position: "", amenities: [] });
    while (next.length > n) next.pop();
    setItems(next);
    onSave(n, next);
  }

  function updateBathroom(idx: number, field: string, value: unknown) {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
    onSave(num, next);
  }

  function toggleAmenity(idx: number, amenity: string) {
    const current = items[idx]?.amenities || [];
    const next = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    updateBathroom(idx, "amenities", next);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm">Numero bagni *</Label>
        <Input
          type="number"
          value={num || ""}
          onChange={(e) => handleNumChange(e.target.value)}
          className="text-sm w-32 mt-1"
          min={0}
        />
      </div>
      {items.map((bath, idx) => (
        <div key={idx} className="rounded-md border p-3 space-y-2">
          <span className="text-sm font-medium">Bagno {idx + 1}</span>
          <Input
            placeholder="Posizione (es. Piano terra, Camera matrimoniale)"
            value={bath.position || ""}
            onChange={(e) => updateBathroom(idx, "position", e.target.value)}
            onBlur={() => onSave(num, items)}
            className="text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {BATHROOM_AMENITIES.map((a) => (
              <div key={a} className="flex items-center gap-1.5">
                <Checkbox
                  checked={(bath.amenities || []).includes(a)}
                  onCheckedChange={() => toggleAmenity(idx, a)}
                />
                <span className="text-xs">{a}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
