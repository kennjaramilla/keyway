import { createSeed } from "@/mocks/seed";
import { averageResolveHours, computeDashboard, formatDuration } from "./metrics";

const NOW = Date.parse("2026-10-19T14:00:00Z");

describe("dashboard metrics", () => {
  const db = createSeed(NOW);
  const coordinators = db.users.filter((user) => user.role === "coordinator");
  const dashboard = computeDashboard(db.requests, db.buildings, coordinators, new Date(NOW));

  it("matches the seeded numbers in the spec", () => {
    expect(dashboard.totals.open).toBe(20);
    expect(dashboard.totals.overdue).toBe(4);
    expect(dashboard.openByBuilding.map((row) => row.open)).toEqual([7, 7, 6]);
    expect(dashboard.overdueByUrgency.map((row) => row.overdue)).toEqual([0, 2, 1, 1]);
    expect(dashboard.workload.map((row) => row.open)).toEqual([14, 6]);
    expect(dashboard.openByBuilding[0]?.byStatus).toEqual({
      new: 2,
      triaged: 2,
      scheduled: 2,
      in_progress: 1,
    });
  });

  it("averages resolve time over the last 30 days", () => {
    expect(dashboard.totals.resolved30d).toBe(10);
    expect(dashboard.totals.avgResolveHours30d).toBeGreaterThan(0);
    expect(dashboard.resolveTimeByBuilding.reduce((sum, row) => sum + row.resolved, 0)).toBe(10);
  });

  it("handles no resolved requests", () => {
    expect(averageResolveHours([])).toBeNull();
    const empty = computeDashboard([], db.buildings, coordinators, new Date(NOW));
    expect(empty.totals).toEqual({ open: 0, overdue: 0, resolved30d: 0, avgResolveHours30d: null });
  });

  it("formats durations", () => {
    expect(formatDuration(null)).toBe("No data");
    expect(formatDuration(5.25)).toBe("5.3 hours");
    expect(formatDuration(50.4)).toBe("2.1 days");
  });
});
