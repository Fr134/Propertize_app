import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Types for our mock ----

interface MockUser {
  id: string;
  active: boolean;
  role: string;
  is_super_admin: boolean;
  can_manage_leads: boolean;
  can_do_analysis: boolean;
  can_manage_operations: boolean;
  can_manage_onboarding: boolean;
  leads_assignment_count: number;
  analysis_assignment_count: number;
  operations_assignment_count: number;
  onboarding_assignment_count: number;
}

// ---- In-memory mock of prisma.user ----

let mockUsers: MockUser[] = [];

const mockPrisma = {
  user: {
    findMany: vi.fn(async ({ where, orderBy, take }: {
      where: Record<string, unknown>;
      select?: Record<string, boolean>;
      orderBy: Record<string, string>;
      take?: number;
    }) => {
      const orderField = Object.keys(orderBy)[0] as keyof MockUser;
      let filtered = mockUsers.filter((u) => {
        if (where.active !== undefined && u.active !== where.active) return false;
        if (where.role && u.role !== where.role) return false;
        if (where.OR) {
          const or = where.OR as Record<string, unknown>[];
          const match = or.some((cond) =>
            Object.entries(cond).every(([k, v]) => (u as Record<string, unknown>)[k] === v)
          );
          if (!match) return false;
        }
        return true;
      });
      filtered.sort((a, b) => {
        const aVal = a[orderField] as number;
        const bVal = b[orderField] as number;
        return aVal - bVal;
      });
      if (take) filtered = filtered.slice(0, take);
      return filtered;
    }),
    findUnique: vi.fn(async ({ where, select }: { where: { id: string }; select?: Record<string, boolean> }) => {
      const user = mockUsers.find((u) => u.id === where.id);
      if (!user) return null;
      if (select) {
        const result: Record<string, unknown> = {};
        for (const key of Object.keys(select)) {
          result[key] = (user as Record<string, unknown>)[key];
        }
        return result;
      }
      return user;
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const user = mockUsers.find((u) => u.id === where.id);
      if (!user) throw new Error("User not found");
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === "object" && value !== null && "increment" in value) {
          (user as Record<string, unknown>)[key] = ((user as Record<string, unknown>)[key] as number) + (value as { increment: number }).increment;
        } else if (typeof value === "object" && value !== null && "decrement" in value) {
          (user as Record<string, unknown>)[key] = ((user as Record<string, unknown>)[key] as number) - (value as { decrement: number }).decrement;
        } else {
          (user as Record<string, unknown>)[key] = value;
        }
      }
      return user;
    }),
  },
};

// Mock the prisma import
vi.mock("../lib/prisma", () => ({ prisma: mockPrisma }));

// Import after mocking
const { getNextAssignee, incrementAssignmentCount, decrementAssignmentCount } = await import("../lib/assignment");

function createUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: crypto.randomUUID(),
    active: true,
    role: "MANAGER",
    is_super_admin: false,
    can_manage_leads: false,
    can_do_analysis: false,
    can_manage_operations: false,
    can_manage_onboarding: false,
    leads_assignment_count: 0,
    analysis_assignment_count: 0,
    operations_assignment_count: 0,
    onboarding_assignment_count: 0,
    ...overrides,
  };
}

beforeEach(() => {
  mockUsers = [];
  vi.clearAllMocks();
});

describe("getNextAssignee", () => {
  it("should return null when no eligible users exist", async () => {
    mockUsers = [];
    const result = await getNextAssignee("leads");
    expect(result).toBeNull();
  });

  it("should return null when only OPERATOR users exist", async () => {
    mockUsers = [createUser({ role: "OPERATOR", can_manage_leads: true })];
    const result = await getNextAssignee("leads");
    expect(result).toBeNull();
  });

  it("should return null when users lack required permission", async () => {
    mockUsers = [createUser({ can_do_analysis: true })]; // has analysis, not leads
    const result = await getNextAssignee("leads");
    expect(result).toBeNull();
  });

  it("should return user with permission", async () => {
    const user = createUser({ can_manage_leads: true });
    mockUsers = [user];
    const result = await getNextAssignee("leads");
    expect(result).toBe(user.id);
  });

  it("should return super_admin even without explicit permission", async () => {
    const admin = createUser({ is_super_admin: true });
    mockUsers = [admin];
    const result = await getNextAssignee("leads");
    expect(result).toBe(admin.id);
  });

  it("should prefer user with lowest assignment count (round-robin)", async () => {
    const user1 = createUser({ can_manage_leads: true, leads_assignment_count: 5 });
    const user2 = createUser({ can_manage_leads: true, leads_assignment_count: 2 });
    const user3 = createUser({ can_manage_leads: true, leads_assignment_count: 8 });
    mockUsers = [user1, user2, user3];
    const result = await getNextAssignee("leads");
    expect(result).toBe(user2.id);
  });

  it("should skip inactive users", async () => {
    const inactive = createUser({ can_manage_leads: true, active: false, leads_assignment_count: 0 });
    const active = createUser({ can_manage_leads: true, leads_assignment_count: 10 });
    mockUsers = [inactive, active];
    const result = await getNextAssignee("leads");
    expect(result).toBe(active.id);
  });

  it("should work for analysis category", async () => {
    const user = createUser({ can_do_analysis: true, analysis_assignment_count: 3 });
    mockUsers = [user];
    const result = await getNextAssignee("analysis");
    expect(result).toBe(user.id);
  });

  it("should work for onboarding category", async () => {
    const user = createUser({ can_manage_onboarding: true, onboarding_assignment_count: 1 });
    mockUsers = [user];
    const result = await getNextAssignee("onboarding");
    expect(result).toBe(user.id);
  });
});

describe("incrementAssignmentCount", () => {
  it("should increment leads_assignment_count", async () => {
    const user = createUser({ can_manage_leads: true, leads_assignment_count: 3 });
    mockUsers = [user];
    await incrementAssignmentCount(user.id, "leads");
    expect(user.leads_assignment_count).toBe(4);
  });

  it("should increment analysis_assignment_count", async () => {
    const user = createUser({ can_do_analysis: true, analysis_assignment_count: 0 });
    mockUsers = [user];
    await incrementAssignmentCount(user.id, "analysis");
    expect(user.analysis_assignment_count).toBe(1);
  });

  it("should increment onboarding_assignment_count", async () => {
    const user = createUser({ can_manage_onboarding: true, onboarding_assignment_count: 5 });
    mockUsers = [user];
    await incrementAssignmentCount(user.id, "onboarding");
    expect(user.onboarding_assignment_count).toBe(6);
  });
});

describe("decrementAssignmentCount", () => {
  it("should decrement leads_assignment_count", async () => {
    const user = createUser({ leads_assignment_count: 3 });
    mockUsers = [user];
    await decrementAssignmentCount(user.id, "leads");
    expect(user.leads_assignment_count).toBe(2);
  });

  it("should not go below 0", async () => {
    const user = createUser({ leads_assignment_count: 0 });
    mockUsers = [user];
    await decrementAssignmentCount(user.id, "leads");
    expect(user.leads_assignment_count).toBe(0);
    // update should not have been called
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("should handle non-existent user gracefully", async () => {
    mockUsers = [];
    await decrementAssignmentCount("non-existent-id", "leads");
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});
