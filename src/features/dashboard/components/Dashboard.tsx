"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Inbox,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { OPEN_STATUSES, STATUS_LABELS, URGENCY_LABELS } from "@/features/requests/schema";
import { cn } from "@/lib/cn";
import { useDashboard } from "../hooks/useDashboard";
import { formatChange, formatDuration, onTimeRate } from "../metrics";
import type { Dashboard as DashboardData } from "../schema";
import { ChartPanel } from "./ChartPanel";
import { DonutChart } from "./DonutChart";
import { BuildingHealthList, VendorStatusList } from "./PortfolioLists";
import { TrendChart } from "./TrendChart";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

type Trend = { text: string; direction: "up" | "down" | "flat"; good?: boolean };

const KPI_TONES = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
} as const;

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  trend,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: keyof typeof KPI_TONES;
  trend?: Trend;
}) {
  const TrendIcon = trend?.direction === "down" ? ArrowDownRight : ArrowUpRight;
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <dt className="text-xs font-semibold tracking-wide text-fg-muted uppercase">{label}</dt>
      <dd className="mt-2 flex items-center justify-between gap-3 text-3xl font-semibold text-fg tabular-nums">
        {value}
        <span
          aria-hidden
          className={cn("flex size-10 items-center justify-center rounded-lg", KPI_TONES[tone])}
        >
          <Icon className="size-5" />
        </span>
      </dd>
      <dd className="mt-2 flex items-center gap-1 text-xs text-fg-muted">
        {trend && trend.direction !== "flat" && (
          <TrendIcon
            aria-hidden
            className={cn(
              "size-3.5 shrink-0",
              trend.good === true && "text-success",
              trend.good === false && "text-danger",
            )}
          />
        )}
        {trend ? trend.text : hint}
      </dd>
    </div>
  );
}

/** Direction of a week-on-week change; `upIsGood` colours the arrow (the text says the same). */
function trendOf(current: number, previous: number, upIsGood?: boolean): Trend {
  const direction = current > previous ? "up" : current < previous ? "down" : "flat";
  const good =
    upIsGood === undefined || direction === "flat" ? undefined : (direction === "up") === upIsGood;
  return { text: formatChange(current, previous), direction, good };
}

const weekday = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading dashboard" className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
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
  const { weekly, daily, onTime } = data;
  const busiest = [...openByBuilding].sort((a, b) => b.open - a.open)[0];
  const heaviest = [...workload].sort((a, b) => b.open - a.open)[0];
  const rate = onTimeRate(onTime);
  const tracked = onTime.met + onTime.atRisk + onTime.breached;
  const onTimeRows = [
    { key: "met", label: "Met or on track", value: onTime.met, color: "var(--chart-2)" },
    { key: "risk", label: "At risk (past halfway)", value: onTime.atRisk, color: "var(--chart-3)" },
    { key: "breached", label: "Breached", value: onTime.breached, color: "var(--chart-4)" },
  ];

  return (
    <div className="grid gap-6">
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Open requests"
          value={String(totals.open)}
          hint="Across all buildings"
          icon={Inbox}
          trend={{
            ...trendOf(weekly.opened, weekly.openedPrev),
            text: `${weekly.opened} new this week (${formatChange(weekly.opened, weekly.openedPrev)})`,
          }}
        />
        <Kpi
          label="Resolved this week"
          value={String(weekly.resolved)}
          hint="In the last 7 days"
          icon={CheckCircle2}
          tone="success"
          trend={trendOf(weekly.resolved, weekly.resolvedPrev, true)}
        />
        <Kpi
          label="On-time rate"
          value={rate === null ? "No data" : `${rate}%`}
          hint={`${onTime.met + onTime.atRisk} of ${tracked} within their target`}
          icon={ShieldCheck}
        />
        <Kpi
          label="Overdue"
          value={String(totals.overdue)}
          hint="Open past their urgency's target"
          icon={AlertTriangle}
          tone="danger"
        />
      </dl>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartPanel
          className="lg:col-span-2"
          title="Request volume, last 7 days"
          summary={`${plural(weekly.opened, "request")} opened and ${weekly.resolved} resolved this week.`}
          chart={
            <TrendChart
              points={daily.map((day) => ({
                label: weekday(day.date),
                opened: day.opened,
                resolved: day.resolved,
              }))}
            />
          }
          table={{
            columns: ["Day", "Opened", "Resolved"],
            rows: daily.map((day) => ({
              key: day.date,
              cells: [weekday(day.date), day.opened, day.resolved],
            })),
          }}
        />
        <ChartPanel
          title="On-time performance"
          summary="Open and recently resolved work against its target."
          chart={
            <DonutChart
              centerValue={rate === null ? "–" : `${rate}%`}
              centerLabel="on time"
              slices={onTimeRows}
            />
          }
          table={{
            columns: ["Status", "Requests"],
            rows: onTimeRows.map((row) => ({ key: row.key, cells: [row.label, row.value] })),
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <BuildingHealthList className="lg:col-span-2" rows={data.buildingHealth} />
        <VendorStatusList rows={data.vendors} />
      </div>

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
