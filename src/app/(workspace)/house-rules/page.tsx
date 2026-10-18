"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { HouseRulesAssistant } from "@/features/house-rules/components/HouseRulesAssistant";
import { useCurrentSession } from "@/features/session/hooks";

export default function HouseRulesPage() {
  const { activeBuilding } = useCurrentSession();
  return (
    <>
      <PageHeader
        title="House rules"
        description={`Answers come only from ${activeBuilding.name}'s house rules.`}
      />
      {/* Keyed by building so a switch clears the previous building's answer. */}
      <HouseRulesAssistant key={activeBuilding.id} />
    </>
  );
}
