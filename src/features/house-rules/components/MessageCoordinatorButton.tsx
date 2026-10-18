"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRequests } from "@/features/requests/hooks/useRequests";
import { useCurrentSession } from "@/features/session/hooks";
import { roleCan } from "@/lib/auth/permissions";

/** Resident: open the latest open request's thread, or start a request. Coordinator: the inbox. */
export function MessageCoordinatorButton() {
  const { user } = useCurrentSession();
  if (user.role === "resident") return <ResidentButton />;
  if (!roleCan(user.role, "thread:view")) return null;
  return (
    <Button asChild variant="secondary">
      <Link href="/messages">
        <MessageSquare aria-hidden />
        Go to messages
      </Link>
    </Button>
  );
}

function ResidentButton() {
  const requests = useRequests();
  const latestOpen = requests.data
    ?.filter((request) => request.status !== "resolved")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return (
    <Button asChild>
      <Link href={latestOpen ? `/messages/${encodeURIComponent(latestOpen.id)}` : "/requests/new"}>
        <MessageSquare aria-hidden />
        Message your coordinator
      </Link>
    </Button>
  );
}
