"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { useCurrentSession } from "@/features/session/hooks";
import { fetchThread, markThreadRead, messageKeys, sendMessage } from "../api";
import { appendMessage, mergeMessages, outboxReducer, type OutboxItem } from "../outbox";
import type { ThreadDetail } from "../schema";
import { unreadCount } from "../unread";

/** How often an open thread checks for new messages while the tab is visible. */
export const POLL_INTERVAL_MS = 5_000;

let clientIds = 0;

/**
 * One request's conversation: polled messages, optimistic sends with rollback,
 * mark-as-read, and a polite announcement when someone else writes.
 */
export function useConversation(
  requestId: string,
  { onFailed, enabled = true }: { onFailed?: (body: string) => void; enabled?: boolean } = {},
) {
  const { user } = useCurrentSession();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: messageKeys.thread(requestId),
    queryFn: ({ signal }) => fetchThread(requestId, signal),
    // TanStack pauses the interval while the tab is hidden (refetchIntervalInBackground: false).
    refetchInterval: POLL_INTERVAL_MS,
    enabled,
  });
  const [outbox, dispatch] = useReducer(outboxReducer, []);
  const [announcement, setAnnouncement] = useState("");
  const seen = useRef<Set<string> | null>(null);

  const detail = query.data;
  const messages = useMemo(
    () => mergeMessages(detail?.messages ?? [], outbox, user.id),
    [detail?.messages, outbox, user.id],
  );

  // Announce messages from others that arrive after the first load.
  useEffect(() => {
    if (!detail) return;
    if (seen.current) {
      const fresh = detail.messages.filter(
        (message) => !seen.current?.has(message.id) && message.authorId !== user.id,
      );
      const last = fresh.at(-1);
      if (last) {
        const author = detail.participants.find((p) => p.id === last.authorId)?.name ?? "Someone";
        setAnnouncement(`New message from ${author}: ${last.body.slice(0, 140)}`);
      }
    }
    seen.current = new Set(detail.messages.map((message) => message.id));
  }, [detail, user.id]);

  // Opening (or watching) a thread marks it read.
  const unread = detail?.thread ? unreadCount(detail.thread, detail.messages, user.id) : 0;
  useEffect(() => {
    if (unread === 0) return;
    const now = new Date().toISOString();
    markThreadRead(requestId)
      .then(() => {
        queryClient.setQueryData<ThreadDetail>(messageKeys.thread(requestId), (old) =>
          old?.thread
            ? {
                ...old,
                thread: { ...old.thread, lastReadAt: { ...old.thread.lastReadAt, [user.id]: now } },
              }
            : old,
        );
        return queryClient.invalidateQueries({ queryKey: [...messageKeys.all, "threads"] });
      })
      .catch(() => {
        // Not critical: the badge stays until the next successful open.
      });
  }, [unread, requestId, user.id, queryClient]);

  const deliver = useCallback(
    async (item: Pick<OutboxItem, "clientId" | "body">) => {
      try {
        const message = await sendMessage(requestId, item.body);
        queryClient.setQueryData<ThreadDetail>(messageKeys.thread(requestId), (old) =>
          old ? { ...old, messages: appendMessage(old.messages, message) } : old,
        );
        dispatch({ type: "sent", clientId: item.clientId });
        void queryClient.invalidateQueries({ queryKey: [...messageKeys.all, "threads"] });
        return true;
      } catch {
        dispatch({ type: "failed", clientId: item.clientId });
        onFailed?.(item.body);
        toast({
          title: "Message not sent",
          description: "Your text is back in the box. Choose Retry to send it again.",
          tone: "danger",
        });
        return false;
      }
    },
    [requestId, queryClient, onFailed],
  );

  const send = useCallback(
    (body: string) => {
      const item: OutboxItem = {
        clientId: `tmp_${++clientIds}`,
        body,
        createdAt: new Date().toISOString(),
        status: "sending",
      };
      dispatch({ type: "queued", item });
      return deliver(item);
    },
    [deliver],
  );

  const retry = useCallback(
    (clientId: string) => {
      const item = outbox.find((candidate) => candidate.clientId === clientId);
      if (!item) return Promise.resolve(false);
      dispatch({ type: "retrying", clientId });
      return deliver(item);
    },
    [outbox, deliver],
  );

  return { query, detail, messages, send, retry, announcement };
}
