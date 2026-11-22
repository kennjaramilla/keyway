import { coverageSchema } from "@/features/buildings/schema";
import { sessionSchema } from "@/features/session/schema";
import { api } from "@/lib/api-client";
import { statusOf as status } from "@/test/api";
import { signInAs } from "@/test/session";
import { getDb } from "../db";

const move = (buildingId: string, fromId: string, toId: string) =>
  api.post(`/buildings/${buildingId}/coordinator`, coverageSchema, { fromId, toId });

describe("GET /api/buildings/coverage", () => {
  it("shows the manager every building's coordinators", async () => {
    signInAs("manager");
    const coverage = await api.get("/buildings/coverage", coverageSchema);
    expect(coverage.buildings.find((b) => b.id === "bld_maple")?.coordinatorIds).toEqual([
      "usr_coord_grace",
    ]);
    expect(coverage.coordinators.map((c) => c.id)).toEqual(["usr_coord_grace", "usr_coord_theo"]);
  });

  it("is manager-only", async () => {
    signInAs("coordinator");
    expect(await status(api.get("/buildings/coverage", coverageSchema))).toBe(403);
    signInAs("resident");
    expect(await status(api.get("/buildings/coverage", coverageSchema))).toBe(403);
  });
});

describe("POST /api/buildings/:id/coordinator", () => {
  it("moves Maple Court from Grace to Theo, with its open requests", async () => {
    const openAtMaple = getDb().requests.filter(
      (r) => r.buildingId === "bld_maple" && !["resolved", "cancelled"].includes(r.status),
    );
    signInAs("manager");
    const coverage = await move("bld_maple", "usr_coord_grace", "usr_coord_theo");
    expect(coverage.buildings.find((b) => b.id === "bld_maple")?.coordinatorIds).toEqual([
      "usr_coord_theo",
    ]);
    const db = getDb();
    for (const request of openAtMaple) {
      expect(db.requests.find((r) => r.id === request.id)?.coordinatorId).toBe("usr_coord_theo");
    }

    signInAs("usr_coord_theo");
    const theo = await api.get("/session", sessionSchema);
    expect(theo.buildings.map((b) => b.id)).toContain("bld_maple");
    signInAs("usr_coord_grace", "bld_harbor");
    const grace = await api.get("/session", sessionSchema);
    expect(grace.buildings.map((b) => b.id)).toEqual(["bld_harbor"]);
  });

  it("refuses moves that don't fit the current coverage", async () => {
    signInAs("manager");
    expect(await status(move("bld_maple", "usr_coord_theo", "usr_coord_grace"))).toBe(409);
    expect(await status(move("bld_linden", "usr_coord_theo", "usr_coord_grace"))).toBe(409);
    expect(await status(move("bld_maple", "usr_coord_grace", "usr_coord_grace"))).toBe(422);
    expect(await status(move("bld_maple", "usr_coord_grace", "usr_res_amara"))).toBe(404);
    expect(await status(move("bld_nowhere", "usr_coord_grace", "usr_coord_theo"))).toBe(404);
  });

  it("is manager-only", async () => {
    signInAs("coordinator");
    expect(await status(move("bld_maple", "usr_coord_grace", "usr_coord_theo"))).toBe(403);
  });
});
