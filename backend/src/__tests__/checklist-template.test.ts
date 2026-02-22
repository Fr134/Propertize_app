import { describe, it, expect } from "vitest";
import { checklistTemplateSchema } from "../lib/validators";

const VALID_UUID = "00000000-0000-0000-0000-000000000001";

const validArea = {
  id: VALID_UUID,
  area: "Bagno",
  description: "Pulire sanitari e pavimento",
  photo_required: true,
  sub_tasks: [{ id: VALID_UUID, label: "Pulire WC", completed: false }],
  supply_items: [
    { supply_item_id: VALID_UUID, label: "Carta igienica", expected_qty: 2 },
  ],
};

describe("checklistTemplateSchema", () => {
  it("should pass with empty array", () => {
    const result = checklistTemplateSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("should pass with valid area with all fields", () => {
    const result = checklistTemplateSchema.safeParse([validArea]);
    expect(result.success).toBe(true);
  });

  it("should fail when area is missing id", () => {
    const { id: _, ...noId } = validArea;
    const result = checklistTemplateSchema.safeParse([noId]);
    expect(result.success).toBe(false);
  });

  it("should fail when area is missing area name", () => {
    const { area: _, ...noName } = validArea;
    const result = checklistTemplateSchema.safeParse([noName]);
    expect(result.success).toBe(false);
  });

  it("should fail when sub_task is missing label", () => {
    const badArea = {
      ...validArea,
      sub_tasks: [{ id: VALID_UUID, completed: false }],
    };
    const result = checklistTemplateSchema.safeParse([badArea]);
    expect(result.success).toBe(false);
  });

  it("should fail when supply_item is missing supply_item_id", () => {
    const badArea = {
      ...validArea,
      supply_items: [{ label: "Carta", expected_qty: 1 }],
    };
    const result = checklistTemplateSchema.safeParse([badArea]);
    expect(result.success).toBe(false);
  });

  it("should fail when supply_item expected_qty < 1", () => {
    const badArea = {
      ...validArea,
      supply_items: [
        { supply_item_id: VALID_UUID, label: "Carta", expected_qty: 0 },
      ],
    };
    const result = checklistTemplateSchema.safeParse([badArea]);
    expect(result.success).toBe(false);
  });

  it("should pass with multiple areas", () => {
    const area2 = {
      ...validArea,
      id: "00000000-0000-0000-0000-000000000002",
      area: "Cucina",
      sub_tasks: [],
      supply_items: [],
    };
    const result = checklistTemplateSchema.safeParse([validArea, area2]);
    expect(result.success).toBe(true);
  });

  it("should pass with area having empty sub_tasks and supply_items", () => {
    const minimal = {
      id: VALID_UUID,
      area: "Ingresso",
      description: "Spazzare",
      photo_required: false,
      sub_tasks: [],
      supply_items: [],
    };
    const result = checklistTemplateSchema.safeParse([minimal]);
    expect(result.success).toBe(true);
  });
});
