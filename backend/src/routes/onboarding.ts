import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { DEFAULT_ONBOARDING_STEPS } from "../lib/onboarding-defaults";
import type { AppEnv } from "../types";
import type { OnboardingStepStatus } from "@prisma/client";

const router = new Hono<AppEnv>();

const VALID_STATUSES: OnboardingStepStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"];

// POST /api/onboarding/start/:ownerId (MANAGER only)
router.post("/start/:ownerId", auth, requireManager, async (c) => {
  const ownerId = c.req.param("ownerId");

  const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
  if (!owner) return c.json({ error: "Proprietario non trovato" }, 404);

  // Idempotent: return existing workflow
  const existing = await prisma.onboardingWorkflow.findUnique({
    where: { owner_id: ownerId },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (existing) return c.json(existing);

  const workflow = await prisma.$transaction(async (tx) => {
    const wf = await tx.onboardingWorkflow.create({
      data: {
        owner_id: ownerId,
        steps: {
          create: DEFAULT_ONBOARDING_STEPS.map((s) => ({
            step_key: s.step_key,
            label: s.label,
            description: s.description,
            order: s.order,
          })),
        },
      },
      include: { steps: { orderBy: { order: "asc" } } },
    });

    // Auto-create onboarding file if not exists
    const existingFile = await tx.onboardingFile.findUnique({ where: { owner_id: ownerId } });
    if (!existingFile) {
      await tx.onboardingFile.create({
        data: {
          owner_id: ownerId,
          owner_first_name: owner.name.split(/\s+/)[0] || undefined,
          owner_last_name: owner.name.split(/\s+/).slice(1).join(" ") || undefined,
          owner_email: owner.email || undefined,
          owner_phone: owner.phone || undefined,
        },
      });
    }

    return wf;
  });

  return c.json(workflow, 201);
});

// GET /api/onboarding (MANAGER only)
router.get("/", auth, requireManager, async (c) => {
  const completedFilter = c.req.query("completed");

  const where: Record<string, unknown> = {};
  if (completedFilter === "true") {
    where.completed_at = { not: null };
  } else if (completedFilter === "false") {
    where.completed_at = null;
  }

  const workflows = await prisma.onboardingWorkflow.findMany({
    where,
    orderBy: { started_at: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true, phone: true } },
      steps: { select: { status: true } },
    },
  });

  const result = workflows.map((w) => {
    const total = w.steps.length;
    const completed = w.steps.filter(
      (s) => s.status === "COMPLETED" || s.status === "SKIPPED"
    ).length;
    return {
      id: w.id,
      owner_id: w.owner_id,
      owner: w.owner,
      started_at: w.started_at,
      completed_at: w.completed_at,
      notes: w.notes,
      progress: { completed, total },
    };
  });

  return c.json(result);
});

// GET /api/onboarding/:ownerId (MANAGER only)
router.get("/:ownerId", auth, requireManager, async (c) => {
  const ownerId = c.req.param("ownerId");

  const workflow = await prisma.onboardingWorkflow.findUnique({
    where: { owner_id: ownerId },
    include: {
      owner: { select: { id: true, name: true, email: true, phone: true } },
      steps: { orderBy: { order: "asc" } },
    },
  });

  if (!workflow) return c.json({ error: "Workflow non trovato" }, 404);

  // Attach onboarding file token if exists
  const obFile = await prisma.onboardingFile.findUnique({
    where: { owner_id: ownerId },
    select: { token: true, status: true },
  });

  return c.json({ ...workflow, onboarding_file: obFile || null });
});

// PATCH /api/onboarding/:ownerId/steps/:stepKey (MANAGER only)
router.patch("/:ownerId/steps/:stepKey", auth, requireManager, async (c) => {
  const ownerId = c.req.param("ownerId");
  const stepKey = c.req.param("stepKey");

  const workflow = await prisma.onboardingWorkflow.findUnique({
    where: { owner_id: ownerId },
  });
  if (!workflow) return c.json({ error: "Workflow non trovato" }, 404);

  const body = await c.req.json();
  const status = body.status as OnboardingStepStatus | undefined;
  const notes = body.notes as string | undefined;

  if (status && !VALID_STATUSES.includes(status)) {
    return c.json({ error: "Stato non valido" }, 400);
  }

  const step = await prisma.onboardingStep.findUnique({
    where: { workflow_id_step_key: { workflow_id: workflow.id, step_key: stepKey } },
  });
  if (!step) return c.json({ error: "Step non trovato" }, 404);

  const updated = await prisma.onboardingStep.update({
    where: { id: step.id },
    data: {
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
      completed_at: status === "COMPLETED" ? new Date() : status ? null : undefined,
    },
  });

  // Check if all steps are done → mark workflow as completed
  const allSteps = await prisma.onboardingStep.findMany({
    where: { workflow_id: workflow.id },
  });
  const allDone = allSteps.every(
    (s) => s.status === "COMPLETED" || s.status === "SKIPPED"
  );

  if (allDone && !workflow.completed_at) {
    await prisma.onboardingWorkflow.update({
      where: { id: workflow.id },
      data: { completed_at: new Date() },
    });
  } else if (!allDone && workflow.completed_at) {
    await prisma.onboardingWorkflow.update({
      where: { id: workflow.id },
      data: { completed_at: null },
    });
  }

  return c.json(updated);
});

export default router;
