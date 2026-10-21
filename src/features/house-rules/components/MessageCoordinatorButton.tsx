"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCurrentSession } from "@/features/session/hooks";
import { roleCan } from "@/lib/auth/permissions";

/** Resident: start a general chat with the coordinator. Coordinator: the inbox. */
export function MessageCoordinatorButton() {
  const { user } = useCurrentSession();
  if (roleCan(user.role, "thread:create")) {
    return (
      <Button asChild>
        <Link href="/messages/new">
          <MessageSquare aria-hidden />
          Message your coordinator
        </Link>
      </Button>
    );
  }
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
