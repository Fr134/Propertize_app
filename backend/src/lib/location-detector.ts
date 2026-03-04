const KNOWN_LOCATIONS = ['Cagliari', 'Olbia', 'Sassari', 'Nuoro', 'Oristano']

export function detectLocation(address: string): string {
  const upper = address.toUpperCase()
  for (const loc of KNOWN_LOCATIONS) {
    if (upper.includes(loc.toUpperCase())) return loc
  }
  return 'Cagliari' // default
}
