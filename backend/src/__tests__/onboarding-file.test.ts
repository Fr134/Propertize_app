import { describe, it, expect } from "vitest";
import {
  onboardingFileSchema,
  onboardingFileRoomSchema,
  onboardingFileBathroomSchema,
} from "../lib/validators";

describe("onboardingFileSchema — basic fields", () => {
  it("should pass with empty object (all optional)", () => {
    const result = onboardingFileSchema.partial().safeParse({});
    expect(result.success).toBe(true);
  });

  it("should pass with owner fields", () => {
    const result = onboardingFileSchema.partial().safeParse({
      owner_first_name: "Mario",
      owner_last_name: "Rossi",
      owner_fiscal_code: "RSSMRA80A01H501U",
      billing_type: "ESENTE IVA",
      owner_language: "Italiano",
      owner_birth_date: "1980-01-01",
      owner_phone: "+39333123456",
      owner_email: "mario@test.it",
    });
    expect(result.success).toBe(true);
  });

  it("should pass with empty strings (auto-save partial)", () => {
    const result = onboardingFileSchema.partial().safeParse({
      owner_first_name: "",
      bank_iban: "",
    });
    expect(result.success).toBe(true);
  });

  it("should pass with boolean fields", () => {
    const result = onboardingFileSchema.partial().safeParse({
      has_sofa_bed: true,
      has_parking: false,
      allows_pets: true,
      privacy_consent: true,
    });
    expect(result.success).toBe(true);
  });

  it("should pass with number fields", () => {
    const result = onboardingFileSchema.partial().safeParse({
      num_levels: 2,
      total_beds: 4,
      property_sqm_internal: 80,
      num_rooms: 3,
      num_bathrooms: 2,
      num_kitchens: 1,
    });
    expect(result.success).toBe(true);
  });
});

describe("onboardingFileSchema — JSON arrays", () => {
  it("should pass with valid rooms array", () => {
    const result = onboardingFileSchema.partial().safeParse({
      rooms: [
        { bed_type: "Matrimoniale", has_ac: true },
        { bed_type: "Singolo", has_ac: false },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should pass with valid bathrooms array", () => {
    const result = onboardingFileSchema.partial().safeParse({
      bathrooms: [
        { position: "Piano terra", amenities: ["Doccia", "Bidet"] },
        { position: "Piano primo", amenities: ["Vasca"] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should pass with kitchen amenities", () => {
    const result = onboardingFileSchema.partial().safeParse({
      kitchen_amenities: ["Forno", "Microonde", "Lavastoviglie"],
    });
    expect(result.success).toBe(true);
  });

  it("should pass with general amenities", () => {
    const result = onboardingFileSchema.partial().safeParse({
      general_amenities: ["Lavatrice", "TV", "Netflix"],
    });
    expect(result.success).toBe(true);
  });

  it("should pass with services", () => {
    const result = onboardingFileSchema.partial().safeParse({
      services: ["Piscina", "Giardino"],
    });
    expect(result.success).toBe(true);
  });

  it("should pass with safety equipment", () => {
    const result = onboardingFileSchema.partial().safeParse({
      safety_equipment: ["Estintore", "Rilevatore CO"],
    });
    expect(result.success).toBe(true);
  });
});

describe("onboardingFileRoomSchema", () => {
  it("should pass with bed_type and has_ac", () => {
    const result = onboardingFileRoomSchema.safeParse({
      bed_type: "Matrimoniale",
      has_ac: true,
    });
    expect(result.success).toBe(true);
  });

  it("should pass with empty bed_type", () => {
    const result = onboardingFileRoomSchema.safeParse({
      bed_type: "",
    });
    expect(result.success).toBe(true);
  });

  it("should pass with empty object", () => {
    const result = onboardingFileRoomSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("onboardingFileBathroomSchema", () => {
  it("should pass with full data", () => {
    const result = onboardingFileBathroomSchema.safeParse({
      position: "Piano terra",
      amenities: ["Doccia", "Bidet"],
    });
    expect(result.success).toBe(true);
  });

  it("should pass with empty amenities", () => {
    const result = onboardingFileBathroomSchema.safeParse({
      position: "Camera",
      amenities: [],
    });
    expect(result.success).toBe(true);
  });

  it("should pass with empty object", () => {
    const result = onboardingFileBathroomSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("onboardingFileSchema — file URLs", () => {
  it("should pass with file URL fields", () => {
    const result = onboardingFileSchema.partial().safeParse({
      document_file_url: "https://utfs.io/f/abc123",
      self_checkin_photo_url: "https://utfs.io/f/def456",
      gas_photo_url: "https://utfs.io/f/ghi789",
      planimetry_file_url: "https://utfs.io/f/jkl012",
    });
    expect(result.success).toBe(true);
  });

  it("should pass with empty file URL (removal)", () => {
    const result = onboardingFileSchema.partial().safeParse({
      document_file_url: "",
      parking_photo_url: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("onboardingFileSchema — complete form", () => {
  it("should pass with all required fields filled", () => {
    const result = onboardingFileSchema.partial().safeParse({
      owner_first_name: "Mario",
      owner_last_name: "Rossi",
      owner_fiscal_code: "RSSMRA80A01H501U",
      billing_type: "Persona fisica",
      owner_language: "Italiano",
      owner_birth_date: "1980-01-01",
      owner_phone: "+39333123456",
      owner_email: "mario@test.it",
      residence_address: "Via Roma 1",
      residence_zip: "00100",
      residence_country: "Italia",
      document_type: "Carta d'identità",
      document_number: "AB1234567",
      document_issue_place: "Roma",
      document_issue_date: "2020-01-15",
      bank_account_holder: "Mario Rossi",
      bank_iban: "IT60X0542811101000000123456",
      bank_name: "Intesa San Paolo",
      bank_bic_swift: "BCITITMM",
      property_address: "Via Firenze 10",
      property_zip: "50100",
      property_floor: "2",
      property_intercom_name: "Rossi",
      property_sqm_internal: 80,
      num_rooms: 2,
      num_bathrooms: 1,
      num_kitchens: 1,
      internet_provider: "TIM",
      wifi_name: "MyNetwork",
      wifi_password: "secret123",
      modem_serial_number: "SN123456",
      keys_availability_date: "2026-03-15",
      privacy_consent: true,
    });
    expect(result.success).toBe(true);
  });
});
