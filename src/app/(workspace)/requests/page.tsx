"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { RequestList } from "@/features/requests/components/RequestList";
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
      />
      <RequestList />
    </>
  );
}
