import { describe, expect, it } from "vitest";
import { reassignCoordinatorSchema, reassignmentConflict } from "./schema";

const grace = { id: "grace", name: "Grace", buildingIds: ["harbor", "maple"] };
const theo = { id: "theo", name: "Theo", buildingIds: ["linden"] };
const maple = { id: "maple", coordinatorIds: ["grace"] };

describe("reassignCoordinatorSchema", () => {
  it("needs two different coordinators", () => {
    expect(reassignCoordinatorSchema.safeParse({ fromId: "grace", toId: "theo" }).success).toBe(
      true,
    );
    expect(reassignCoordinatorSchema.safeParse({ fromId: "grace", toId: "grace" }).success).toBe(
      false,
    );
    expect(reassignCoordinatorSchema.safeParse({ fromId: "grace" }).success).toBe(false);
  });
});

describe("reassignmentConflict", () => {
  it("allows moving a building to someone who doesn't cover it", () => {
    expect(reassignmentConflict(maple, grace, theo)).toBeNull();
  });

  it("refuses when the current coordinator isn't on the building", () => {
    expect(reassignmentConflict(maple, theo, grace)?.code).toBe("NOT_ASSIGNED");
  });

  it("refuses when the new coordinator already covers it", () => {
    const shared = { id: "maple", coordinatorIds: ["grace", "theo"] };
    expect(reassignmentConflict(shared, grace, theo)?.code).toBe("ALREADY_ASSIGNED");
  });

  it("keeps each coordinator's last building", () => {
    const linden = { id: "linden", coordinatorIds: ["theo"] };
    expect(reassignmentConflict(linden, theo, grace)?.code).toBe("LAST_BUILDING");
  });
});
