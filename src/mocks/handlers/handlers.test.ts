import { z } from "zod";
import { requestListSchema, requestSchema } from "@/features/requests/schema";
import { demoPeopleSchema, sessionSchema } from "@/features/session/schema";
import { api } from "@/lib/api-client";
import { readSessionCookie } from "@/lib/auth/session-cookie";
import { signInAs } from "@/test/session";

const status = (promise: Promise<unknown>) =>
  promise.then(
    () => 200,
    (error: { status: number }) => error.status,
  );

describe("session endpoints", () => {
  it("lists demo people with their building or unit", async () => {
    const people = await api.get("/demo/people", demoPeopleSchema);
    expect(people).toContainEqual(
      expect.objectContaining({ name: "Amara Okafor", context: "Harbor View Lofts · 4B" }),
    );
    expect(people).toContainEqual(
      expect.objectContaining({ name: "Grace Adeyemi", context: "Harbor View Lofts, Maple Court" }),
    );
  });

  it("signs in, reads the session and signs out", async () => {
    expect(await status(api.get("/session", sessionSchema))).toBe(401);
    const session = await api.post("/session", sessionSchema, { userId: "usr_coord_grace" });
    expect(session.user.activeBuildingId).toBe("bld_harbor");
    expect(session.buildings.map((b) => b.name)).toEqual(["Harbor View Lofts", "Maple Court"]);
    expect(readSessionCookie()).toMatchObject({ userId: "usr_coord_grace" });

    await api.delete("/session", z.null());
    expect(readSessionCookie()).toBeNull();
  });

  it("rejects unknown people and malformed bodies", async () => {
    expect(await status(api.post("/session", sessionSchema, { userId: "usr_nobody" }))).toBe(404);
    expect(await status(api.post("/session", sessionSchema, {}))).toBe(422);
  });

  it("switches only to covered buildings", async () => {
    signInAs("coordinator");
    const session = await api.put("/session/building", sessionSchema, { buildingId: "bld_maple" });
    expect(session.user.activeBuildingId).toBe("bld_maple");
    expect(readSessionCookie()?.activeBuildingId).toBe("bld_maple");
    expect(
      await status(api.put("/session/building", sessionSchema, { buildingId: "bld_linden" })),
    ).toBe(404);
  });

  it("does not let residents switch", async () => {
    signInAs("resident");
    expect(
      await status(api.put("/session/building", sessionSchema, { buildingId: "bld_harbor" })),
    ).toBe(403);
  });

  it("ignores a forged active building outside the user's scope", async () => {
    signInAs("coordinator", "bld_linden");
    const session = await api.get("/session", sessionSchema);
    expect(session.user.activeBuildingId).toBe("bld_harbor");
  });
});

describe("request endpoints enforce tenant isolation", () => {
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

  it("filters by status and sorts newest first by default", async () => {
    signInAs("coordinator");
    const open = await api.get("/requests", requestListSchema, { query: { status: "new" } });
    expect(open.every((request) => request.status === "new")).toBe(true);
    const all = await api.get("/requests", requestListSchema);
    expect(all.map((r) => r.createdAt)).toEqual([...all.map((r) => r.createdAt)].sort().reverse());
    const oldest = await api.get("/requests", requestListSchema, { query: { sort: "oldest" } });
    expect(oldest[0]?.createdAt).toBe(all.at(-1)?.createdAt);
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
