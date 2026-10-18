"use client";

import { MessagesSquare } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useCurrentSession } from "@/features/session/hooks";
import { ApiError } from "@/lib/api-client";
import { roleCan } from "@/lib/auth/permissions";
import { useConversation } from "../hooks/useConversation";
import type { Participant } from "../schema";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";

const unknownAuthor = (id: string): Participant => ({ id, name: "Former user", role: "resident" });

/**
 * The conversation for one request (resident and coordinator). Embeddable on
 * the request detail page; renders nothing for roles that can't read threads.
 */
export function MessageThread({
  requestId,
  headingLevel = 2,
}: {
  requestId: string;
  /** Heading level for the empty state (3 when embedded under a card title). */
  headingLevel?: 2 | 3;
}) {
  const { user, activeBuilding } = useCurrentSession();
  const [draft, setDraft] = useState("");
  // Rollback: put a failed message back in the box unless the user already typed something new.
  const onFailed = useCallback(
    (body: string) => setDraft((current) => (current.trim() ? current : body)),
    [],
  );
  const allowed = roleCan(user.role, "thread:view");
  const { query, detail, messages, send, retry, announcement } = useConversation(requestId, {
    onFailed,
    enabled: allowed,
  });

  if (!allowed) return null;
  if (query.isPending) return <SkeletonList rows={3} label="Loading messages" />;
  if (query.isError && !detail) {
    if (query.error instanceof ApiError && query.error.isNotFound) {
      return (
        <EmptyState
          title="Conversation not found"
          description="It may belong to another unit or building, or the request no longer exists."
          action={
            <Button asChild variant="secondary">
              <Link href="/messages">Back to messages</Link>
            </Button>
          }
        />
      );
    }
    return (
      <ErrorState
        title="Couldn't load messages"
        onRetry={() => query.refetch()}
        retrying={query.isRefetching}
      />
    );
  }

  const author = (id: string) =>
    detail?.participants.find((participant) => participant.id === id) ?? unknownAuthor(id);
  const other = detail?.participants.find((participant) => participant.id !== user.id);

  return (
    <section aria-label="Messages" className="flex flex-col gap-4">
      {messages.length === 0 ? (
        <EmptyState
          icon={<MessagesSquare />}
          title="No messages yet"
          description="Ask a question or add details."
          headingLevel={headingLevel}
        />
      ) : (
        <ol aria-label="Conversation" className="flex flex-col gap-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              author={author(message.authorId)}
              own={message.authorId === user.id}
              timeZone={activeBuilding.timezone}
              onRetry={
                message.status === "failed"
                  ? () =>
                      void retry(message.id).then((sent) => {
                        if (sent)
                          setDraft((current) => (current.trim() === message.body ? "" : current));
                      })
                  : undefined
              }
            />
          ))}
        </ol>
      )}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      <MessageComposer
        value={draft}
        onChange={setDraft}
        onSend={(body) => {
          setDraft("");
          void send(body);
        }}
        label={other ? `Message ${other.name}` : "Write a message"}
      />
    </section>
  );
}
