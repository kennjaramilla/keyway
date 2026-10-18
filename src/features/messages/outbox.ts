import type { Message } from "./schema";

/** A message the user sent that the server hasn't confirmed yet (never persisted). */
export type OutboxItem = {
  clientId: string;
  body: string;
  createdAt: string;
  status: "sending" | "failed";
};

export type OutboxAction =
  | { type: "queued"; item: OutboxItem }
  | { type: "retrying"; clientId: string }
  | { type: "failed"; clientId: string }
  | { type: "sent"; clientId: string };

export function outboxReducer(state: OutboxItem[], action: OutboxAction): OutboxItem[] {
  switch (action.type) {
    case "queued":
      return [...state, action.item];
    case "retrying":
    case "failed": {
      const status = action.type === "failed" ? "failed" : "sending";
      return state.map((item) => (item.clientId === action.clientId ? { ...item, status } : item));
    }
    case "sent":
      return state.filter((item) => item.clientId !== action.clientId);
  }
}

export type DisplayMessage = Pick<Message, "id" | "authorId" | "body" | "createdAt"> & {
  status: "sent" | "sending" | "failed";
};

/** Server messages (oldest first) followed by the user's unconfirmed ones, in send order. */
export function mergeMessages(
  server: readonly Message[],
  outbox: readonly OutboxItem[],
  authorId: string,
): DisplayMessage[] {
  return [
    ...server.map((message) => ({ ...message, status: "sent" as const })),
    ...outbox.map(({ clientId, body, createdAt, status }) => ({
      id: clientId,
      authorId,
      body,
      createdAt,
      status,
    })),
  ];
}

/** Append a confirmed message to the cached list, once (polling may have fetched it already). */
export function appendMessage(messages: readonly Message[], message: Message): Message[] {
  return messages.some((existing) => existing.id === message.id)
    ? [...messages]
    : [...messages, message];
}
