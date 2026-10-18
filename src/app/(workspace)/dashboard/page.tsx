"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { Dashboard } from "@/features/dashboard/components/Dashboard";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Open work, speed and overdue requests across every building."
      />
      <Dashboard />
    </>
  );
}
