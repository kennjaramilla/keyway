import { z } from "zod";
import { dashboardSchema } from "@/features/dashboard/schema";
import { requestDetailSchema } from "@/features/requests/schema";
import { localDate, zonedTimeToUtc } from "@/features/requests/time";
import { vendorSchema } from "@/features/vendors/schema";
import { api, type ApiError } from "@/lib/api-client";
import { signInAs } from "@/test/session";

const status = (promise: Promise<unknown>) =>
  promise.then(
    () => 200,
    (error: ApiError) => error.status,
  );

const tomorrow = () => {
  const date = new Date(Date.now() + 86_400_000);
  return localDate(date, "America/New_York");
};

const validCreate = () => ({
  category: "electrical",
  urgency: "normal",
  title: "Bathroom exhaust fan rattles",
  description: "The fan makes a loud rattling noise when switched on.",
  location: "bathroom",
  preferredWindows: [{ date: tomorrow(), slot: "morning" }],
  permissionToEnter: true,
});

/** A window tomorrow, 10:00 to 12:00 New York time. */
const visitWindow = () => ({
  start: zonedTimeToUtc(tomorrow(), "10:00", "America/New_York").toISOString(),
  end: zonedTimeToUtc(tomorrow(), "12:00", "America/New_York").toISOString(),
});

const post = (path: string, body?: unknown) => api.post(path, requestDetailSchema, body);

describe("POST /api/requests", () => {
  it("creates a request owned by the signed-in resident", async () => {
    signInAs("resident");
    const created = await post("/requests", {
      ...validCreate(),
      unitId: "unit_hvl_7a",
      residentId: "usr_res_diego",
    });
    expect(created).toMatchObject({
      number: "KW-1031",
      status: "new",
      unitId: "unit_hvl_4b",
      residentId: "usr_res_amara",
      buildingId: "bld_harbor",
      coordinatorId: "usr_coord_grace",
      unitLabel: "4B",
    });
    expect(created.timeline.map((event) => event.type)).toEqual(["created"]);
  });

  it("rejects invalid input with field errors, and other roles with 403", async () => {
    signInAs("resident");
    const error = await post("/requests", { ...validCreate(), title: "x" }).catch(
      (caught: ApiError) => caught,
    );
    expect(error).toMatchObject({ status: 422 });
    expect((error as ApiError).problem.errors).toHaveProperty("title");

    signInAs("coordinator");
    expect(await status(post("/requests", validCreate()))).toBe(403);
  });
});

describe("workflow actions", () => {
  it("moves KW-1030 from new to resolved with a timeline event per step", async () => {
    signInAs("coordinator");
    await post("/requests/req_030/triage", { urgency: "emergency" });
    await post("/requests/req_030/assign", { vendorId: "ven_tidewater" });
    const scheduled = await post("/requests/req_030/schedule", visitWindow());
    expect(scheduled).toMatchObject({ status: "scheduled", vendorName: "Tidewater Plumbing Co." });
    await post("/requests/req_030/start");
    const resolved = await post("/requests/req_030/resolve", { resolutionNote: "Replaced valve." });
    expect(resolved.status).toBe("resolved");
    expect(resolved.resolvedAt).not.toBeNull();
    expect(resolved.timeline.map((event) => event.type)).toEqual([
      "created",
      "triaged",
      "vendor_assigned",
      "scheduled",
      "started",
      "resolved",
    ]);
  });

  it("returns 409 for a transition the status machine doesn't allow", async () => {
    signInAs("coordinator");
    expect(await status(post("/requests/req_030/start"))).toBe(409);
    expect(await status(post("/requests/req_030/assign", { vendorId: "ven_tidewater" }))).toBe(409);
    expect(await status(post("/requests/req_001/resolve", { resolutionNote: "Again" }))).toBe(409);
    // KW-1012 is triaged without a vendor.
    expect(await status(post("/requests/req_012/schedule", visitWindow()))).toBe(409);
  });

  it("validates bodies with 422", async () => {
    signInAs("coordinator");
    expect(await status(post("/requests/req_030/triage", { urgency: "soon" }))).toBe(422);
    // KW-1014 is triaged with a vendor; a window in the past is rejected.
    const past = { start: "2020-01-01T15:00:00Z", end: "2020-01-01T16:00:00Z" };
    expect(await status(post("/requests/req_014/schedule", past))).toBe(422);
    expect(await status(post("/requests/req_014/assign", { vendorId: "ven_nobody" }))).toBe(422);
    expect(await status(post("/requests/req_017/resolve", { resolutionNote: "" }))).toBe(422);
  });

  it("is 403 for the wrong role and 404 out of scope", async () => {
    signInAs("resident");
    expect(await status(post("/requests/req_030/triage", {}))).toBe(403);
    signInAs("usr_res_diego");
    expect(await status(post("/requests/req_030/triage", {}))).toBe(404);
    signInAs("usr_coord_theo");
    expect(await status(post("/requests/req_030/triage", {}))).toBe(404);
    signInAs("manager");
    expect(await status(post("/requests/req_030/triage", {}))).toBe(403);
    expect(await status(post("/requests/req_030/archive", {}))).toBe(404);
  });

  it("requires a session", async () => {
    expect(await status(post("/requests/req_030/triage", {}))).toBe(401);
    expect(await status(post("/requests", validCreate()))).toBe(401);
  });
});

describe("GET /api/vendors", () => {
  it("lists vendors serving the active building only", async () => {
    signInAs("coordinator", "bld_maple");
    const vendors = await api.get("/vendors", z.array(vendorSchema));
    expect(vendors.every((vendor) => vendor.buildingIds.includes("bld_maple"))).toBe(true);
    signInAs("usr_coord_theo");
    const linden = await api.get("/vendors", z.array(vendorSchema));
    expect(linden.map((vendor) => vendor.id)).not.toContain("ven_plumblevel");
    expect(
      await status(
        api.get("/vendors", z.array(vendorSchema), { query: { buildingId: "bld_harbor" } }),
      ),
    ).toBe(404);
    signInAs("resident");
    expect(await status(api.get("/vendors", z.array(vendorSchema)))).toBe(403);
  });
});

describe("GET /api/dashboard", () => {
  it("returns the seeded portfolio numbers to the manager only", async () => {
    signInAs("manager");
    const dashboard = await api.get("/dashboard", dashboardSchema);
    expect(dashboard.openByBuilding.map((row) => [row.name, row.open])).toEqual([
      ["Harbor View Lofts", 7],
      ["Maple Court", 7],
      ["The Linden", 6],
    ]);
    expect(dashboard.overdueByUrgency).toEqual([
      { urgency: "emergency", overdue: 0 },
      { urgency: "high", overdue: 2 },
      { urgency: "normal", overdue: 1 },
      { urgency: "low", overdue: 1 },
    ]);
    expect(dashboard.workload.map((row) => [row.name, row.open])).toEqual([
      ["Grace Adeyemi", 14],
      ["Theo Marchetti", 6],
    ]);

    signInAs("coordinator");
    expect(await status(api.get("/dashboard", dashboardSchema))).toBe(403);
    signInAs("resident");
    expect(await status(api.get("/dashboard", dashboardSchema))).toBe(403);
  });
});
