"use client";

import { Construction } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";

// Placeholder: replaced by the House rules feature.
export default function Page() {
  return (
    <>
      <PageHeader title="House rules" />
      <EmptyState
        icon={<Construction />}
        title="Coming soon"
        description="This part of Keyway is still being built."
      />
    </>
  );
}
