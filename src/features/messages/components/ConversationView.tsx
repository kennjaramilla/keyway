"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { fetchThread, messageKeys } from "../api";
import { MessageThread } from "./MessageThread";

/** /messages/[conversationId]: page header for the request or chat, plus its thread. */
export function ConversationView({ conversationId }: { conversationId: string }) {
  // Same key as MessageThread, so this reads the shared cache.
  const { data } = useQuery({
    queryKey: messageKeys.thread(conversationId),
    queryFn: ({ signal }) => fetchThread(conversationId, signal),
  });
  const title = data?.request
    ? `${data.request.number}: ${data.request.title}`
    : (data?.subject ?? "Conversation");
  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <Button asChild variant="link" size="sm" className="mb-2 self-start">
        <Link href="/messages">
          <ArrowLeft aria-hidden />
          All messages
        </Link>
      </Button>
      <PageHeader
        title={title}
        description={
          data &&
          (data.request
            ? "Conversation between the resident and the building coordinator"
            : "General chat between the resident and the building coordinator")
        }
        actions={
          data?.request && (
            <Button asChild variant="secondary" size="sm">
              <Link href={`/requests/${encodeURIComponent(data.request.id)}`}>View request</Link>
            </Button>
          )
        }
      />
      <MessageThread conversationId={conversationId} />
    </div>
  );
}
