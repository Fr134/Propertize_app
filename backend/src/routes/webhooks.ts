import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { sendEmail, MANAGER_EMAIL } from "../lib/email";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// ---------------------------------------------------------------------------
// Webhook secret validation
// ---------------------------------------------------------------------------

function validateWebhookSecret(c: { req: { header: (name: string) => string | undefined } }): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return true; // no secret configured = open (dev mode)
  const provided = c.req.header("x-webhook-secret");
  return provided === secret;
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/lead-form-submitted
//
// Called by n8n when a lead completes the Fillout form.
// Body:
//   lead_id:          string (required) — Propertize lead UUID
//   notion_page_url:  string (optional) — Notion page with form data
//   status:           string (optional) — new lead status (default: PROPOSAL_SENT)
// ---------------------------------------------------------------------------

router.post("/lead-form-submitted", async (c) => {
  if (!validateWebhookSecret(c)) {
    return c.json({ error: "Invalid webhook secret" }, 401);
  }

  const body = await c.req.json();
  const { lead_id, notion_page_url, status } = body as {
    lead_id?: string;
    notion_page_url?: string;
    status?: string;
  };

  if (!lead_id) {
    return c.json({ error: "lead_id is required" }, 400);
  }

  const lead = await prisma.lead.findUnique({ where: { id: lead_id } });
  if (!lead) {
    return c.json({ error: "Lead not found" }, 404);
  }

  const validStatuses = ["NEW", "PROPOSAL_SENT", "NEGOTIATING", "WON", "LOST"];
  const newStatus = status && validStatuses.includes(status) ? status : "PROPOSAL_SENT";

  const updated = await prisma.lead.update({
    where: { id: lead_id },
    data: {
      notion_page_url: notion_page_url || lead.notion_page_url,
      form_submitted_at: new Date(),
      status: newStatus as "NEW" | "PROPOSAL_SENT" | "NEGOTIATING" | "WON" | "LOST",
    },
  });

  console.log(`[webhook] Lead ${lead_id} form submitted — status: ${newStatus}, notion: ${notion_page_url ?? "none"}`);

  // Notify manager
  if (MANAGER_EMAIL) {
    sendEmail({
      to: MANAGER_EMAIL,
      subject: `Modulo compilato — ${lead.first_name} ${lead.last_name}`,
      html: `
        <p>Il lead <strong>${lead.first_name} ${lead.last_name}</strong> ha compilato il modulo immobile.</p>
        ${notion_page_url ? `<p><a href="${notion_page_url}">Vedi su Notion</a></p>` : ""}
      `,
    });
  }

  return c.json({ success: true, lead_id: updated.id, status: updated.status });
});

export default router;
