import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn().mockResolvedValue({ id: "test-id" });

// Mock resend before importing email module
vi.mock("resend", () => {
  return {
    Resend: class {
      emails = { send: mockSend };
    },
  };
});

describe("email service", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSend.mockReset().mockResolvedValue({ id: "test-id" });
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.FROM_EMAIL;
    delete process.env.MANAGER_EMAIL;
    delete process.env.FRONTEND_URL;
  });

  describe("sendEmail", () => {
    it("returns false and warns when RESEND_API_KEY is not set", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { sendEmail } = await import("../lib/email");

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("RESEND_API_KEY not set")
      );
      warnSpy.mockRestore();
    });

    it("returns true and calls resend.emails.send on success", async () => {
      process.env.RESEND_API_KEY = "re_test_key";

      const { sendEmail } = await import("../lib/email");

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
      });

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: "Test Subject",
          html: "<p>Hello</p>",
        })
      );
    });

    it("returns false and logs error on Resend failure — does NOT rethrow", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockSend.mockRejectedValueOnce(new Error("API error"));

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { sendEmail } = await import("../lib/email");

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Fail",
        html: "<p>Fail</p>",
      });

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send email"),
        expect.any(Error)
      );
      errorSpy.mockRestore();
    });
  });

  describe("formatDate", () => {
    it("returns Italian date format", async () => {
      const { formatDate } = await import("../lib/email");
      const result = formatDate(new Date("2026-03-15"));
      // Italian locale: "15 marzo 2026"
      expect(result).toContain("15");
      expect(result).toMatch(/marzo/i);
      expect(result).toContain("2026");
    });
  });

  describe("formatCurrency", () => {
    it("returns formatted currency for numbers", async () => {
      const { formatCurrency } = await import("../lib/email");
      const result = formatCurrency(1500);
      expect(result).toContain("\u20AC");
      expect(result).toContain("1");
    });

    it("returns N/D for null", async () => {
      const { formatCurrency } = await import("../lib/email");
      expect(formatCurrency(null)).toBe("N/D");
      expect(formatCurrency(undefined)).toBe("N/D");
    });
  });

  describe("translateTaskType", () => {
    it("translates known task types", async () => {
      const { translateTaskType } = await import("../lib/email");
      expect(translateTaskType("CLEANING")).toBe("Pulizia");
      expect(translateTaskType("MAINTENANCE")).toBe("Manutenzione");
    });

    it("returns original string for unknown types", async () => {
      const { translateTaskType } = await import("../lib/email");
      expect(translateTaskType("UNKNOWN")).toBe("UNKNOWN");
    });
  });

  describe("translatePropertyType", () => {
    it("translates known property types", async () => {
      const { translatePropertyType } = await import("../lib/email");
      expect(translatePropertyType("APPARTAMENTO")).toBe("Appartamento");
      expect(translatePropertyType("VILLA")).toBe("Villa");
    });

    it("returns original string for unknown types", async () => {
      const { translatePropertyType } = await import("../lib/email");
      expect(translatePropertyType("CASTLE")).toBe("CASTLE");
    });
  });
});
