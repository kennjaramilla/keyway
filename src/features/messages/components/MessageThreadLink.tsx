"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useCurrentSession } from "@/features/session/hooks";
import { roleCan } from "@/lib/auth/permissions";

/** "Message coordinator" (resident) or "Message resident" (coordinator) for a request. */
export function MessageThreadLink({
  requestId,
  variant = "secondary",
  size,
}: { requestId: string } & Pick<ButtonProps, "variant" | "size">) {
  const { user } = useCurrentSession();
  if (!roleCan(user.role, "thread:view")) return null;
  return (
    <Button asChild variant={variant} size={size}>
      <Link href={`/messages/${encodeURIComponent(requestId)}`}>
        <MessageSquare aria-hidden />
        {user.role === "resident" ? "Message coordinator" : "Message resident"}
      </Link>
    </Button>
  );
}
