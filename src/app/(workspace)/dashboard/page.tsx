"use client";

import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { useCurrentSession } from "@/features/session/hooks";
import { timeZoneAbbreviation, zonedFormatter } from "@/lib/datetime";

export default function DashboardPage() {
  const { activeBuilding } = useCurrentSession();
  const dashboard = useDashboard();
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
          <Button
            variant="secondary"
            size="sm"
            loading={dashboard.isRefetching}
            onClick={() => dashboard.refetch()}
          >
            {!dashboard.isRefetching && <RefreshCw aria-hidden />}
            Refresh
          </Button>
        }
      />
      <Dashboard />
    </>
  );
}
