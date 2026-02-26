import { Resend } from "resend";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  process.env.FROM_EMAIL ||
  "Propertize <onboarding@resend.dev>";

export const MANAGER_EMAIL = process.env.MANAGER_EMAIL || "";

export const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Singleton Resend client
// ---------------------------------------------------------------------------

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (resendInstance) return resendInstance;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resendInstance = new Resend(key);
  return resendInstance;
}

// ---------------------------------------------------------------------------
// Fire-and-forget email sender
// ---------------------------------------------------------------------------

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping email");
    return false;
  }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send email:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "N/D";
  return `\u20AC${Number(amount).toLocaleString("it-IT")}`;
}

const TASK_TYPE_LABELS: Record<string, string> = {
  CLEANING: "Pulizia",
  MAINTENANCE: "Manutenzione",
  CHECK_IN: "Check-in",
  CHECK_OUT: "Check-out",
  PREPARATION: "Preparazione",
  INSPECTION: "Ispezione",
  OTHER: "Altro",
};

export function translateTaskType(type: string): string {
  return TASK_TYPE_LABELS[type] ?? type;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APPARTAMENTO: "Appartamento",
  VILLA: "Villa",
  ALTRO: "Altro",
};

export function translatePropertyType(type: string): string {
  return PROPERTY_TYPE_LABELS[type] ?? type;
}
