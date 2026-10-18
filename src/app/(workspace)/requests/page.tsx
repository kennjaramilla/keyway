"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { SkeletonList } from "@/components/ui/skeleton";
import { NewRequestButton, RequestList } from "@/features/requests/components/RequestList";
import { ResidentOverview } from "@/features/requests/components/ResidentOverview";
import { useCurrentSession } from "@/features/session/hooks";

export default function RequestsPage() {
  const { user, unit } = useCurrentSession();
  return (
    <>
      <PageHeader
        title="Requests"
        description={
          user.role === "resident" && unit
            ? `Requests for unit ${unit.label}`
            : "All requests in this building"
        }
        actions={<NewRequestButton />}
      />
      {user.role === "resident" && <ResidentOverview />}
      {/* Filters live in the URL, which isn't known while prerendering. */}
      <Suspense fallback={<SkeletonList rows={5} label="Loading requests" />}>
        <RequestList />
      </Suspense>
    </>
  );
}
