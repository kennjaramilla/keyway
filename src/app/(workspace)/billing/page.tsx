"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { BillingView } from "@/features/billing/components/BillingView";
import { UnitBalances } from "@/features/billing/components/UnitBalances";
import { useCurrentSession } from "@/features/session/hooks";

export default function BillingPage() {
  const { user, unit, activeBuilding } = useCurrentSession();
  const resident = user.role === "resident";
  return (
    <>
      <PageHeader
        title="Billing"
        description={
          resident
            ? `Rent, utilities and fees${unit ? ` for unit ${unit.label}` : ""}`
            : `What each unit in ${activeBuilding.name} owes`
        }
      />
      {resident ? <BillingView /> : <UnitBalances />}
    </>
  );
}
