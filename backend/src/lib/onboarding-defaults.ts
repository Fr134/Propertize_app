export const DEFAULT_ONBOARDING_STEPS = [
  {
    step_key: "contract_signed",
    label: "Contratto firmato",
    description: "Firma del contratto di gestione",
    order: 1,
  },
  {
    step_key: "property_created",
    label: "Immobile creato",
    description: "Immobile aggiunto su Propertize",
    order: 2,
  },
  {
    step_key: "masterfile_completed",
    label: "Masterfile completato",
    description: "WiFi, codici accesso e info operative inserite",
    order: 3,
  },
  {
    step_key: "checklist_created",
    label: "Checklist configurata",
    description: "Template checklist pulizie creato",
    order: 4,
  },
  {
    step_key: "photos_done",
    label: "Foto effettuate",
    description: "Servizio fotografico completato",
    order: 5,
  },
  {
    step_key: "listings_published",
    label: "Annunci pubblicati",
    description: "Annunci su Airbnb/Booking attivi",
    order: 6,
  },
  {
    step_key: "first_booking",
    label: "Prima prenotazione",
    description: "Prima prenotazione ricevuta",
    order: 7,
  },
] as const;
