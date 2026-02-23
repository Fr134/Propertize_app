import { describe, it, expect } from "vitest";
import {
  masterfileSchema,
  applianceSchema,
  customerCareQASchema,
} from "../lib/validators";

describe("masterfileSchema — new fields", () => {
  it("should pass with valid wifi fields", () => {
    const result = masterfileSchema.partial().safeParse({
      wifi_ssid: "MyNetwork",
      wifi_password: "secret123",
      wifi_line_type: "fiber",
    });
    expect(result.success).toBe(true);
  });

  it("should pass with boolean fields", () => {
    const result = masterfileSchema.partial().safeParse({
      ztl_zone: true,
      water_autoclave: false,
    });
    expect(result.success).toBe(true);
  });

  it("should pass with number field", () => {
    const result = masterfileSchema.partial().safeParse({
      electricity_power_kw: 3.5,
    });
    expect(result.success).toBe(true);
  });

  it("should pass with date string for boiler_last_service", () => {
    const result = masterfileSchema.partial().safeParse({
      boiler_last_service: "2025-06-15",
    });
    expect(result.success).toBe(true);
  });

  it("should pass with empty string (converted to null on backend)", () => {
    const result = masterfileSchema.partial().safeParse({
      maps_link: "",
      boiler_last_service: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("applianceSchema", () => {
  it("should fail when type is missing", () => {
    const result = applianceSchema.safeParse({
      brand: "Samsung",
    });
    expect(result.success).toBe(false);
  });

  it("should pass with minimal appliance (type only)", () => {
    const result = applianceSchema.safeParse({
      type: "Frigo",
    });
    expect(result.success).toBe(true);
  });

  it("should pass with full appliance data", () => {
    const result = applianceSchema.safeParse({
      type: "Lavatrice",
      brand: "Bosch",
      model: "Serie 4",
      serial: "ABC123",
      purchase_year: 2023,
      warranty_expiry: "2026-12",
      notes: "Piano terra",
    });
    expect(result.success).toBe(true);
  });
});

describe("customerCareQASchema", () => {
  it("should fail when question is missing", () => {
    const result = customerCareQASchema.safeParse({
      answer: "In corridoio",
    });
    expect(result.success).toBe(false);
  });

  it("should pass with question only (answer optional)", () => {
    const result = customerCareQASchema.safeParse({
      question: "Dove si trova il salvavita?",
    });
    expect(result.success).toBe(true);
  });

  it("should pass with both question and answer", () => {
    const result = customerCareQASchema.safeParse({
      question: "Dove parcheggiare?",
      answer: "Posto auto davanti al palazzo",
    });
    expect(result.success).toBe(true);
  });
});

describe("masterfileSchema — JSONB arrays", () => {
  it("should pass with valid appliances array", () => {
    const result = masterfileSchema.partial().safeParse({
      appliances: [
        { type: "Frigo", brand: "Samsung" },
        { type: "Forno" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should fail when appliance has empty type", () => {
    const result = masterfileSchema.partial().safeParse({
      appliances: [{ type: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("should pass with valid customer_care_qa", () => {
    const result = masterfileSchema.partial().safeParse({
      customer_care_qa: [
        { question: "WiFi?", answer: "MyNetwork" },
        { question: "Parcheggio?" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should fail when qa has empty question", () => {
    const result = masterfileSchema.partial().safeParse({
      customer_care_qa: [{ question: "" }],
    });
    expect(result.success).toBe(false);
  });
});
