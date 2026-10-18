import { requestDetailSchema, requestListSchema, requestSchema } from "@/features/requests/schema";
import { localDate, zonedTimeToUtc } from "@/features/requests/time";
import { api, type ApiError } from "@/lib/api-client";
import { postRaw, statusOf as status } from "@/test/api";
import { signInAs } from "@/test/session";

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

describe("GET /api/requests and /api/requests/:id", () => {
  it("residents see only their own unit", async () => {
    signInAs("resident");
    const requests = await api.get("/requests", requestListSchema);
    expect(requests.length).toBeGreaterThan(0);
    expect(new Set(requests.map((request) => request.unitId))).toEqual(new Set(["unit_hvl_4b"]));
  });

  it("coordinators see only the active building, and may not list another", async () => {
    signInAs("coordinator");
    const requests = await api.get("/requests", requestListSchema, {
      query: { buildingId: "bld_harbor" },
    });
    expect(new Set(requests.map((request) => request.buildingId))).toEqual(new Set(["bld_harbor"]));
    expect(
      await status(api.get("/requests", requestListSchema, { query: { buildingId: "bld_maple" } })),
    ).toBe(404);
  });

  it("sorts newest first (the queue filters and sorts on the client)", async () => {
    signInAs("coordinator");
    const all = await api.get("/requests", requestListSchema);
    expect(all.map((r) => r.createdAt)).toEqual([...all.map((r) => r.createdAt)].sort().reverse());
  });

  it("returns 404 for a request outside scope, not 403", async () => {
    signInAs("usr_res_diego");
    expect(await status(api.get("/requests/req_001", requestSchema))).toBe(404);
    signInAs("usr_coord_theo");
    expect(await status(api.get("/requests/req_001", requestSchema))).toBe(404);
    signInAs("manager");
    expect(await status(api.get("/requests/req_001", requestSchema))).toBe(200);
  });

  it("requires a session", async () => {
    expect(await status(api.get("/requests", requestListSchema))).toBe(401);
    expect(await status(api.get("/requests/req_001", requestSchema))).toBe(401);
  });
});

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

  it("rejects a vendor who doesn't serve the request's building with 422", async () => {
    signInAs("usr_coord_theo");
    // Plumb & Level serves Harbor and Maple, not The Linden (KW-1019).
    const error = await post("/requests/req_019/assign", { vendorId: "ven_plumblevel" }).catch(
      (caught: ApiError) => caught,
    );
    expect(error).toMatchObject({ status: 422 });
    expect((error as ApiError).problem.errors).toHaveProperty("vendorId");
  });

  it("answers a malformed JSON body with 422", async () => {
    signInAs("resident");
    expect((await postRaw("/requests", "{not json")).status).toBe(422);
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
