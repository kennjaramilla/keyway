"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shell/PageHeader";
import { ThreadList } from "@/features/messages/components/ThreadList";
import { useCurrentSession } from "@/features/session/hooks";
import { roleCan } from "@/lib/auth/permissions";

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
        actions={
          roleCan(user.role, "thread:create") && (
            <Button asChild>
              <Link href="/messages/new">
                <Plus aria-hidden />
                New chat
              </Link>
            </Button>
          )
        }
      />
      <ThreadList />
    </>
  );
}
