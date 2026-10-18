import { getDb, nextId, resetDb, updateDb } from "./db";

describe("mock db", () => {
  it("persists writes to localStorage and resets to the seed", () => {
    updateDb((db) => {
      db.requests = [];
    });
    expect(getDb().requests).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem("keyway:db:v1") ?? "{}").requests).toEqual([]);

    resetDb();
    expect(getDb().requests).toHaveLength(30);
  });

  it("returns the mutator's result", () => {
    expect(updateDb((db) => db.users.length)).toBe(9);
  });

  it("creates prefixed unique ids", () => {
    expect(nextId("req")).toMatch(/^req_/);
    expect(nextId("req")).not.toBe(nextId("req"));
  });
});

describe("mock db loading", () => {
  it("reseeds when the stored db is corrupt", async () => {
    localStorage.setItem("keyway:db:v1", "{not json");
    vi.resetModules();
    const fresh = await import("./db");
    expect(fresh.getDb().requests).toHaveLength(30);
  });
});
