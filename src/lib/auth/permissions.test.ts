import { ACTIONS, authorize, can, roleCan, type Action, type Subject } from "./permissions";

const amara: Subject = {
  id: "usr_res_amara",
  role: "resident",
  unitId: "unit_hvl_4b",
  buildingIds: ["bld_harbor"],
  activeBuildingId: "bld_harbor",
};
const grace: Subject = {
  id: "usr_coord_grace",
  role: "coordinator",
  unitId: null,
  buildingIds: ["bld_harbor", "bld_maple"],
  activeBuildingId: "bld_harbor",
};
const helena: Subject = {
  id: "usr_mgr_helena",
  role: "manager",
  unitId: null,
  buildingIds: ["bld_harbor", "bld_maple", "bld_linden"],
  activeBuildingId: "bld_maple",
};

// Role column of the matrix in docs/spec/product-spec.md.
const MATRIX: Record<Action, [resident: boolean, coordinator: boolean, manager: boolean]> = {
  "session:sign-in": [true, true, true],
  "session:sign-out": [true, true, true],
  "demo:reset": [true, true, true],
  "building:switch": [false, true, true],
  "building:assign-coordinator": [false, false, true],
  "request:create": [true, false, false],
  "request:list": [true, true, true],
  "request:view": [true, true, true],
  "request:triage": [false, true, false],
  "request:assign": [false, true, true],
  "request:schedule": [false, true, false],
  "request:start": [false, true, false],
  "request:resolve": [false, true, false],
  "request:cancel": [true, false, false],
  "request:reopen": [true, true, false],
  "vendor:list": [false, true, true],
  "thread:create": [true, false, false],
  "thread:view": [true, true, false],
  "message:send": [true, true, false],
  "rules:ask": [true, true, true],
  "rules:view": [true, true, true],
  "dashboard:view": [false, false, true],
};

describe("roleCan", () => {
  it("covers every action in the matrix", () => {
    expect(Object.keys(MATRIX).sort()).toEqual([...ACTIONS].sort());
  });

  it.each(Object.entries(MATRIX))(
    "%s matches the role matrix",
    (action, [resident, coordinator, manager]) => {
      expect(roleCan("resident", action as Action)).toBe(resident);
      expect(roleCan("coordinator", action as Action)).toBe(coordinator);
      expect(roleCan("manager", action as Action)).toBe(manager);
    },
  );
});

describe("can: resident scope is their unit", () => {
  it("views and lists only their own unit", () => {
    expect(can(amara, "request:view", { buildingId: "bld_harbor", unitId: "unit_hvl_4b" })).toBe(
      true,
    );
    expect(can(amara, "request:view", { buildingId: "bld_harbor", unitId: "unit_hvl_7a" })).toBe(
      false,
    );
    expect(can(amara, "request:list")).toBe(true);
  });

  it("cancels only their own request", () => {
    expect(can(amara, "request:cancel", { unitId: "unit_hvl_4b", residentId: amara.id })).toBe(
      true,
    );
    expect(can(amara, "request:cancel", { unitId: "unit_hvl_4b", residentId: "usr_other" })).toBe(
      false,
    );
  });

  it("messages only on their own threads", () => {
    expect(can(amara, "message:send", { residentId: amara.id })).toBe(true);
    expect(can(amara, "thread:view", { residentId: "usr_res_diego" })).toBe(false);
  });

  it("asks rules only for their own building and can't switch", () => {
    expect(can(amara, "rules:ask", { buildingId: "bld_harbor" })).toBe(true);
    expect(can(amara, "rules:ask", { buildingId: "bld_maple" })).toBe(false);
    expect(can(amara, "building:switch", { buildingId: "bld_harbor" })).toBe(false);
  });

  it("has no scope without a unit", () => {
    expect(can({ ...amara, unitId: null }, "request:list")).toBe(false);
  });
});

describe("can: coordinator scope is covered buildings", () => {
  it("switches only to covered buildings", () => {
    expect(can(grace, "building:switch", { buildingId: "bld_maple" })).toBe(true);
    expect(can(grace, "building:switch", { buildingId: "bld_linden" })).toBe(false);
  });

  it("lists only the active building", () => {
    expect(can(grace, "request:list", { buildingId: "bld_harbor" })).toBe(true);
    expect(can(grace, "request:list", { buildingId: "bld_maple" })).toBe(false);
    expect(can(grace, "vendor:list")).toBe(true);
  });

  it("views and works requests in any covered building", () => {
    expect(can(grace, "request:view", { buildingId: "bld_maple" })).toBe(true);
    expect(can(grace, "request:triage", { buildingId: "bld_linden" })).toBe(false);
  });

  it("asks rules for the active building only", () => {
    expect(can(grace, "rules:ask", { buildingId: "bld_harbor" })).toBe(true);
    expect(can(grace, "rules:ask", { buildingId: "bld_maple" })).toBe(false);
  });
});

describe("can: manager scope is the portfolio", () => {
  it("views anything and sees the dashboard", () => {
    expect(can(helena, "request:view", { buildingId: "bld_linden", unitId: "unit_lin_5d" })).toBe(
      true,
    );
    expect(can(helena, "dashboard:view")).toBe(true);
    expect(can(helena, "building:switch", { buildingId: "bld_linden" })).toBe(true);
  });

  it("asks rules for the active building and never reads threads", () => {
    expect(can(helena, "rules:ask", { buildingId: "bld_maple" })).toBe(true);
    expect(can(helena, "rules:ask", { buildingId: "bld_harbor" })).toBe(false);
    expect(can(helena, "thread:view", { buildingId: "bld_maple" })).toBe(false);
  });
});

describe("authorize", () => {
  it("returns not_found outside scope, even when the role also lacks the action", () => {
    expect(authorize(amara, "request:triage", { unitId: "unit_hvl_7a" })).toBe("not_found");
    expect(authorize(grace, "request:view", { buildingId: "bld_linden" })).toBe("not_found");
  });

  it("returns forbidden for an in-scope resource and the wrong role", () => {
    expect(authorize(amara, "request:triage", { unitId: "unit_hvl_4b" })).toBe("forbidden");
    expect(authorize(helena, "message:send", { buildingId: "bld_harbor" })).toBe("forbidden");
    expect(authorize(grace, "dashboard:view")).toBe("forbidden");
  });

  it("returns allowed when role and scope match", () => {
    expect(authorize(grace, "request:triage", { buildingId: "bld_maple" })).toBe("allowed");
  });
});
