import { PDFDocument } from 'pdf-lib'

const CAGLIARI_FIELD_MAP: Record<string, string> = {
  cognome: 'Cognome',
  nome: 'Nome',
  nato_a: 'natoa a',
  nato_prov: 'Prov',
  nato_il: 'il',
  codice_fiscale: 'Codice Fiscale',
  residente_a: 'a',
  residente_cap: 'CAP',
  indirizzo_res: 'Indirizzo',
  telefono: 'tel',
  email: 'email',
  pec: 'pec eventuale',
  immobile_via: 'Limmobile è sito in via',
  immobile_n: 'n',
  immobile_indirizzo: 'Indirizzo_2',
  immobile_n2: 'n_2',
  immobile_piano: 'piano',
  immobile_comune: 'Comune',
  immobile_cap: 'CAP_2',
  immobile_prov: 'Prov_2',
  sezione: 'Sezione',
  foglio: 'Foglio',
  particella: 'Particella',
  sub: 'Sub',
  categoria: 'Categoria',
  denominazione: 'fill_32',
  n_camere: 'N camere da letto',
  n_bagni: 'N bagni',
  n_posti_letto: 'N posti letto complessivi',
  periodo_disponibilita: 'Periodo di disponibilità',
  luogo_data: 'Luogo e Data',
}

const LOCATION_FIELD_MAPS: Record<string, typeof CAGLIARI_FIELD_MAP> = {
  'Cagliari': CAGLIARI_FIELD_MAP,
  // altre location aggiunte quando disponibili i template
}

export { CAGLIARI_FIELD_MAP, LOCATION_FIELD_MAPS }

export async function compilePdf(
  templateBytes: ArrayBuffer,
  formData: Record<string, unknown>,
  location: string
): Promise<Uint8Array> {
  const fieldMap = LOCATION_FIELD_MAPS[location]
  if (!fieldMap) throw new Error(`No field map for location: ${location}`)

  const pdfDoc = await PDFDocument.load(templateBytes)
  const form = pdfDoc.getForm()

  for (const [dataKey, pdfFieldName] of Object.entries(fieldMap)) {
    try {
      const field = form.getTextField(pdfFieldName)
      let value = formData[dataKey]
      if (value === null || value === undefined) continue
      if (value instanceof Date) value = value.toLocaleDateString('it-IT')
      field.setText(String(value))
    } catch {
      // field not found in template — skip
    }
  }

  try {
    if (formData.ruolo === 'Proprietario') {
      form.getCheckBox('Proprietario').check()
    } else if (formData.ruolo === 'Locatario') {
      form.getCheckBox('Locatariosublocatariocomodatarioetc').check()
    }
  } catch {
    // checkbox not found — skip
  }

  form.flatten()
  return pdfDoc.save()
}
