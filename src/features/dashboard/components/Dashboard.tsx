"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_LABELS, STATUSES, URGENCY_LABELS } from "@/features/requests/schema";
import { useDashboard } from "../hooks/useDashboard";
import { formatDuration } from "../metrics";
import type { Dashboard as DashboardData } from "../schema";
import { ChartPanel } from "./ChartPanel";

const OPEN_STATUSES = STATUSES.filter((status) => status !== "resolved");
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <dt className="text-sm font-medium text-fg-muted">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold text-fg tabular-nums">{value}</dd>
      <dd className="mt-1 text-xs text-fg-muted">{hint}</dd>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading dashboard" className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-64" />
        ))}
      </div>
    </div>
  );
}

/** Portfolio dashboard for the property manager. Numbers come from GET /api/dashboard. */
export function Dashboard() {
  const dashboard = useDashboard();

  if (dashboard.isPending) return <DashboardSkeleton />;
  if (dashboard.isError) {
    return (
      <ErrorState
        title="Couldn't load the dashboard"
        onRetry={() => dashboard.refetch()}
        retrying={dashboard.isRefetching}
      />
    );
  }
  const { totals } = dashboard.data;
  if (totals.open === 0 && totals.resolved30d === 0) {
    return (
      <EmptyState
        title="No requests yet"
        description="Once residents report problems, open work, speed and overdue requests show up here."
      />
    );
  }
  return <DashboardPanels data={dashboard.data} />;
}

function DashboardPanels({ data }: { data: DashboardData }) {
  const { totals, openByBuilding, resolveTimeByBuilding, overdueByUrgency, workload } = data;
  const busiest = [...openByBuilding].sort((a, b) => b.open - a.open)[0];
  const heaviest = [...workload].sort((a, b) => b.open - a.open)[0];

  return (
    <div className="grid gap-6">
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Open requests" value={String(totals.open)} hint="Across all buildings" />
        <Kpi
          label="Avg time to resolve (30d)"
          value={formatDuration(totals.avgResolveHours30d)}
          hint="From submitted to resolved"
        />
        <Kpi
          label="Overdue"
          value={String(totals.overdue)}
          hint="Open past their urgency's target"
        />
        <Kpi label="Resolved (30d)" value={String(totals.resolved30d)} hint="In the last 30 days" />
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel
          title="Open by building"
          summary={`${plural(totals.open, "open request")}. ${busiest ? `${busiest.name} has the most (${busiest.open}).` : ""}`}
          bars={openByBuilding.map((row) => ({
            label: row.name,
            value: row.open,
            display: String(row.open),
          }))}
          table={{
            columns: ["Building", ...OPEN_STATUSES.map((status) => STATUS_LABELS[status]), "Total"],
            rows: openByBuilding.map((row) => ({
              key: row.buildingId,
              cells: [
                row.name,
                ...OPEN_STATUSES.map((status) => row.byStatus[status] ?? 0),
                row.open,
              ],
            })),
          }}
        />
        <ChartPanel
          title="Avg time to resolve by building"
          summary={`Requests resolved in the last 30 days took ${formatDuration(totals.avgResolveHours30d)} on average.`}
          bars={resolveTimeByBuilding.map((row) => ({
            label: row.name,
            value: row.avgHours ?? 0,
            display: formatDuration(row.avgHours),
          }))}
          table={{
            columns: ["Building", "Average", "Resolved"],
            rows: resolveTimeByBuilding.map((row) => ({
              key: row.buildingId,
              cells: [row.name, formatDuration(row.avgHours), row.resolved],
            })),
          }}
        />
        <ChartPanel
          title="Overdue by urgency"
          tone="danger"
          summary={`${plural(totals.overdue, "request")} past target: ${
            overdueByUrgency
              .filter((row) => row.overdue > 0)
              .map((row) => `${URGENCY_LABELS[row.urgency]} ${row.overdue}`)
              .join(", ") || "none"
          }.`}
          bars={overdueByUrgency.map((row) => ({
            label: URGENCY_LABELS[row.urgency],
            value: row.overdue,
            display: String(row.overdue),
          }))}
          table={{
            columns: ["Urgency", "Overdue"],
            rows: overdueByUrgency.map((row) => ({
              key: row.urgency,
              cells: [URGENCY_LABELS[row.urgency], row.overdue],
            })),
          }}
        />
        <ChartPanel
          title="Coordinator workload"
          summary={`Open requests per coordinator. ${heaviest ? `${heaviest.name} has ${heaviest.open}.` : ""}`}
          bars={workload.map((row) => ({
            label: row.name,
            value: row.open,
            display: String(row.open),
          }))}
          table={{
            columns: [
              "Coordinator",
              ...OPEN_STATUSES.map((status) => STATUS_LABELS[status]),
              "Total",
            ],
            rows: workload.map((row) => ({
              key: row.coordinatorId,
              cells: [
                row.name,
                ...OPEN_STATUSES.map((status) => row.byStatus[status] ?? 0),
                row.open,
              ],
            })),
          }}
        />
      </div>
    </div>
  );
}
