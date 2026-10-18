import { SEED_META, createSeed } from "./seed";

describe("seed", () => {
  const anchor = Date.parse(SEED_META.anchorNow);

  it("parses the full spec seed", () => {
    const db = createSeed(anchor);
    expect(db.buildings).toHaveLength(3);
    expect(db.requests).toHaveLength(30);
    expect(db.users.map((user) => user.id)).toContain("usr_coord_grace");
  });

  it("keeps timestamps unchanged at the anchor time", () => {
    const db = createSeed(anchor);
    expect(db.requests.find((request) => request.id === "req_001")?.createdAt).toBe(
      "2026-09-21T13:00:00.000Z",
    );
  });

  it("shifts timestamps and preferred dates relative to now", () => {
    const tenDaysLater = anchor + 10 * 86_400_000;
    const request = createSeed(tenDaysLater).requests.find((item) => item.id === "req_001");
    expect(request?.createdAt).toBe("2026-10-01T13:00:00.000Z");
    expect(request?.timeline[0]?.at).toBe("2026-10-01T13:00:00.000Z");
    expect(request?.preferredWindows[0]?.date).toBe("2026-10-02");
  });

  it("keeps visit windows on whole hours", () => {
    const request = createSeed(anchor + 97 * 60_000).requests.find((item) => item.id === "req_017");
    // Seeded 12:00-14:00Z; 1h37m later rounds to a 2h shift.
    expect(request?.visitWindow).toEqual({
      start: "2026-10-19T14:00:00.000Z",
      end: "2026-10-19T16:00:00.000Z",
    });
  });

  it("does not shift rule document effective dates", () => {
    const db = createSeed(anchor + 100 * 86_400_000);
    expect(db.ruleDocuments[0]?.effectiveDate).toBe("2026-01-01");
  });
});
