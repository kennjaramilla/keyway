"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { BillingView } from "@/features/billing/components/BillingView";
import { useCurrentSession } from "@/features/session/hooks";

export default function BillingPage() {
  const { unit } = useCurrentSession();
  return (
    <>
      <PageHeader
        title="Billing"
        description={`Rent, utilities and fees${unit ? ` for unit ${unit.label}` : ""}`}
      />
      <BillingView />
    </>
  );
}
