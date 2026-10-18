"use client";

import { ChevronRight, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useCurrentSession } from "@/features/session/hooks";
import { useThreads } from "../hooks/useThreads";

const timeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

/** Conversations in scope, most recent first, with unread counts. */
export function ThreadList() {
  const { user, activeBuilding } = useCurrentSession();
  const threads = useThreads();

  if (threads.isPending) return <SkeletonList rows={4} label="Loading conversations" />;
  if (threads.isError) {
    return (
      <ErrorState
        title="Couldn't load conversations"
        onRetry={() => threads.refetch()}
        retrying={threads.isRefetching}
      />
    );
  }
  if (threads.data.length === 0) {
    return (
      <EmptyState
        icon={<MessagesSquare />}
        title={
          user.role === "resident"
            ? "No conversations yet"
            : `No conversations in ${activeBuilding.name}`
        }
        description="Messages about a request show up here. Open a request to start one."
        action={
          <Button asChild variant="secondary">
            <Link href="/requests">Go to requests</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul
      aria-label="Conversations"
      className="divide-y divide-border rounded-lg border border-border bg-surface"
    >
      {threads.data.map((thread) => {
        const preview = thread.lastMessage
          ? `${thread.lastMessage.authorId === user.id ? "You" : thread.lastMessage.authorName}: ${thread.lastMessage.body}`
          : "No messages yet";
        return (
          <li key={thread.id}>
            <Link
              href={`/messages/${encodeURIComponent(thread.requestId)}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-xs font-medium text-fg-muted">{thread.request.number}</span>
                  <span
                    className={
                      thread.unreadCount > 0 ? "font-semibold text-fg" : "font-medium text-fg"
                    }
                  >
                    {thread.request.title}
                  </span>
                  {thread.unreadCount > 0 && (
                    <Badge tone="primary">{thread.unreadCount} unread</Badge>
                  )}
                </p>
                {user.role !== "resident" && (
                  <p className="text-xs text-fg-muted">{thread.resident.name}</p>
                )}
                <p className="truncate text-sm text-fg-muted">{preview}</p>
              </div>
              <time dateTime={thread.lastMessageAt} className="shrink-0 text-xs text-fg-muted">
                {timeFormat.format(new Date(thread.lastMessageAt))}
              </time>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-fg-subtle" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
