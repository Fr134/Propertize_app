import { describe, it, expect } from "vitest";
import {
  masterfileSchema,
  createInventoryItemSchema,
  customFieldsSchema,
} from "../lib/validators";

describe("masterfileSchema", () => {
  it("should pass with valid data", () => {
    const result = masterfileSchema.safeParse({
      plumber_name: "Mario Rossi",
      plumber_phone: "+39 333 1234567",
      electrician_name: "Luigi Verdi",
      electrician_phone: "+39 333 7654321",
      cleaner_notes: "Usare prodotti eco",
      cadastral_id: "F205-12345",
      cie_code: "CIE-001",
      tourism_license: "CIR-MI-001234",
    });
    expect(result.success).toBe(true);
  });

  it("should pass with empty object (all optional)", () => {
    const result = masterfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should fail with invalid URL in cover_photo_url", () => {
    const result = masterfileSchema.safeParse({
      cover_photo_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("should pass with valid URL in cover_photo_url", () => {
    const result = masterfileSchema.safeParse({
      cover_photo_url: "https://example.com/photo.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty string for URL fields (clear field)", () => {
    const result = masterfileSchema.safeParse({
      cover_photo_url: "",
      floorplan_url: "",
      drive_folder_url: "",
    });
    expect(result.success).toBe(true);
  });

  it("should fail with invalid floorplan_url", () => {
    const result = masterfileSchema.safeParse({
      floorplan_url: "bad-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("customFieldsSchema", () => {
  it("should pass with valid array", () => {
    const result = customFieldsSchema.safeParse([
      { key: "wifi_guest", label: "WiFi Ospiti", value: "guest-2024" },
      { key: "parking", label: "Posto auto", value: "P12" },
    ]);
    expect(result.success).toBe(true);
  });

  it("should pass with empty array", () => {
    const result = customFieldsSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("should fail with missing key", () => {
    const result = customFieldsSchema.safeParse([
      { label: "WiFi", value: "test" },
    ]);
    expect(result.success).toBe(false);
  });

  it("should fail with missing label", () => {
    const result = customFieldsSchema.safeParse([
      { key: "wifi", value: "test" },
    ]);
    expect(result.success).toBe(false);
  });
});

describe("createInventoryItemSchema", () => {
  const valid = {
    room: "Cucina",
    name: "Frigorifero",
    condition: "GOOD" as const,
  };

  it("should pass with minimal valid data", () => {
    const result = createInventoryItemSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should fail when room is missing", () => {
    const { room: _, ...rest } = valid;
    const result = createInventoryItemSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("should fail when name is missing", () => {
    const { name: _, ...rest } = valid;
    const result = createInventoryItemSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("should fail with invalid condition value", () => {
    const result = createInventoryItemSchema.safeParse({
      ...valid,
      condition: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("should pass with all optional fields", () => {
    const result = createInventoryItemSchema.safeParse({
      ...valid,
      brand: "Samsung",
      model: "RT38",
      serial_number: "SN12345",
      purchase_date: "2024-01-15",
      warranty_expires: "2026-01-15",
      notes: "Da controllare guarnizione",
      condition: "DAMAGED",
    });
    expect(result.success).toBe(true);
  });

  it("should default condition to GOOD when not provided", () => {
    const result = createInventoryItemSchema.safeParse({
      room: "Bagno",
      name: "Specchio",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.condition).toBe("GOOD");
    }
  });
});
