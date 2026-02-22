import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { auth, requireManager } from "../middleware/auth";
import { getPaginationParams, createPaginatedResponse } from "../lib/pagination";
import {
  createTaskSchema,
  reviewTaskSchema,
  reopenTaskSchema,
  updateTaskSupplyUsageSchema,
} from "../lib/validators";
import { postConsumptionTx } from "../lib/inventory";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// GET /api/tasks
router.get("/", auth, async (c) => {
  const userId = c.get("userId");
  const role = c.get("role");
  const { page, limit, skip } = getPaginationParams(c);

  const assignedTo = c.req.query("assigned_to");
  const status = c.req.query("status");
  const date = c.req.query("date");

  const where: Record<string, unknown> = {};
  if (role === "OPERATOR") {
    where.assigned_to = userId;
  } else if (assignedTo) {
    where.assigned_to = assignedTo;
  }
  if (status) where.status = status;
  if (date) where.scheduled_date = new Date(date);

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        property: { select: { id: true, name: true, code: true } },
        operator: { select: { id: true, first_name: true, last_name: true } },
      },
      orderBy: [{ scheduled_date: "desc" }, { created_at: "desc" }],
      take: limit,
      skip,
    }),
    prisma.task.count({ where }),
  ]);

  return c.json(createPaginatedResponse(tasks, total, page, limit));
});

// POST /api/tasks
router.post("/", auth, requireManager, async (c) => {
  const body = await c.req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const property = await prisma.property.findUnique({
    where: { id: parsed.data.property_id },
    include: { checklist_template: true },
  });
  if (!property) return c.json({ error: "Immobile non trovato" }, 404);

  const operator = await prisma.user.findUnique({
    where: { id: parsed.data.assigned_to },
  });
  if (!operator || operator.role !== "OPERATOR") {
    return c.json({ error: "Operatrice non trovata" }, 400);
  }

  const rawTemplate = property.checklist_template?.items;
  type TemplateArea = {
    area: string;
    description: string;
    photo_required: boolean;
    subTasks?: { id: string; text: string }[];
  };
  type TemplateSupply = {
    id: string;
    text: string;
    supplyItemId?: string | null;
    expectedQty?: number;
  };

  const templateAreas: TemplateArea[] = Array.isArray(rawTemplate)
    ? (rawTemplate as unknown as TemplateArea[])
    : (((rawTemplate as Record<string, unknown>)?.items as TemplateArea[]) ?? []);
  const templateSupplies: TemplateSupply[] = Array.isArray(rawTemplate)
    ? []
    : (((rawTemplate as Record<string, unknown>)?.staySupplies as TemplateSupply[]) ?? []);

  const checklistData =
    templateAreas.length > 0
      ? {
          areas: templateAreas.map((item) => ({
            area: item.area,
            description: item.description,
            photo_required: item.photo_required,
            completed: false,
            photo_urls: [] as string[],
            notes: "",
            subTasks: (item.subTasks ?? []).map((st) => ({
              id: st.id,
              text: st.text,
              completed: false,
            })),
          })),
          staySupplies: templateSupplies.map((s) => ({
            id: s.id,
            text: s.text,
            checked: false,
            ...(s.supplyItemId
              ? {
                  supplyItemId: s.supplyItemId,
                  expectedQty: s.expectedQty ?? 1,
                  qtyUsed: 0,
                }
              : {}),
          })),
        }
      : null;

  const linkedSupplies = templateSupplies.filter((s) => s.supplyItemId);

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        property_id: parsed.data.property_id,
        assigned_to: parsed.data.assigned_to,
        scheduled_date: new Date(parsed.data.scheduled_date),
        notes: parsed.data.notes,
        checklist_data: checklistData ?? undefined,
      },
      include: {
        property: { select: { id: true, name: true, code: true } },
        operator: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    if (linkedSupplies.length > 0) {
      await tx.taskSupplyUsage.createMany({
        data: linkedSupplies.map((s) => ({
          task_id: created.id,
          supply_item_id: s.supplyItemId!,
          expected_qty: s.expectedQty ?? 1,
          qty_used: 0,
        })),
      });
    }

    return created;
  });

  return c.json(task, 201);
});

// GET /api/tasks/:id
router.get("/:id", auth, async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const role = c.get("role");

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, name: true, code: true, address: true } },
      operator: { select: { id: true, first_name: true, last_name: true, email: true } },
      reviewer: { select: { id: true, first_name: true, last_name: true } },
      photos: { orderBy: { checklist_item_index: "asc" } },
      supply_usages: {
        include: { supply_item: { select: { name: true, unit: true } } },
        orderBy: { created_at: "asc" },
      },
    },
  });

  if (!task) return c.json({ error: "Task non trovato" }, 404);

  if (role === "OPERATOR" && task.assigned_to !== userId) {
    return c.json({ error: "Accesso negato" }, 403);
  }

  return c.json(task);
});

// DELETE /api/tasks/:id
router.delete("/:id", auth, requireManager, async (c) => {
  const id = c.req.param("id");

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return c.json({ error: "Task non trovato" }, 404);

  await prisma.$transaction([
    prisma.taskPhoto.deleteMany({ where: { task_id: id } }),
    prisma.taskSupplyUsage.deleteMany({ where: { task_id: id } }),
    prisma.maintenanceReport.updateMany({
      where: { task_id: id },
      data: { task_id: null },
    }),
    prisma.task.delete({ where: { id } }),
  ]);

  return c.json({ success: true });
});

// PATCH /api/tasks/:id/start
router.patch("/:id/start", auth, async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  const { count } = await prisma.task.updateMany({
    where: { id, status: "TODO", assigned_to: userId },
    data: { status: "IN_PROGRESS" },
  });

  if (count === 0) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return c.json({ error: "Task non trovato" }, 404);
    if (task.assigned_to !== userId)
      return c.json({ error: "Non sei assegnata a questo task" }, 403);
    return c.json({ ...task, alreadyApplied: true });
  }

  const updated = await prisma.task.findUnique({ where: { id } });
  return c.json(updated);
});

// PATCH /api/tasks/:id/complete
router.patch("/:id/complete", auth, async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  const task = await prisma.task.findUnique({
    where: { id },
    include: { photos: true },
  });

  if (!task) return c.json({ error: "Task non trovato" }, 404);
  if (task.assigned_to !== userId) return c.json({ error: "Accesso negato" }, 403);

  if (task.status !== "IN_PROGRESS") {
    return c.json({ ...task, alreadyApplied: true });
  }

  type AreaItem = {
    completed: boolean;
    photo_required: boolean;
    photo_urls: string[];
    subTasks?: { id: string; text: string; completed: boolean }[];
  };

  const raw = task.checklist_data;
  const areas: AreaItem[] | null = raw
    ? Array.isArray(raw)
      ? (raw as AreaItem[])
      : ((raw as { areas?: AreaItem[] }).areas ?? null)
    : null;

  if (areas) {
    for (let i = 0; i < areas.length; i++) {
      const item = areas[i];
      if (!item.completed) {
        return c.json({ error: `L'area ${i + 1} non e' stata completata` }, 400);
      }
      if (item.photo_required && (!item.photo_urls || item.photo_urls.length === 0)) {
        return c.json(
          { error: `Foto obbligatoria mancante per l'area ${i + 1}` },
          400
        );
      }
      if (item.subTasks && item.subTasks.length > 0) {
        for (const st of item.subTasks) {
          if (!st.completed) {
            return c.json(
              { error: `Sub-task "${st.text}" nell'area ${i + 1} non completata` },
              400
            );
          }
        }
      }
    }
  }

  const { count } = await prisma.task.updateMany({
    where: { id, status: "IN_PROGRESS", assigned_to: userId },
    data: { status: "COMPLETED", completed_at: new Date() },
  });

  if (count === 0) {
    const current = await prisma.task.findUnique({ where: { id } });
    return c.json({ ...current, alreadyApplied: true });
  }

  const updated = await prisma.task.findUnique({ where: { id } });
  return c.json(updated);
});

// PATCH /api/tasks/:id/checklist
router.patch("/:id/checklist", auth, async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const role = c.get("role");
  const body = await c.req.json();

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return c.json({ error: "Task non trovato" }, 404);
  if (role === "OPERATOR" && task.assigned_to !== userId) {
    return c.json({ error: "Accesso negato" }, 403);
  }
  if (task.status !== "IN_PROGRESS") {
    return c.json({ error: "Il task non e' in corso" }, 400);
  }
  if (!task.checklist_data) {
    return c.json({ error: "Checklist non presente" }, 400);
  }

  // Parse checklist_data
  function parseChecklistData(raw: unknown) {
    if (Array.isArray(raw)) {
      return { areas: raw as Record<string, unknown>[], staySupplies: [], isObject: false };
    }
    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      return {
        areas: Array.isArray(obj.areas) ? (obj.areas as Record<string, unknown>[]) : [],
        staySupplies: Array.isArray(obj.staySupplies)
          ? (obj.staySupplies as Record<string, unknown>[])
          : [],
        isObject: true,
      };
    }
    return { areas: [], staySupplies: [], isObject: false };
  }

  function serializeChecklistData(
    areas: Record<string, unknown>[],
    staySupplies: Record<string, unknown>[],
    wasObject: boolean
  ) {
    if (wasObject || staySupplies.length > 0) {
      return { areas, staySupplies };
    }
    return areas;
  }

  const { areas, staySupplies, isObject } = parseChecklistData(task.checklist_data);

  // SUPPLY_QTY_UPDATE
  if (body.type === "SUPPLY_QTY_UPDATE") {
    const { supplyId, checked, qtyUsed } = body as {
      supplyId: string;
      checked: boolean;
      qtyUsed: number;
    };

    if (!supplyId || typeof checked !== "boolean" || typeof qtyUsed !== "number") {
      return c.json({ error: "supplyId, checked e qtyUsed sono richiesti" }, 400);
    }

    const supplyIndex = staySupplies.findIndex((s) => s.id === supplyId);
    if (supplyIndex === -1) return c.json({ error: "Scorta non trovata" }, 404);

    staySupplies[supplyIndex].checked = checked;
    staySupplies[supplyIndex].qtyUsed = qtyUsed;

    const supplyItemId = staySupplies[supplyIndex].supplyItemId as string | undefined;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        checklist_data: serializeChecklistData(areas, staySupplies, isObject) as Prisma.InputJsonValue,
      },
    });

    if (supplyItemId) {
      await prisma.taskSupplyUsage.upsert({
        where: {
          task_id_supply_item_id: { task_id: id, supply_item_id: supplyItemId },
        },
        update: { qty_used: qtyUsed },
        create: { task_id: id, supply_item_id: supplyItemId, qty_used: qtyUsed },
      });
    }

    return c.json(updated);
  }

  // SUPPLY_TOGGLE
  if (body.type === "SUPPLY_TOGGLE") {
    const { supplyId, checked } = body as { supplyId: string; checked: boolean };
    if (!supplyId || typeof checked !== "boolean") {
      return c.json({ error: "supplyId e checked sono richiesti" }, 400);
    }

    const supplyIndex = staySupplies.findIndex((s) => s.id === supplyId);
    if (supplyIndex === -1) return c.json({ error: "Scorta non trovata" }, 404);

    staySupplies[supplyIndex].checked = checked;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        checklist_data: serializeChecklistData(areas, staySupplies, isObject) as Prisma.InputJsonValue,
      },
    });
    return c.json(updated);
  }

  // AREA_SUBTASK_TOGGLE
  if (body.type === "AREA_SUBTASK_TOGGLE") {
    const { itemIndex, subTaskId, completed } = body as {
      itemIndex: number;
      subTaskId: string;
      completed: boolean;
    };

    if (typeof itemIndex !== "number" || !subTaskId || typeof completed !== "boolean") {
      return c.json({ error: "itemIndex, subTaskId e completed sono richiesti" }, 400);
    }
    if (itemIndex >= areas.length) {
      return c.json({ error: "Indice checklist non valido" }, 400);
    }

    const subTasks = areas[itemIndex].subTasks as
      | { id: string; text: string; completed: boolean }[]
      | undefined;

    if (!subTasks) return c.json({ error: "Nessun sub-task per questa area" }, 400);

    const stIndex = subTasks.findIndex((st) => st.id === subTaskId);
    if (stIndex === -1) return c.json({ error: "Sub-task non trovato" }, 404);

    subTasks[stIndex].completed = completed;
    areas[itemIndex].subTasks = subTasks;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        checklist_data: serializeChecklistData(areas, staySupplies, isObject) as Prisma.InputJsonValue,
      },
    });
    return c.json(updated);
  }

  // Legacy: area-level update
  const { itemIndex, completed, notes } = body as {
    itemIndex: number;
    completed?: boolean;
    notes?: string;
  };

  if (typeof itemIndex !== "number") {
    return c.json({ error: "itemIndex richiesto" }, 400);
  }
  if (itemIndex >= areas.length) {
    return c.json({ error: "Indice checklist non valido" }, 400);
  }

  if (typeof completed === "boolean") areas[itemIndex].completed = completed;
  if (typeof notes === "string") areas[itemIndex].notes = notes;

  const updated = await prisma.task.update({
    where: { id },
    data: {
      checklist_data: serializeChecklistData(areas, staySupplies, isObject) as Prisma.InputJsonValue,
    },
  });
  return c.json(updated);
});

// PATCH /api/tasks/:id/review
router.patch("/:id/review", auth, requireManager, async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = reviewTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return c.json({ error: "Task non trovata" }, 404);
  if (task.status !== "COMPLETED") {
    return c.json({ ...task, alreadyApplied: true });
  }

  const updatedTask = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id },
      data: {
        status: parsed.data.status,
        reviewed_at: new Date(),
        reviewed_by: userId,
        rejection_notes:
          parsed.data.status === "REJECTED" ? parsed.data.notes : null,
      },
      include: {
        property: { select: { id: true, name: true, code: true } },
        operator: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    if (parsed.data.status === "APPROVED") {
      await postConsumptionTx(tx, id, userId);
    }

    return updated;
  });

  return c.json(updatedTask);
});

// PATCH /api/tasks/:id/reopen
router.patch("/:id/reopen", auth, requireManager, async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = reopenTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const { count } = await prisma.task.updateMany({
    where: { id, status: "REJECTED" },
    data: {
      status: "IN_PROGRESS",
      reopen_note: parsed.data.note,
      reopen_at: new Date(),
      reopen_by: userId,
      reviewed_at: null,
      reviewed_by: null,
      completed_at: null,
    },
  });

  if (count === 0) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return c.json({ error: "Task non trovata" }, 404);
    if (task.status === "IN_PROGRESS") {
      return c.json({ ...task, alreadyApplied: true });
    }
    return c.json(
      {
        error: `Impossibile riaprire: lo stato attuale e' ${task.status} (richiesto REJECTED)`,
      },
      400
    );
  }

  const updatedTask = await prisma.task.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, name: true, code: true } },
      operator: { select: { id: true, first_name: true, last_name: true } },
    },
  });

  return c.json(updatedTask);
});

// POST /api/tasks/:id/photos
router.post("/:id/photos", auth, async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");
  const body = await c.req.json();
  const { checklistItemIndex, photoUrl } = body as {
    checklistItemIndex: number;
    photoUrl: string;
  };

  if (typeof checklistItemIndex !== "number" || !photoUrl) {
    return c.json({ error: "checklistItemIndex e photoUrl sono richiesti" }, 400);
  }

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return c.json({ error: "Task non trovato" }, 404);
  if (task.assigned_to !== userId) return c.json({ error: "Accesso negato" }, 403);
  if (task.status !== "IN_PROGRESS")
    return c.json({ error: "Il task non e' in corso" }, 400);

  const photo = await prisma.taskPhoto.create({
    data: { task_id: id, checklist_item_index: checklistItemIndex, photo_url: photoUrl },
  });

  const raw = task.checklist_data;
  if (raw) {
    const isArray = Array.isArray(raw);
    const areas = isArray
      ? (raw as Record<string, unknown>[])
      : ((raw as Record<string, unknown>).areas as Record<string, unknown>[] ?? []);

    if (checklistItemIndex < areas.length) {
      const urls = (areas[checklistItemIndex].photo_urls as string[]) || [];
      urls.push(photoUrl);
      areas[checklistItemIndex].photo_urls = urls;

      const updatedData = isArray ? areas : raw;
      await prisma.task.update({
        where: { id },
        data: { checklist_data: updatedData as Prisma.InputJsonValue },
      });
    }
  }

  return c.json(photo, 201);
});

// GET /api/tasks/:id/supply-usage
router.get("/:id/supply-usage", auth, async (c) => {
  const id = c.req.param("id");
  const usages = await prisma.taskSupplyUsage.findMany({
    where: { task_id: id },
    include: { supply_item: { select: { name: true, unit: true } } },
    orderBy: { created_at: "asc" },
  });
  return c.json(usages);
});

// PATCH /api/tasks/:id/supply-usage
router.patch("/:id/supply-usage", auth, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateTaskSupplyUsageSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const { supply_item_id, qty_used } = parsed.data;

  const usage = await prisma.taskSupplyUsage.upsert({
    where: {
      task_id_supply_item_id: { task_id: id, supply_item_id },
    },
    update: { qty_used },
    create: { task_id: id, supply_item_id, qty_used },
    include: { supply_item: { select: { name: true, unit: true } } },
  });

  return c.json(usage);
});

export default router;
