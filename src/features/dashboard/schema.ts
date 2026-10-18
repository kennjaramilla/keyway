import { z } from "zod";
import { statusSchema, urgencySchema } from "@/features/requests/schema";

const statusCounts = z.partialRecord(statusSchema, z.number().int());

/** GET /api/dashboard: portfolio metrics (definitions in docs/spec/data-model.md). */
export const dashboardSchema = z.object({
  totals: z.object({
    open: z.number().int(),
    overdue: z.number().int(),
    resolved30d: z.number().int(),
    avgResolveHours30d: z.number().nullable(),
  }),
  openByBuilding: z.array(
    z.object({
      buildingId: z.string(),
      name: z.string(),
      open: z.number().int(),
      byStatus: statusCounts,
    }),
  ),
  resolveTimeByBuilding: z.array(
    z.object({
      buildingId: z.string(),
      name: z.string(),
      avgHours: z.number().nullable(),
      resolved: z.number().int(),
    }),
  ),
  overdueByUrgency: z.array(z.object({ urgency: urgencySchema, overdue: z.number().int() })),
  workload: z.array(
    z.object({
      coordinatorId: z.string(),
      name: z.string(),
      open: z.number().int(),
      byStatus: statusCounts,
    }),
  ),
});
export type Dashboard = z.infer<typeof dashboardSchema>;
