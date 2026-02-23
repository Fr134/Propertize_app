"use client";

import { use, useCallback } from "react";
import Link from "next/link";
import { useMasterfile, useUpdateMasterfile } from "@/hooks/use-masterfile";
import type { ApplianceItem, CustomerCareQAItem, DocumentItem, RequiredPhotoItem } from "@/hooks/use-masterfile";
import { usePropertyOperational } from "@/hooks/use-masterfile";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Key,
  Zap,
  Wifi,
  Refrigerator,
  Thermometer,
  Trash2,
  Shield,
  Wrench,
  Package,
  HelpCircle,
  FileText,
  Camera,
} from "lucide-react";
import { MasterfileSection } from "@/components/masterfile/masterfile-section";
import { MasterfileField } from "@/components/masterfile/masterfile-field";
import { MasterfilePhotoField } from "@/components/masterfile/masterfile-photo-field";
import { ApplianceCard } from "@/components/masterfile/appliance-card";
import { CustomerCareQA } from "@/components/masterfile/customer-care-qa";
import { DocumentsList } from "@/components/masterfile/documents-list";

const DEFAULT_APPLIANCE_TYPES = [
  "Frigo", "Forno", "Piano cottura", "Lavastoviglie", "Lavatrice",
  "Asciugatrice", "Microonde", "TV", "Climatizzatore", "Caldaia",
  "Scaldabagno", "Macchina caffè", "Asciugacapelli", "Ferro da stiro",
];

const DEFAULT_QA: CustomerCareQAItem[] = [
  { question: "Dove si trova il salvavita?", answer: "" },
  { question: "Come si riavvia il WiFi?", answer: "" },
  { question: "Come si accende la caldaia?", answer: "" },
  { question: "Come si spegne il piano a induzione?", answer: "" },
  { question: "Dove buttare l'umido?", answer: "" },
  { question: "Dove parcheggiare?", answer: "" },
  { question: "Cosa fare se salta la corrente?", answer: "" },
  { question: "Cosa fare se non arriva acqua calda?", answer: "" },
];

const DEFAULT_DOCS: DocumentItem[] = [
  { label: "Contratto energia" },
  { label: "Contratto gas" },
  { label: "Contratto internet" },
  { label: "APE" },
  { label: "Regolamento condominio" },
  { label: "Certificazioni impianti" },
];

const DEFAULT_PHOTOS: RequiredPhotoItem[] = [
  { label: "Ingresso edificio" },
  { label: "Porta appartamento" },
  { label: "Contatori" },
  { label: "Quadro elettrico" },
  { label: "Caldaia" },
  { label: "Modem" },
  { label: "Area rifiuti" },
  { label: "Elettrodomestici" },
  { label: "Stato generale stanze" },
];

export default function OperatorMasterfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: propertyId } = use(params);
  const { data: masterfile, isLoading } = useMasterfile(propertyId);
  const { data: property } = usePropertyOperational(propertyId);
  const updateMasterfile = useUpdateMasterfile(propertyId);

  const saveField = useCallback(
    async (fieldName: string, value: string | number | boolean | null) => {
      await updateMasterfile.mutateAsync({ [fieldName]: value });
    },
    [updateMasterfile]
  );

  const saveJson = useCallback(
    async (fieldName: string, value: unknown) => {
      await updateMasterfile.mutateAsync({ [fieldName]: value } as Record<string, unknown>);
    },
    [updateMasterfile]
  );

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Caricamento...</p>;
  }

  const appliances: ApplianceItem[] = masterfile?.appliances ??
    DEFAULT_APPLIANCE_TYPES.map((type) => ({ type }));
  const customerCareQa: CustomerCareQAItem[] = masterfile?.customer_care_qa ?? DEFAULT_QA;
  const documents: DocumentItem[] = masterfile?.documents ?? DEFAULT_DOCS;
  const requiredPhotos: RequiredPhotoItem[] = masterfile?.required_photos ?? DEFAULT_PHOTOS;
  const wasteInfo = (masterfile?.waste_info ?? {}) as Record<string, string>;
  const inventoryInfo = (masterfile?.inventory_info ?? {}) as Record<string, string>;

  function handleApplianceSave(index: number, updated: ApplianceItem) {
    const next = [...appliances];
    next[index] = updated;
    saveJson("appliances", next);
  }

  function handleApplianceDelete(index: number) {
    const next = appliances.filter((_, i) => i !== index);
    saveJson("appliances", next);
  }

  function handleApplianceAdd() {
    saveJson("appliances", [...appliances, { type: "" }]);
  }

  function handleWasteField(key: string, value: string | null) {
    saveJson("waste_info", { ...wasteInfo, [key]: value ?? "" });
  }

  function handleInventoryInfoField(key: string, value: string | null) {
    saveJson("inventory_info", { ...inventoryInfo, [key]: value ?? "" });
  }

  function handlePhotoSave(index: number, url: string | null) {
    const next = [...requiredPhotos];
    next[index] = {
      ...next[index],
      photo_url: url ?? "",
      uploaded_at: url ? new Date().toISOString() : "",
    };
    saveJson("required_photos", next);
  }

  const mf = masterfile;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/operator">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Masterfile</h1>
          {property && (
            <p className="text-sm text-muted-foreground">
              {property.name} ({property.code})
            </p>
          )}
        </div>
        {mf?.updated_at && (
          <span className="text-xs text-muted-foreground">
            Aggiornato: {new Date(mf.updated_at).toLocaleDateString("it-IT")}
          </span>
        )}
      </div>

      {/* All 13 sections — same as manager but no completion %, masked fields by default */}

      <MasterfileSection title="1. Informazioni Generali" icon={<MapPin className="h-4 w-4" />} storageKey={`op-${propertyId}-general`}>
        <div className="grid md:grid-cols-2 gap-x-6">
          <MasterfileField label="Coordinate Google Maps" value={mf?.maps_coordinates} fieldName="maps_coordinates" onSave={saveField} />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <MasterfileField label="Link Google Maps" value={mf?.maps_link} fieldName="maps_link" type="url" onSave={saveField} />
            </div>
            {mf?.maps_link && (
              <a href={mf.maps_link} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="mb-2">Apri</Button>
              </a>
            )}
          </div>
          <MasterfileField label="Nome sul citofono" value={mf?.building_entry_name} fieldName="building_entry_name" onSave={saveField} />
          <MasterfileField label="Istruzioni per trovare l'edificio" value={mf?.building_directions} fieldName="building_directions" type="textarea" onSave={saveField} />
          <MasterfileField label="Info parcheggio" value={mf?.parking_info} fieldName="parking_info" type="textarea" onSave={saveField} />
          <MasterfileField label="Zona ZTL" value={mf?.ztl_zone} fieldName="ztl_zone" type="boolean" onSave={saveField} />
          {mf?.ztl_zone && (
            <MasterfileField label="Dettagli ZTL" value={mf?.ztl_details} fieldName="ztl_details" type="textarea" onSave={saveField} />
          )}
        </div>
      </MasterfileSection>

      <MasterfileSection title="2. Accessi & Check-in" icon={<Key className="h-4 w-4" />} storageKey={`op-${propertyId}-access`}>
        <div className="grid md:grid-cols-2 gap-x-6">
          <MasterfileField label="Tipo accesso" value={mf?.access_type} fieldName="access_type" onSave={saveField} />
          <MasterfileField label="Posizione lockbox" value={mf?.lockbox_position} fieldName="lockbox_position" onSave={saveField} />
          <MasterfileField label="Codice lockbox" value={mf?.lockbox_code} fieldName="lockbox_code" masked onSave={saveField} />
          <MasterfilePhotoField label="Foto lockbox" photoUrl={mf?.lockbox_photo_url} fieldName="lockbox_photo_url" onSave={saveField} />
          <MasterfileField label="Modello smart lock" value={mf?.smart_lock_model} fieldName="smart_lock_model" onSave={saveField} />
          <MasterfileField label="Posizione chiavi di scorta" value={mf?.spare_keys_location} fieldName="spare_keys_location" onSave={saveField} />
          <MasterfileField label="Procedura porta bloccata" value={mf?.door_blocked_procedure} fieldName="door_blocked_procedure" type="textarea" onSave={saveField} />
          <MasterfileField label="Contatto emergenza accessi" value={mf?.access_emergency_contact} fieldName="access_emergency_contact" onSave={saveField} />
        </div>
      </MasterfileSection>

      <MasterfileSection title="3. Contatori & Impianti" icon={<Zap className="h-4 w-4" />} storageKey={`op-${propertyId}-utilities`}>
        <h4 className="font-medium text-sm mb-2 mt-1">Elettricità</h4>
        <div className="grid md:grid-cols-2 gap-x-6">
          <MasterfileField label="Posizione contatore" value={mf?.electricity_meter_location} fieldName="electricity_meter_location" onSave={saveField} />
          <MasterfileField label="Posizione quadro elettrico" value={mf?.electricity_panel_location} fieldName="electricity_panel_location" onSave={saveField} />
          <MasterfileField label="Procedura reset salvavita" value={mf?.electricity_reset_procedure} fieldName="electricity_reset_procedure" type="textarea" onSave={saveField} />
        </div>
        <h4 className="font-medium text-sm mb-2 mt-6">Gas</h4>
        <div className="grid md:grid-cols-2 gap-x-6">
          <MasterfileField label="Posizione contatore gas" value={mf?.gas_meter_location_detail} fieldName="gas_meter_location_detail" onSave={saveField} />
          <MasterfileField label="Posizione valvola gas" value={mf?.gas_valve_location} fieldName="gas_valve_location" onSave={saveField} />
          <MasterfileField label="Contatto emergenza gas" value={mf?.gas_emergency_contact} fieldName="gas_emergency_contact" onSave={saveField} />
        </div>
        <h4 className="font-medium text-sm mb-2 mt-6">Acqua</h4>
        <div className="grid md:grid-cols-2 gap-x-6">
          <MasterfileField label="Posizione contatore acqua" value={mf?.water_meter_location} fieldName="water_meter_location" onSave={saveField} />
          <MasterfileField label="Posizione rubinetto chiusura" value={mf?.water_shutoff_location} fieldName="water_shutoff_location" onSave={saveField} />
          <MasterfileField label="Amministratore condominio" value={mf?.condo_manager_name} fieldName="condo_manager_name" onSave={saveField} />
          <MasterfileField label="Telefono amministratore" value={mf?.condo_manager_phone} fieldName="condo_manager_phone" onSave={saveField} />
        </div>
      </MasterfileSection>

      <MasterfileSection title="4. WiFi & Connettività" icon={<Wifi className="h-4 w-4" />} storageKey={`op-${propertyId}-wifi`}>
        <div className="grid md:grid-cols-2 gap-x-6">
          <MasterfileField label="SSID (nome rete)" value={mf?.wifi_ssid} fieldName="wifi_ssid" onSave={saveField} />
          <MasterfileField label="Password WiFi" value={mf?.wifi_password} fieldName="wifi_password" masked onSave={saveField} />
          <MasterfileField label="Posizione modem" value={mf?.wifi_modem_location} fieldName="wifi_modem_location" onSave={saveField} />
          <MasterfileField label="Procedura riavvio" value={mf?.wifi_restart_procedure} fieldName="wifi_restart_procedure" type="textarea" onSave={saveField} />
          <MasterfileField label="Numero assistenza" value={mf?.wifi_support_number} fieldName="wifi_support_number" onSave={saveField} />
        </div>
      </MasterfileSection>

      <MasterfileSection title="5. Elettrodomestici" icon={<Refrigerator className="h-4 w-4" />} storageKey={`op-${propertyId}-appliances`}>
        <div className="grid md:grid-cols-2 gap-3">
          {appliances.map((app, idx) => (
            <ApplianceCard key={idx} appliance={app} index={idx} onSave={handleApplianceSave} onDelete={handleApplianceDelete} />
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={handleApplianceAdd}>
          + Aggiungi elettrodomestico
        </Button>
      </MasterfileSection>

      <MasterfileSection title="6. Climatizzazione & Riscaldamento" icon={<Thermometer className="h-4 w-4" />} storageKey={`op-${propertyId}-heating`}>
        <div className="grid md:grid-cols-2 gap-x-6">
          <MasterfileField label="Tipo riscaldamento" value={mf?.heating_type} fieldName="heating_type" onSave={saveField} />
          <MasterfileField label="Posizione caldaia" value={mf?.boiler_location} fieldName="boiler_location" onSave={saveField} />
          <MasterfileField label="Procedura reset caldaia" value={mf?.boiler_reset_procedure} fieldName="boiler_reset_procedure" type="textarea" onSave={saveField} />
          <MasterfileField label="Posizione termostato" value={mf?.thermostat_location} fieldName="thermostat_location" onSave={saveField} />
          <MasterfileField label="Istruzioni AC per ospiti" value={mf?.ac_guest_instructions} fieldName="ac_guest_instructions" type="textarea" onSave={saveField} />
        </div>
      </MasterfileSection>

      <MasterfileSection title="7. Rifiuti" icon={<Trash2 className="h-4 w-4" />} storageKey={`op-${propertyId}-waste`}>
        <div className="grid md:grid-cols-2 gap-x-6">
          <MasterfileField label="Tipo raccolta" value={wasteInfo.type ?? null} fieldName="type" onSave={async (_, v) => handleWasteField("type", v as string | null)} />
          <MasterfileField label="Calendario raccolta" value={wasteInfo.schedule ?? null} fieldName="schedule" onSave={async (_, v) => handleWasteField("schedule", v as string | null)} type="textarea" />
          <MasterfileField label="Istruzioni per ospiti" value={wasteInfo.guest_instructions ?? null} fieldName="guest_instructions" onSave={async (_, v) => handleWasteField("guest_instructions", v as string | null)} type="textarea" />
        </div>
      </MasterfileSection>

      <MasterfileSection title="8. Sicurezza" icon={<Shield className="h-4 w-4" />} storageKey={`op-${propertyId}-safety`}>
        <div className="grid md:grid-cols-2 gap-x-6">
          <MasterfileField label="Posizione estintore" value={mf?.fire_extinguisher_location} fieldName="fire_extinguisher_location" onSave={saveField} />
          <MasterfileField label="Posizione rilevatore fumo" value={mf?.smoke_detector_location} fieldName="smoke_detector_location" onSave={saveField} />
          <MasterfileField label="Posizione kit primo soccorso" value={mf?.first_aid_location} fieldName="first_aid_location" onSave={saveField} />
          <MasterfileField label="Numero emergenza condominio" value={mf?.condo_emergency_number} fieldName="condo_emergency_number" onSave={saveField} />
          <MasterfileField label="Uscite di emergenza" value={mf?.emergency_exits} fieldName="emergency_exits" type="textarea" onSave={saveField} />
        </div>
      </MasterfileSection>

      <MasterfileSection title="9. Manutenzione & Fornitori" icon={<Wrench className="h-4 w-4" />} storageKey={`op-${propertyId}-suppliers`}>
        <div className="grid md:grid-cols-2 gap-x-6">
          <MasterfileField label="Idraulico - nome" value={mf?.supplier_plumber_name} fieldName="supplier_plumber_name" onSave={saveField} />
          <MasterfileField label="Idraulico - telefono" value={mf?.supplier_plumber_phone} fieldName="supplier_plumber_phone" onSave={saveField} />
          <MasterfileField label="Elettricista - nome" value={mf?.supplier_electrician_name} fieldName="supplier_electrician_name" onSave={saveField} />
          <MasterfileField label="Elettricista - telefono" value={mf?.supplier_electrician_phone} fieldName="supplier_electrician_phone" onSave={saveField} />
          <MasterfileField label="Numero intervento generico" value={mf?.supplier_intervention_number} fieldName="supplier_intervention_number" onSave={saveField} />
        </div>
      </MasterfileSection>

      <MasterfileSection title="10. Inventario Casa" icon={<Package className="h-4 w-4" />} storageKey={`op-${propertyId}-inventory`}>
        <div className="grid md:grid-cols-2 gap-x-6">
          <MasterfileField label="Set biancheria letto" value={inventoryInfo.linen_sets ?? null} fieldName="linen_sets" onSave={async (_, v) => handleInventoryInfoField("linen_sets", v as string | null)} />
          <MasterfileField label="Asciugamani" value={inventoryInfo.towels ?? null} fieldName="towels" onSave={async (_, v) => handleInventoryInfoField("towels", v as string | null)} />
          <MasterfileField label="Posizione kit cortesia" value={inventoryInfo.courtesy_kit_location ?? null} fieldName="courtesy_kit_location" onSave={async (_, v) => handleInventoryInfoField("courtesy_kit_location", v as string | null)} />
          <MasterfileField label="Danni preesistenti" value={inventoryInfo.existing_damages ?? null} fieldName="existing_damages" type="textarea" onSave={async (_, v) => handleInventoryInfoField("existing_damages", v as string | null)} />
        </div>
      </MasterfileSection>

      <MasterfileSection title="11. Customer Care Q&A" icon={<HelpCircle className="h-4 w-4" />} storageKey={`op-${propertyId}-qa`}>
        <CustomerCareQA items={customerCareQa} onSave={(items) => saveJson("customer_care_qa", items)} />
      </MasterfileSection>

      <MasterfileSection title="12. Documenti Allegati" icon={<FileText className="h-4 w-4" />} storageKey={`op-${propertyId}-docs`}>
        <DocumentsList items={documents} onSave={(items) => saveJson("documents", items)} />
      </MasterfileSection>

      <MasterfileSection title="13. Foto Obbligatorie Checklist" icon={<Camera className="h-4 w-4" />} storageKey={`op-${propertyId}-photos`}>
        <div className="grid md:grid-cols-3 gap-4">
          {requiredPhotos.map((photo, idx) => (
            <MasterfilePhotoField key={idx} label={photo.label} photoUrl={photo.photo_url || null} fieldName={`required_photo_${idx}`} onSave={async (_, url) => handlePhotoSave(idx, url as string | null)} />
          ))}
        </div>
      </MasterfileSection>
    </div>
  );
}
