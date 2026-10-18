"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { fetchThread, messageKeys } from "../api";
import { MessageThread } from "./MessageThread";

/** /messages/[requestId]: page header for the request plus its thread. */
export function ConversationView({ requestId }: { requestId: string }) {
  // Same key as MessageThread, so this reads the shared cache.
  const { data } = useQuery({
    queryKey: messageKeys.thread(requestId),
    queryFn: ({ signal }) => fetchThread(requestId, signal),
  });
  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <Button asChild variant="link" size="sm" className="mb-2 self-start">
        <Link href="/messages">
          <ArrowLeft aria-hidden />
          All messages
        </Link>
      </Button>
      <PageHeader
        title={data ? `${data.request.number}: ${data.request.title}` : "Conversation"}
        description={data && "Conversation between the resident and the building coordinator"}
        actions={
          data && (
            <Button asChild variant="secondary" size="sm">
              <Link href={`/requests/${encodeURIComponent(requestId)}`}>View request</Link>
            </Button>
          )
        }
      />
      <MessageThread requestId={requestId} />
    </div>
  );
}
