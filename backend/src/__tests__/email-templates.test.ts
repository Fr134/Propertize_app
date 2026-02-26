import { describe, it, expect } from "vitest";
import {
  newLeadAssigned,
  leadConverted,
  newAnalysisSubmitted,
  analysisCompleted,
  taskAssigned,
  taskApproved,
  taskRejected,
  taskReopened,
  onboardingFileSubmitted,
  onboardingCompleted,
} from "../lib/email-templates";

describe("email templates", () => {
  describe("newLeadAssigned", () => {
    const data = {
      assigneeName: "Mario Rossi",
      leadFirstName: "Luigi",
      leadLastName: "Verdi",
      leadEmail: "luigi@example.com",
      leadPhone: "+39 333 1234567",
      propertyAddress: "Via Roma 1",
      source: "WEBSITE",
      leadId: "lead-123",
    };

    it("subject contains lead name", () => {
      const result = newLeadAssigned(data);
      expect(result.subject).toContain("Luigi Verdi");
    });

    it("html contains assignee name and lead data", () => {
      const result = newLeadAssigned(data);
      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain("Mario Rossi");
      expect(result.html).toContain("Luigi Verdi");
      expect(result.html).toContain("luigi@example.com");
      expect(result.html).toContain("Via Roma 1");
    });

    it("omits optional fields when null", () => {
      const result = newLeadAssigned({
        ...data,
        leadEmail: null,
        leadPhone: null,
        propertyAddress: null,
      });
      expect(result.html).not.toContain("luigi@example.com");
      expect(result.html).not.toContain("+39 333");
    });
  });

  describe("leadConverted", () => {
    const data = {
      assigneeName: "Mario Rossi",
      ownerName: "Luigi Verdi",
      leadFirstName: "Luigi",
      leadLastName: "Verdi",
      leadEmail: "luigi@example.com",
      ownerId: "owner-123",
    };

    it("subject contains lead name", () => {
      const result = leadConverted(data);
      expect(result.subject).toContain("Luigi Verdi");
    });

    it("html contains owner and assignee", () => {
      const result = leadConverted(data);
      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain("Mario Rossi");
      expect(result.html).toContain("Luigi Verdi");
    });
  });

  describe("newAnalysisSubmitted", () => {
    const data = {
      clientName: "Anna Bianchi",
      clientEmail: "anna@example.com",
      clientPhone: "+39 333 9876543",
      propertyAddress: "Via Milano 10",
      propertyType: "APPARTAMENTO",
      bedroomCount: 3,
      bathroomCount: 2,
      floorAreaSqm: 120,
      currentUse: "Residenziale",
      analysisId: "analysis-123",
      assigneeName: "Mario Rossi",
    };

    it("subject contains client name and property", () => {
      const result = newAnalysisSubmitted(data);
      expect(result.subject).toContain("Anna Bianchi");
      expect(result.subject).toContain("Via Milano 10");
    });

    it("html contains all data", () => {
      const result = newAnalysisSubmitted(data);
      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain("Anna Bianchi");
      expect(result.html).toContain("Appartamento");
      expect(result.html).toContain("120 mq");
    });

    it("omits optional fields when null", () => {
      const result = newAnalysisSubmitted({
        ...data,
        clientPhone: null,
        floorAreaSqm: null,
        currentUse: null,
        assigneeName: null,
      });
      expect(result.html).not.toContain("+39 333");
      expect(result.html).not.toContain("120 mq");
      expect(result.html).not.toContain("Residenziale");
    });
  });

  describe("analysisCompleted", () => {
    it("uses formatCurrency correctly", () => {
      const result = analysisCompleted({
        clientName: "Anna Bianchi",
        propertyAddress: "Via Roma 1",
        estimatedRevenueLow: 15000,
        estimatedRevenueHigh: 25000,
        estimatedOccupancy: 75,
        analysisNotes: "Buon potenziale",
        analysisFileUrl: "https://example.com/file.pdf",
      });
      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain("Anna Bianchi");
      expect(result.html).toContain("\u20AC");
      expect(result.html).toContain("75%");
      expect(result.html).toContain("Buon potenziale");
      expect(result.html).toContain("https://example.com/file.pdf");
    });

    it("shows N/D for null revenue/occupancy", () => {
      const result = analysisCompleted({
        clientName: "Anna Bianchi",
        propertyAddress: "Via Roma 1",
        estimatedRevenueLow: null,
        estimatedRevenueHigh: null,
        estimatedOccupancy: null,
      });
      expect(result.html).toContain("N/D");
    });

    it("omits notes and file URL when null", () => {
      const result = analysisCompleted({
        clientName: "Anna Bianchi",
        propertyAddress: "Via Roma 1",
        analysisNotes: null,
        analysisFileUrl: null,
      });
      expect(result.html).not.toContain("file.pdf");
    });
  });

  describe("taskAssigned", () => {
    const data = {
      operatorName: "Sara Neri",
      propertyName: "Casa Mare",
      propertyCode: "CM-001",
      taskType: "CLEANING",
      scheduledDate: new Date("2026-03-20"),
      startTime: new Date("1970-01-01T09:00:00"),
      notes: "Portare prodotti",
      taskId: "task-123",
    };

    it("uses translateTaskType (CLEANING → Pulizia)", () => {
      const result = taskAssigned(data);
      expect(result.subject).toContain("Pulizia");
      expect(result.html).toContain("Pulizia");
    });

    it("html contains all data", () => {
      const result = taskAssigned(data);
      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain("Sara Neri");
      expect(result.html).toContain("Casa Mare");
      expect(result.html).toContain("CM-001");
      expect(result.html).toContain("Portare prodotti");
    });

    it("omits optional fields when null", () => {
      const result = taskAssigned({
        ...data,
        startTime: null,
        notes: null,
      });
      expect(result.html).not.toContain("Portare prodotti");
    });
  });

  describe("taskApproved", () => {
    it("contains approval message and property", () => {
      const result = taskApproved({
        operatorName: "Sara Neri",
        propertyName: "Casa Mare",
        propertyCode: "CM-001",
        taskType: "CLEANING",
        scheduledDate: new Date("2026-03-20"),
        taskId: "task-123",
      });
      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain("approvato");
      expect(result.html).toContain("Sara Neri");
      expect(result.subject).toContain("Casa Mare");
    });
  });

  describe("taskRejected", () => {
    it("includes rejection_notes in html", () => {
      const result = taskRejected({
        operatorName: "Sara Neri",
        propertyName: "Casa Mare",
        propertyCode: "CM-001",
        taskType: "CLEANING",
        scheduledDate: new Date("2026-03-20"),
        rejectionNotes: "Bagno non pulito",
        taskId: "task-123",
      });
      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain("rifiutato");
      expect(result.html).toContain("Bagno non pulito");
    });

    it("omits rejection notes when null", () => {
      const result = taskRejected({
        operatorName: "Sara Neri",
        propertyName: "Casa Mare",
        propertyCode: "CM-001",
        taskType: "CLEANING",
        scheduledDate: new Date("2026-03-20"),
        rejectionNotes: null,
        taskId: "task-123",
      });
      expect(result.html).not.toContain("Bagno non pulito");
    });
  });

  describe("taskReopened", () => {
    it("contains reopen note", () => {
      const result = taskReopened({
        operatorName: "Sara Neri",
        propertyName: "Casa Mare",
        propertyCode: "CM-001",
        taskType: "CLEANING",
        scheduledDate: new Date("2026-03-20"),
        reopenNote: "Rifare cucina",
        taskId: "task-123",
      });
      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain("riaperto");
      expect(result.html).toContain("Rifare cucina");
    });
  });

  describe("onboardingFileSubmitted", () => {
    const data = {
      ownerFirstName: "Luigi",
      ownerLastName: "Verdi",
      ownerEmail: "luigi@example.com",
      ownerPhone: "+39 333 1234567",
      propertyAddress: "Via Roma 1",
      ownerId: "owner-123",
      assigneeName: "Mario Rossi",
    };

    it("subject contains owner name", () => {
      const result = onboardingFileSubmitted(data);
      expect(result.subject).toContain("Luigi Verdi");
    });

    it("html contains all data", () => {
      const result = onboardingFileSubmitted(data);
      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain("Mario Rossi");
      expect(result.html).toContain("Luigi Verdi");
      expect(result.html).toContain("luigi@example.com");
    });

    it("omits optional fields when null", () => {
      const result = onboardingFileSubmitted({
        ...data,
        ownerEmail: null,
        ownerPhone: null,
        propertyAddress: null,
        assigneeName: null,
      });
      expect(result.html).not.toContain("luigi@example.com");
      expect(result.html).not.toContain("+39 333");
    });
  });

  describe("onboardingCompleted", () => {
    it("contains owner name and completion date", () => {
      const result = onboardingCompleted({
        ownerName: "Luigi Verdi",
        ownerEmail: "luigi@example.com",
        assigneeName: "Mario Rossi",
        ownerId: "owner-123",
        completedAt: new Date("2026-03-20"),
      });
      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain("Luigi Verdi");
      expect(result.html).toContain("Mario Rossi");
      expect(result.subject).toContain("Luigi Verdi");
    });

    it("omits optional fields when null", () => {
      const result = onboardingCompleted({
        ownerName: "Luigi Verdi",
        ownerEmail: null,
        assigneeName: null,
        ownerId: "owner-123",
        completedAt: new Date("2026-03-20"),
      });
      expect(result.html).not.toContain("luigi@example.com");
    });
  });
});
