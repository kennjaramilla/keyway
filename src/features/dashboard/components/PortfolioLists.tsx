import { Building2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_LABELS } from "@/features/requests/schema";
import { cn } from "@/lib/cn";
import type { Dashboard, VendorState } from "../schema";

/** Each building's open and overdue counts with its on-time rate as a bar and a number. */
export function BuildingHealthList({
  rows,
  className,
}: {
  rows: Dashboard["buildingHealth"];
  className?: string;
}) {
  return (
    <Card aria-labelledby="building-health-title" className={cn("min-w-0", className)}>
      <CardHeader>
        <CardTitle id="building-health-title">Buildings</CardTitle>
        <CardDescription>Open work and on-time rate (open and resolved in 30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.buildingId} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"
              >
                <Building2 className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-fg">{row.name}</span>
                <span className="truncate text-xs text-fg-muted">{row.address}</span>
              </span>
              <span className="text-sm whitespace-nowrap text-fg-muted tabular-nums sm:w-36">
                {row.open} open
                {row.overdue > 0 && <span className="text-danger"> · {row.overdue} overdue</span>}
              </span>
              <span className="flex w-full items-center gap-3 sm:w-60">
                <span aria-hidden className="h-2 flex-1 rounded-full bg-surface-muted">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      (row.onTimePct ?? 0) >= 90
                        ? "bg-chart-2"
                        : (row.onTimePct ?? 0) >= 80
                          ? "bg-chart-1"
                          : "bg-chart-3",
                    )}
                    style={{ width: `${row.onTimePct ?? 0}%` }}
                  />
                </span>
                <span className="text-right text-sm font-medium whitespace-nowrap text-fg tabular-nums">
                  {row.onTimePct === null ? "No data" : `${row.onTimePct}% on time`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

const VENDOR_STATES: Record<VendorState, { label: string; tone: BadgeTone }> = {
  on_site: { label: "On site", tone: "success" },
  scheduled: { label: "Scheduled", tone: "info" },
  assigned: { label: "Assigned", tone: "neutral" },
  available: { label: "Available", tone: "primary" },
};

/** Vendors with work in progress first, then scheduled, assigned and free. */
export function VendorStatusList({
  rows,
  className,
}: {
  rows: Dashboard["vendors"];
  className?: string;
}) {
  return (
    <Card aria-labelledby="vendor-status-title" className={cn("min-w-0", className)}>
      <CardHeader>
        <CardTitle id="vendor-status-title">Vendor status</CardTitle>
        <CardDescription>Who is on site or booked across the portfolio</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {rows.map((row) => {
            const state = VENDOR_STATES[row.state];
            const jobs = row.onSite + row.scheduled;
            return (
              <li key={row.vendorId} className="flex items-center gap-3 py-2.5">
                <Avatar name={row.name} size="sm" decorative />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-fg">{row.name}</span>
                  <span className="truncate text-xs text-fg-muted">
                    {CATEGORY_LABELS[row.trade]}
                    {jobs > 0 && ` · ${jobs} active job${jobs === 1 ? "" : "s"}`}
                  </span>
                </span>
                <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
