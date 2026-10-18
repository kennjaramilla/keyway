"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { RequestForm } from "@/features/requests/components/RequestForm";
import { useCurrentSession } from "@/features/session/hooks";

export default function NewRequestPage() {
  const { unit } = useCurrentSession();
  return (
    <>
      <PageHeader
        title="New request"
        description={`Tell us what needs fixing${unit ? ` in unit ${unit.label}` : ""}. Fields marked * are required.`}
      />
      <RequestForm />
    </>
  );
}
