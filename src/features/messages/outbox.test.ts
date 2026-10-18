import { appendMessage, mergeMessages, outboxReducer, type OutboxItem } from "./outbox";
import type { Message } from "./schema";

const item = (clientId: string, status: OutboxItem["status"] = "sending"): OutboxItem => ({
  clientId,
  body: `body ${clientId}`,
  createdAt: "2026-10-19T10:00:00.000Z",
  status,
});
const message: Message = {
  id: "msg_1",
  threadId: "thr_1",
  authorId: "usr_a",
  body: "Hello",
  createdAt: "2026-10-19T09:00:00.000Z",
};

describe("outboxReducer", () => {
  it("queues, fails, retries and removes sent items", () => {
    let state = outboxReducer([], { type: "queued", item: item("a") });
    state = outboxReducer(state, { type: "queued", item: item("b") });
    expect(state.map((i) => i.clientId)).toEqual(["a", "b"]);

    state = outboxReducer(state, { type: "failed", clientId: "a" });
    expect(state[0]?.status).toBe("failed");
    expect(state[1]?.status).toBe("sending");

    state = outboxReducer(state, { type: "retrying", clientId: "a" });
    expect(state[0]?.status).toBe("sending");

    state = outboxReducer(state, { type: "sent", clientId: "a" });
    expect(state.map((i) => i.clientId)).toEqual(["b"]);
  });

  it("ignores unknown client ids", () => {
    const state = [item("a")];
    expect(outboxReducer(state, { type: "failed", clientId: "zzz" })).toEqual(state);
  });
});

describe("mergeMessages", () => {
  it("shows server messages as sent, then unconfirmed ones by the current user", () => {
    const merged = mergeMessages([message], [item("a"), item("b", "failed")], "usr_me");
    expect(merged.map((m) => [m.id, m.status, m.authorId])).toEqual([
      ["msg_1", "sent", "usr_a"],
      ["a", "sending", "usr_me"],
      ["b", "failed", "usr_me"],
    ]);
  });
});

describe("appendMessage", () => {
  it("adds a confirmed message once", () => {
    const next = { ...message, id: "msg_2" };
    expect(appendMessage([message], next)).toHaveLength(2);
    expect(appendMessage([message, next], next)).toHaveLength(2);
  });
});
