"use client";

import { RefreshCw } from "lucide-react";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { RangePicker } from "@/features/dashboard/components/RangePicker";
import { useDashboard, useDashboardRange } from "@/features/dashboard/hooks/useDashboard";
import { useCurrentSession } from "@/features/session/hooks";
import { timeZoneAbbreviation, zonedFormatter } from "@/lib/datetime";

export default function DashboardPage() {
  // The range is read from the URL, which needs a Suspense boundary.
  return (
    <Suspense fallback={<Skeleton className="h-32" />}>
      <DashboardScreen />
    </Suspense>
  );
}

function DashboardScreen() {
  const { activeBuilding } = useCurrentSession();
  const [days, setDays] = useDashboardRange();
  const dashboard = useDashboard(days);
  const timeZone = activeBuilding.timezone;
  const today = zonedFormatter(timeZone, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <>
      <PageHeader
        title="Dashboard"
        scope="portfolio"
        description={`${today} · ${timeZoneAbbreviation(timeZone)}. Open work, speed and overdue requests across every building.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RangePicker value={days} onChange={setDays} />
            <Button
              variant="secondary"
              size="sm"
              loading={dashboard.isRefetching}
              onClick={() => dashboard.refetch()}
            >
              {!dashboard.isRefetching && <RefreshCw aria-hidden />}
              Refresh
            </Button>
          </div>
        }
      />
      <Dashboard days={days} />
    </>
  );
}
