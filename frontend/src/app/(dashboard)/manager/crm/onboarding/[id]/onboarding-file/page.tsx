"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { useOnboardingFileByOwner } from "@/hooks/use-onboarding-file";
import type { OnboardingFileData } from "@/hooks/use-onboarding-file";

export default function OnboardingFileViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ownerId } = use(params);
  const { data, isLoading, error } = useOnboardingFileByOwner(ownerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/manager/crm/onboarding/${ownerId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground text-center py-8">
          {error?.message || "Onboarding file non trovato"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/manager/crm/onboarding/${ownerId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            <FileText className="inline mr-2 h-6 w-6" />
            Onboarding File
          </h1>
          {data.submitted_at && (
            <p className="text-sm text-muted-foreground mt-1">
              Inviato il{" "}
              {new Date(data.submitted_at).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <Badge
          className={
            data.status === "SUBMITTED"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }
        >
          {data.status === "SUBMITTED" ? "Compilato" : "Bozza"}
        </Badge>
      </div>

      <ReadOnlySection title="0. Prima di iniziare">
        <Field label="Numero proprietari" value={data.num_owners} />
        <Field label="Titolo immobile" value={data.title_property} />
        <Field label="Tipo immobile" value={data.property_type_description} />
        <Field label="Numero livelli" value={data.num_levels} />
        <Field label="Posti letto totali" value={data.total_beds} />
      </ReadOnlySection>

      <ReadOnlySection title="1. Proprietario principale">
        <Field label="Nome" value={data.owner_first_name} />
        <Field label="Cognome" value={data.owner_last_name} />
        <Field label="Codice fiscale / P.IVA" value={data.owner_fiscal_code} />
        <Field label="Tipo fatturazione" value={data.billing_type} />
        <Field label="Lingua" value={data.owner_language} />
        <Field label="Data di nascita" value={data.owner_birth_date} />
        <Field label="Telefono" value={data.owner_phone} />
        <Field label="Telefono alternativo" value={data.owner_phone_alt} />
        <Field label="Email" value={data.owner_email} />
        <Field label="Email alternativa" value={data.owner_email_alt} />
      </ReadOnlySection>

      <ReadOnlySection title="2. Residenza">
        <Field label="Indirizzo" value={data.residence_address} />
        <Field label="CAP" value={data.residence_zip} />
        <Field label="Nazione" value={data.residence_country} />
      </ReadOnlySection>

      <ReadOnlySection title="3. Documento">
        <Field label="Tipo documento" value={data.document_type} />
        <Field label="Numero" value={data.document_number} />
        <Field label="Luogo emissione" value={data.document_issue_place} />
        <Field label="Data emissione" value={data.document_issue_date} />
        <FileField label="Documento" url={data.document_file_url} />
      </ReadOnlySection>

      <ReadOnlySection title="4. Dati bancari">
        <Field label="Titolare conto" value={data.bank_account_holder} />
        <Field label="IBAN" value={data.bank_iban} />
        <Field label="Nome banca" value={data.bank_name} />
        <Field label="BIC/SWIFT" value={data.bank_bic_swift} />
      </ReadOnlySection>

      <ReadOnlySection title="5. Dati immobile">
        <Field label="Stato immobile" value={data.property_condition} />
        <Field label="Indirizzo" value={data.property_address} />
        <Field label="CAP" value={data.property_zip} />
        <Field label="Piano" value={data.property_floor} />
        <Field label="Nome citofono" value={data.property_intercom_name} />
        <Field label="Porta n." value={data.property_door_number} />
        <Field label="MQ interni" value={data.property_sqm_internal} />
        <Field label="MQ con spazi esterni" value={data.property_sqm_external} />
      </ReadOnlySection>

      <ReadOnlySection title="6. Camere">
        <Field label="Numero camere" value={data.num_rooms} />
        {data.rooms?.map((room, i) => (
          <div key={i} className="border rounded-md p-3 space-y-1">
            <p className="text-sm font-medium">Camera {i + 1}</p>
            <Field label="Tipo letto" value={room.bed_type} />
            <Field label="Aria condizionata" value={room.has_ac ? "Si" : "No"} />
          </div>
        ))}
      </ReadOnlySection>

      <ReadOnlySection title="7. Zone comuni">
        <Field label="Divano letto" value={data.has_sofa_bed ? "Si" : data.has_sofa_bed === false ? "No" : null} />
      </ReadOnlySection>

      <ReadOnlySection title="8. Bagni">
        <Field label="Numero bagni" value={data.num_bathrooms} />
        {data.bathrooms?.map((bath, i) => (
          <div key={i} className="border rounded-md p-3 space-y-1">
            <p className="text-sm font-medium">Bagno {i + 1}</p>
            <Field label="Posizione" value={bath.position} />
            <Field label="Dotazioni" value={bath.amenities?.join(", ")} />
          </div>
        ))}
      </ReadOnlySection>

      <ReadOnlySection title="9. Cucina">
        <Field label="Numero cucine" value={data.num_kitchens} />
        <Field label="Layout" value={data.kitchen_layout} />
        <Field label="Tipo" value={data.kitchen_type} />
        <Field label="Dotazioni" value={data.kitchen_amenities?.join(", ")} />
        <Field label="Extra" value={data.kitchen_extra} />
        <Field label="Note" value={data.kitchen_notes} />
      </ReadOnlySection>

      <ReadOnlySection title="10. Dotazioni generali">
        <Field label="Dotazioni" value={data.general_amenities?.join(", ")} />
        <Field label="Provider internet" value={data.internet_provider} />
        <Field label="Nome WiFi" value={data.wifi_name} />
        <Field label="Password WiFi" value={data.wifi_password} />
        <Field label="Numero SIM modem" value={data.modem_sim_number} />
        <Field label="Numero seriale modem" value={data.modem_serial_number} />
      </ReadOnlySection>

      <ReadOnlySection title="11. Self check-in">
        <Field label="Ha dispositivo" value={data.has_self_checkin_device ? "Si" : data.has_self_checkin_device === false ? "No" : null} />
        {data.has_self_checkin_device && (
          <>
            <Field label="Codice" value={data.self_checkin_code} />
            <Field label="Posizione" value={data.self_checkin_position} />
            <FileField label="Foto" url={data.self_checkin_photo_url} />
          </>
        )}
      </ReadOnlySection>

      <ReadOnlySection title="12. Parcheggio e accessibilità">
        <Field label="Parcheggio" value={data.has_parking ? "Si" : data.has_parking === false ? "No" : null} />
        {data.has_parking && <FileField label="Foto parcheggio" url={data.parking_photo_url} />}
        <Field label="Accesso disabili" value={data.has_disabled_access ? "Si" : data.has_disabled_access === false ? "No" : null} />
      </ReadOnlySection>

      <ReadOnlySection title="13. Servizi">
        <Field label="Servizi" value={data.services?.join(", ")} />
        <Field label="Animali ammessi" value={data.allows_pets ? "Si" : data.allows_pets === false ? "No" : null} />
        <Field label="Altri servizi" value={data.other_services} />
        <Field label="Fumatori" value={data.allows_smoking ? "Si" : data.allows_smoking === false ? "No" : null} />
      </ReadOnlySection>

      <ReadOnlySection title="14. Sicurezza">
        <Field label="Dotazioni" value={data.safety_equipment?.join(", ")} />
      </ReadOnlySection>

      <ReadOnlySection title="15. Impianti">
        <p className="text-sm font-semibold text-muted-foreground">Gas</p>
        <Field label="Posizione bombola" value={data.gas_tank_position} />
        <Field label="Tipo attacco" value={data.gas_connection_type} />
        <FileField label="Foto gas" url={data.gas_photo_url} />

        <p className="text-sm font-semibold text-muted-foreground mt-3">Elettricità</p>
        <FileField label="Foto interruttore interno" url={data.electricity_internal_photo_url} />
        <Field label="Posizione interna" value={data.electricity_internal_position} />
        <FileField label="Foto interruttore esterno" url={data.electricity_external_photo_url} />
        <Field label="Posizione esterna" value={data.electricity_external_position} />

        <p className="text-sm font-semibold text-muted-foreground mt-3">Acqua</p>
        <Field label="Posizione interno" value={data.water_internal_position} />
        <FileField label="Foto interno" url={data.water_internal_photo_url} />
        <Field label="Posizione esterno" value={data.water_external_position} />
        <FileField label="Foto esterno" url={data.water_external_photo_url} />
      </ReadOnlySection>

      <ReadOnlySection title="16. Burocrazia">
        <FileField label="Planimetria" url={data.planimetry_file_url} />
        <FileField label="Visura catastale" url={data.cadastral_survey_file_url} />
        <FileField label="CIN" url={data.cin_file_url} />
        <FileField label="Alloggiati Web" url={data.alloggiati_web_file_url} />
        <Field label="Credenziali ROSS1000" value={data.ross1000_credentials} />
      </ReadOnlySection>

      <ReadOnlySection title="17. Rifiuti">
        <Field label="Presenza bidoni" value={data.has_waste_bins ? "Si" : data.has_waste_bins === false ? "No" : null} />
        <FileField label="Calendario rifiuti" url={data.waste_calendar_photo_url} />
        <FileField label="Ubicazione mastelli" url={data.waste_bins_location_photo_url} />
        <Field label="Note" value={data.waste_notes} />
      </ReadOnlySection>

      <ReadOnlySection title="18. Conclusione">
        <Field label="Data disponibilità chiavi" value={data.keys_availability_date} />
        <Field label="Date da bloccare" value={data.dates_to_block} />
        <Field label="Privacy" value={data.privacy_consent ? "Accettata" : "Non accettata"} />
      </ReadOnlySection>
    </div>
  );
}

function ReadOnlySection({
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
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm text-muted-foreground min-w-[180px] shrink-0">
        {label}:
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function FileField({
  label,
  url,
}: {
  label: string;
  url?: string | null;
}) {
  if (!url) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground min-w-[180px] shrink-0">
        {label}:
      </span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary hover:underline flex items-center gap-1"
      >
        <ExternalLink className="h-3 w-3" />
        Apri file
      </a>
    </div>
  );
}
