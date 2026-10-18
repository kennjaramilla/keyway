"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { ThreadList } from "@/features/messages/components/ThreadList";
import { useCurrentSession } from "@/features/session/hooks";

export default function MessagesPage() {
  const { user, unit } = useCurrentSession();
  return (
    <>
      <PageHeader
        title="Messages"
        description={
          user.role === "resident" && unit
            ? `Conversations with your coordinator about unit ${unit.label}`
            : "Conversations with residents in this building"
        }
      />
      <ThreadList />
    </>
  );
}
