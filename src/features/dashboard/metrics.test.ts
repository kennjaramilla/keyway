import { createSeed } from "@/mocks/seed";
import {
  averageResolveHours,
  computeDashboard,
  formatChange,
  formatDuration,
  onTimeRate,
} from "./metrics";

const NOW = Date.parse("2026-10-19T14:00:00Z");

describe("dashboard metrics", () => {
  const db = createSeed(NOW);
  const coordinators = db.users.filter((user) => user.role === "coordinator");
  const dashboard = computeDashboard(
    db.requests,
    db.buildings,
    coordinators,
    new Date(NOW),
    db.vendors,
  );

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

  it("compares this week with last week and lists the last 7 days", () => {
    expect(dashboard.weekly).toEqual({ opened: 20, openedPrev: 3, resolved: 2, resolvedPrev: 4 });
    expect(dashboard.daily.map((day) => day.date)).toEqual([
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
      "2026-10-19",
    ]);
    expect(dashboard.daily.reduce((sum, day) => sum + day.opened, 0)).toBe(20);
  });

  it("splits tracked work into met, at risk and breached", () => {
    expect(dashboard.onTime).toEqual({ met: 25, atRisk: 1, breached: 4 });
    expect(onTimeRate(dashboard.onTime)).toBe(87);
    expect(onTimeRate({ met: 0, atRisk: 0, breached: 0 })).toBeNull();
    expect(dashboard.buildingHealth.map((row) => [row.open, row.overdue, row.onTimePct])).toEqual([
      [7, 2, 80],
      [7, 2, 82],
      [6, 0, 100],
    ]);
  });

  it("orders vendors on site first, then scheduled", () => {
    const states = dashboard.vendors.map((row) => row.state);
    expect(states).toEqual(
      [...states].sort((a, b) => (a === "on_site" ? -1 : b === "on_site" ? 1 : 0)),
    );
    expect(dashboard.vendors.find((row) => row.vendorId === "ven_tidewater")).toMatchObject({
      onSite: 1,
      scheduled: 1,
      state: "on_site",
    });
    expect(dashboard.vendors.find((row) => row.vendorId === "ven_corner")?.state).toBe("scheduled");
  });

  it("formats week-on-week changes", () => {
    expect(formatChange(5, 2)).toBe("+3 vs last week");
    expect(formatChange(2, 4)).toBe("−2 vs last week");
    expect(formatChange(3, 3)).toBe("Same as last week");
  });

  it("formats durations", () => {
    expect(formatDuration(null)).toBe("No data");
    expect(formatDuration(5.25)).toBe("5.3 hours");
    expect(formatDuration(50.4)).toBe("2.1 days");
  });
});
