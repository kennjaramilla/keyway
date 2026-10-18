import {
  isOverdue,
  URGENCIES,
  type MaintenanceRequest,
  type Status,
} from "@/features/requests/schema";
import type { Dashboard } from "./schema";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

type Named = { id: string; name: string };

const isOpen = (request: MaintenanceRequest) => request.status !== "resolved";

function countByStatus(requests: MaintenanceRequest[]) {
  const counts: Partial<Record<Status, number>> = {};
  for (const request of requests) counts[request.status] = (counts[request.status] ?? 0) + 1;
  return counts;
}

/** Requests resolved in the 30 days before `now`. */
function resolvedRecently(requests: MaintenanceRequest[], now: Date) {
  const since = now.getTime() - 30 * DAY_MS;
  return requests.filter(
    (request) => request.resolvedAt && new Date(request.resolvedAt).getTime() >= since,
  );
}

/** Mean of resolvedAt − createdAt in hours, or null when nothing was resolved. */
export function averageResolveHours(requests: MaintenanceRequest[]) {
  const durations = requests
    .filter((request) => request.resolvedAt)
    .map(
      (request) =>
        (new Date(request.resolvedAt!).getTime() - new Date(request.createdAt).getTime()) / HOUR_MS,
    );
  if (durations.length === 0) return null;
  return durations.reduce((sum, hours) => sum + hours, 0) / durations.length;
}

/** Portfolio dashboard metrics from raw requests. Pure, so the numbers are unit-tested. */
export function computeDashboard(
  requests: MaintenanceRequest[],
  buildings: Named[],
  coordinators: Named[],
  now: Date = new Date(),
): Dashboard {
  const open = requests.filter(isOpen);
  const overdue = open.filter((request) => isOverdue(request, now));
  const recent = resolvedRecently(requests, now);

  return {
    totals: {
      open: open.length,
      overdue: overdue.length,
      resolved30d: recent.length,
      avgResolveHours30d: averageResolveHours(recent),
    },
    openByBuilding: buildings.map(({ id, name }) => {
      const inBuilding = open.filter((request) => request.buildingId === id);
      return { buildingId: id, name, open: inBuilding.length, byStatus: countByStatus(inBuilding) };
    }),
    resolveTimeByBuilding: buildings.map(({ id, name }) => {
      const inBuilding = recent.filter((request) => request.buildingId === id);
      return {
        buildingId: id,
        name,
        avgHours: averageResolveHours(inBuilding),
        resolved: inBuilding.length,
      };
    }),
    overdueByUrgency: URGENCIES.map((urgency) => ({
      urgency,
      overdue: overdue.filter((request) => request.urgency === urgency).length,
    })),
    workload: coordinators.map(({ id, name }) => {
      const assigned = open.filter((request) => request.coordinatorId === id);
      return { coordinatorId: id, name, open: assigned.length, byStatus: countByStatus(assigned) };
    }),
  };
}

/** "2.1 days" or "5.5 hours" for a duration in hours. */
export function formatDuration(hours: number | null) {
  if (hours === null) return "No data";
  if (hours < 24) return `${hours.toFixed(1)} hours`;
  return `${(hours / 24).toFixed(1)} days`;
}
