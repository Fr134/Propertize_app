import { describe, it, expect } from 'vitest'
import { detectLocation } from '../lib/location-detector'
import { compilePdf, CAGLIARI_FIELD_MAP } from '../lib/pdf-compiler'

describe('detectLocation', () => {
  it('detects Cagliari', () => {
    expect(detectLocation('Via Roma 1, Cagliari')).toBe('Cagliari')
  })

  it('detects Olbia', () => {
    expect(detectLocation('Via Olbia 1, Olbia OT')).toBe('Olbia')
  })

  it('defaults to Cagliari for unknown address', () => {
    expect(detectLocation('unknown')).toBe('Cagliari')
  })
})

describe('compilePdf', () => {
  it('throws for unknown location', async () => {
    const emptyPdf = new ArrayBuffer(0)
    await expect(
      compilePdf(emptyPdf, {}, 'Milano')
    ).rejects.toThrow('No field map for location: Milano')
  })
})

describe('CAGLIARI_FIELD_MAP', () => {
  it('maps cognome to Cognome', () => {
    expect(CAGLIARI_FIELD_MAP.cognome).toBe('Cognome')
  })

  it('maps n_camere to N camere da letto', () => {
    expect(CAGLIARI_FIELD_MAP.n_camere).toBe('N camere da letto')
  })
})
