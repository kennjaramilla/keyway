import { z } from "zod";
import { sessionSchema, demoPeopleSchema } from "@/features/session/schema";
import { api } from "@/lib/api-client";
import { readSessionCookie } from "@/lib/auth/session-cookie";
import { postRaw, statusOf as status } from "@/test/api";
import { signInAs } from "@/test/session";

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

  it("answers malformed JSON with 422, not a crash", async () => {
    expect((await postRaw("/session", "{not json")).status).toBe(422);
    signInAs("coordinator");
    expect((await postRaw("/session/building", "{not json", "PUT")).status).toBe(422);
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
