import {
  FRONTEND_URL,
  formatDate,
  formatCurrency,
  translateTaskType,
  translatePropertyType,
} from "./email";

// ---------------------------------------------------------------------------
// Base layout
// ---------------------------------------------------------------------------

function base(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#1e293b;padding:20px 24px;color:#ffffff;font-size:18px;font-weight:bold;border-radius:8px 8px 0 0;">
          ${title}
        </td></tr>
        <tr><td style="background:#ffffff;padding:24px;border-radius:0 0 8px 8px;">
          ${body}
        </td></tr>
        <tr><td style="padding:16px 24px;color:#94a3b8;font-size:12px;text-align:center;">
          Propertize &mdash; Property Management
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<p style="margin:4px 0;"><strong>${label}:</strong> ${value}</p>`;
}

function link(url: string, text: string): string {
  return `<p style="margin:16px 0;"><a href="${url}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">${text}</a></p>`;
}

// ---------------------------------------------------------------------------
// Data interfaces
// ---------------------------------------------------------------------------

export interface NewLeadAssignedData {
  assigneeName: string;
  leadFirstName: string;
  leadLastName: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
  propertyAddress?: string | null;
  source: string;
  leadId: string;
}

export interface LeadConvertedData {
  assigneeName: string;
  ownerName: string;
  leadFirstName: string;
  leadLastName: string;
  leadEmail?: string | null;
  ownerId: string;
}

export interface NewAnalysisSubmittedData {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  propertyAddress: string;
  propertyType: string;
  bedroomCount: number;
  bathroomCount: number;
  floorAreaSqm?: number | null;
  currentUse?: string | null;
  analysisId: string;
  assigneeName?: string | null;
}

export interface AnalysisCompletedData {
  clientName: string;
  propertyAddress: string;
  estimatedRevenueLow?: number | null;
  estimatedRevenueHigh?: number | null;
  estimatedOccupancy?: number | null;
  analysisNotes?: string | null;
  analysisFileUrl?: string | null;
}

export interface TaskAssignedData {
  operatorName: string;
  propertyName: string;
  propertyCode: string;
  taskType: string;
  scheduledDate: Date;
  startTime?: Date | null;
  notes?: string | null;
  taskId: string;
}

export interface TaskApprovedData {
  operatorName: string;
  propertyName: string;
  propertyCode: string;
  taskType: string;
  scheduledDate: Date;
  taskId: string;
}

export interface TaskRejectedData {
  operatorName: string;
  propertyName: string;
  propertyCode: string;
  taskType: string;
  scheduledDate: Date;
  rejectionNotes?: string | null;
  taskId: string;
}

export interface TaskReopenedData {
  operatorName: string;
  propertyName: string;
  propertyCode: string;
  taskType: string;
  scheduledDate: Date;
  reopenNote: string;
  taskId: string;
}

export interface OnboardingFileSubmittedData {
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  propertyAddress?: string | null;
  ownerId: string;
  assigneeName?: string | null;
}

export interface OnboardingCompletedData {
  ownerName: string;
  ownerEmail?: string | null;
  assigneeName?: string | null;
  ownerId: string;
  completedAt: Date;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

// 1. New lead assigned
export function newLeadAssigned(data: NewLeadAssignedData) {
  const body = [
    `<p>Ciao ${data.assigneeName},</p>`,
    `<p>Ti è stato assegnato un nuovo lead:</p>`,
    row("Nome", `${data.leadFirstName} ${data.leadLastName}`),
    data.leadEmail ? row("Email", data.leadEmail) : "",
    data.leadPhone ? row("Telefono", data.leadPhone) : "",
    data.propertyAddress ? row("Indirizzo immobile", data.propertyAddress) : "",
    row("Fonte", data.source),
    link(`${FRONTEND_URL}/manager/crm/leads/${data.leadId}`, "Visualizza lead"),
  ].join("\n");

  return {
    subject: `Nuovo lead assegnato — ${data.leadFirstName} ${data.leadLastName}`,
    html: base("Nuovo Lead Assegnato", body),
  };
}

// 2. Lead converted
export function leadConverted(data: LeadConvertedData) {
  const body = [
    `<p>Ciao ${data.assigneeName},</p>`,
    `<p>Il lead <strong>${data.leadFirstName} ${data.leadLastName}</strong> è stato convertito in proprietario.</p>`,
    row("Proprietario", data.ownerName),
    data.leadEmail ? row("Email", data.leadEmail) : "",
    link(`${FRONTEND_URL}/manager/onboarding/${data.ownerId}`, "Visualizza onboarding"),
  ].join("\n");

  return {
    subject: `Lead convertito — ${data.leadFirstName} ${data.leadLastName}`,
    html: base("Lead Convertito in Proprietario", body),
  };
}

// 3. New analysis submitted
export function newAnalysisSubmitted(data: NewAnalysisSubmittedData) {
  const body = [
    data.assigneeName ? `<p>Ciao ${data.assigneeName},</p>` : "",
    `<p>È stata ricevuta una nuova richiesta di analisi immobile.</p>`,
    `<h3 style="margin:16px 0 8px;">Cliente</h3>`,
    row("Nome", data.clientName),
    row("Email", data.clientEmail),
    data.clientPhone ? row("Telefono", data.clientPhone) : "",
    `<h3 style="margin:16px 0 8px;">Immobile</h3>`,
    row("Indirizzo", data.propertyAddress),
    row("Tipo", translatePropertyType(data.propertyType)),
    row("Camere", `${data.bedroomCount}`),
    row("Bagni", `${data.bathroomCount}`),
    data.floorAreaSqm ? row("Superficie", `${data.floorAreaSqm} mq`) : "",
    data.currentUse ? row("Utilizzo attuale", data.currentUse) : "",
    link(`${FRONTEND_URL}/manager/crm/analisi/${data.analysisId}`, "Visualizza nell'app"),
  ].join("\n");

  return {
    subject: `Nuova richiesta analisi — ${data.clientName} — ${data.propertyAddress}`,
    html: base("Nuova Richiesta di Analisi", body),
  };
}

// 4. Analysis completed (sent to client)
export function analysisCompleted(data: AnalysisCompletedData) {
  const revenueText =
    data.estimatedRevenueLow != null && data.estimatedRevenueHigh != null
      ? `${formatCurrency(data.estimatedRevenueLow)} - ${formatCurrency(data.estimatedRevenueHigh)}`
      : "N/D";
  const occupancyText =
    data.estimatedOccupancy != null ? `${data.estimatedOccupancy}%` : "N/D";

  const body = [
    `<p>Gentile ${data.clientName},</p>`,
    `<p>Abbiamo completato l'analisi del tuo immobile in <strong>${data.propertyAddress}</strong>.</p>`,
    `<h3 style="margin:16px 0 8px;">Riepilogo</h3>`,
    row("Revenue stimata annuale", revenueText),
    row("Occupancy stimata", occupancyText),
    data.analysisNotes ? row("Note", data.analysisNotes) : "",
    data.analysisFileUrl
      ? `<p><a href="${data.analysisFileUrl}">Scarica il documento di analisi</a></p>`
      : "",
    `<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;"/>`,
    `<p>Per qualsiasi domanda, non esitare a contattarci.</p>`,
    `<p>Il team Propertize</p>`,
  ].join("\n");

  return {
    subject: "La tua analisi immobile è pronta — Propertize",
    html: base("Analisi Immobile Completata", body),
  };
}

// 5. Task assigned
export function taskAssigned(data: TaskAssignedData) {
  const startTimeStr = data.startTime
    ? new Date(data.startTime).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
    : null;

  const body = [
    `<p>Ciao ${data.operatorName},</p>`,
    `<p>Ti è stato assegnato un nuovo task:</p>`,
    row("Immobile", `${data.propertyName} (${data.propertyCode})`),
    row("Tipo", translateTaskType(data.taskType)),
    row("Data", formatDate(data.scheduledDate)),
    startTimeStr ? row("Orario", startTimeStr) : "",
    data.notes ? row("Note", data.notes) : "",
    link(`${FRONTEND_URL}/operator/tasks/${data.taskId}`, "Visualizza task"),
  ].join("\n");

  return {
    subject: `Nuovo task — ${translateTaskType(data.taskType)} — ${data.propertyName}`,
    html: base("Nuovo Task Assegnato", body),
  };
}

// 6. Task approved
export function taskApproved(data: TaskApprovedData) {
  const body = [
    `<p>Ciao ${data.operatorName},</p>`,
    `<p>Il tuo task è stato <strong style="color:#16a34a;">approvato</strong>.</p>`,
    row("Immobile", `${data.propertyName} (${data.propertyCode})`),
    row("Tipo", translateTaskType(data.taskType)),
    row("Data", formatDate(data.scheduledDate)),
    link(`${FRONTEND_URL}/operator/tasks/${data.taskId}`, "Visualizza task"),
  ].join("\n");

  return {
    subject: `Task approvato — ${data.propertyName}`,
    html: base("Task Approvato", body),
  };
}

// 7. Task rejected
export function taskRejected(data: TaskRejectedData) {
  const body = [
    `<p>Ciao ${data.operatorName},</p>`,
    `<p>Il tuo task è stato <strong style="color:#dc2626;">rifiutato</strong>.</p>`,
    row("Immobile", `${data.propertyName} (${data.propertyCode})`),
    row("Tipo", translateTaskType(data.taskType)),
    row("Data", formatDate(data.scheduledDate)),
    data.rejectionNotes ? row("Motivo", data.rejectionNotes) : "",
    link(`${FRONTEND_URL}/operator/tasks/${data.taskId}`, "Visualizza task"),
  ].join("\n");

  return {
    subject: `Task rifiutato — ${data.propertyName}`,
    html: base("Task Rifiutato", body),
  };
}

// 8. Task reopened
export function taskReopened(data: TaskReopenedData) {
  const body = [
    `<p>Ciao ${data.operatorName},</p>`,
    `<p>Il tuo task è stato <strong>riaperto</strong>.</p>`,
    row("Immobile", `${data.propertyName} (${data.propertyCode})`),
    row("Tipo", translateTaskType(data.taskType)),
    row("Data", formatDate(data.scheduledDate)),
    row("Nota", data.reopenNote),
    link(`${FRONTEND_URL}/operator/tasks/${data.taskId}`, "Visualizza task"),
  ].join("\n");

  return {
    subject: `Task riaperto — ${data.propertyName}`,
    html: base("Task Riaperto", body),
  };
}

// 9. Onboarding file submitted
export function onboardingFileSubmitted(data: OnboardingFileSubmittedData) {
  const body = [
    data.assigneeName ? `<p>Ciao ${data.assigneeName},</p>` : "",
    `<p>È stato ricevuto un nuovo onboarding file.</p>`,
    row("Proprietario", `${data.ownerFirstName} ${data.ownerLastName}`),
    data.ownerEmail ? row("Email", data.ownerEmail) : "",
    data.ownerPhone ? row("Telefono", data.ownerPhone) : "",
    data.propertyAddress ? row("Immobile", data.propertyAddress) : "",
    link(`${FRONTEND_URL}/manager/onboarding/${data.ownerId}`, "Visualizza onboarding"),
  ].join("\n");

  return {
    subject: `Onboarding file ricevuto — ${data.ownerFirstName} ${data.ownerLastName}`,
    html: base("Onboarding File Ricevuto", body),
  };
}

// 10. Onboarding completed
export function onboardingCompleted(data: OnboardingCompletedData) {
  const body = [
    data.assigneeName ? `<p>Ciao ${data.assigneeName},</p>` : "",
    `<p>L'onboarding del proprietario <strong>${data.ownerName}</strong> è stato completato.</p>`,
    data.ownerEmail ? row("Email", data.ownerEmail) : "",
    row("Completato il", formatDate(data.completedAt)),
    link(`${FRONTEND_URL}/manager/onboarding/${data.ownerId}`, "Visualizza onboarding"),
  ].join("\n");

  return {
    subject: `Onboarding completato — ${data.ownerName}`,
    html: base("Onboarding Completato", body),
  };
}
