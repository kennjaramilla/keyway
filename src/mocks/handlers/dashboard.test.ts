import { dashboardSchema } from "@/features/dashboard/schema";
import { api } from "@/lib/api-client";
import { statusOf as status } from "@/test/api";
import { signInAs } from "@/test/session";

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
