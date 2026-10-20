import { rulesSchema } from "@/features/house-rules/schema";
import { api } from "@/lib/api-client";
import { statusOf as status } from "@/test/api";
import { signInAs } from "@/test/session";

const getRules = (buildingId?: string) => api.get("/rules", rulesSchema, { query: { buildingId } });

describe("GET /api/rules", () => {
  it("returns the active building's rules in section order", async () => {
    signInAs("resident");
    const { document, passages } = await getRules();
    expect(document.buildingId).toBe("bld_harbor");
    expect(passages.every((passage) => passage.documentId === document.id)).toBe(true);
    const sections = passages.map((passage) => passage.section);
    expect(sections.slice(0, 2)).toEqual(["2.1", "3.1"]);
    expect(sections.indexOf("10.1")).toBeGreaterThan(sections.indexOf("9.1"));
  });

  it("follows the coordinator's active building and hides other buildings", async () => {
    signInAs("coordinator", "bld_maple");
    expect((await getRules("bld_maple")).document.buildingId).toBe("bld_maple");
    signInAs("resident");
    expect(await status(getRules("bld_linden"))).toBe(404);
  });

  it("requires a session", async () => {
    expect(await status(getRules())).toBe(401);
  });
});
