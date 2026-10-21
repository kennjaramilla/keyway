import { z } from "zod";
import {
  messageSchema,
  threadDetailSchema,
  threadSchema,
  threadSummaryListSchema,
} from "@/features/messages/schema";
import { api } from "@/lib/api-client";
import { getDb } from "@/mocks/db";
import { armFailuresFromUrl } from "@/mocks/demo-failures";
import { signInAs } from "@/test/session";

const status = (promise: Promise<unknown>) =>
  promise.then(
    () => 200,
    (error: { status: number }) => error.status,
  );

const listThreads = (buildingId?: string) =>
  api.get("/threads", threadSummaryListSchema, { query: { buildingId } });
const getThread = (requestId: string) =>
  api.get(`/threads/${requestId}/messages`, threadDetailSchema);
const send = (requestId: string, body: unknown) =>
  api.post(`/threads/${requestId}/messages`, messageSchema, body);

const label = (thread: { request: { number: string } | null; subject: string | null }) =>
  thread.request?.number ?? thread.subject;

describe("thread endpoints", () => {
  it("lists a resident's own threads with unread counts", async () => {
    signInAs("resident");
    const threads = await listThreads();
    expect(threads.map(label)).toEqual(["KW-1023", "Guest parking this weekend"]);
    expect(threads[0]?.unreadCount).toBe(1);
    expect(threads[0]?.lastMessage?.authorName).toBeTruthy();
  });

  it("lists only the coordinator's active building, newest activity first", async () => {
    signInAs("coordinator");
    const harbor = await listThreads("bld_harbor");
    expect(harbor.map(label)).toEqual(["KW-1017", "KW-1023", "Guest parking this weekend"]);
    expect(harbor.find((t) => label(t) === "KW-1017")?.unreadCount).toBe(1);

    // Covered but not active: 404, like any other building-scoped list.
    expect(await status(listThreads("bld_maple"))).toBe(404);
    signInAs("coordinator", "bld_maple");
    const maple = await listThreads("bld_maple");
    expect(maple.find((t) => label(t) === "KW-1029")?.unreadCount).toBe(2);
  });

  it("hides uncovered buildings (404) and denies the manager (403)", async () => {
    signInAs("usr_coord_theo");
    expect(await status(listThreads("bld_harbor"))).toBe(404);
    expect(await status(getThread("req_017"))).toBe(404);
    signInAs("manager");
    expect(await status(listThreads())).toBe(403);
    expect(await status(getThread("req_017"))).toBe(403);
    expect(await status(send("req_017", { body: "Hi" }))).toBe(403);
  });

  it("returns 401 without a session", async () => {
    expect(await status(listThreads())).toBe(401);
    expect(await status(getThread("req_017"))).toBe(401);
    expect(await status(send("req_017", { body: "Hi" }))).toBe(401);
    expect(await status(api.post("/threads/req_017/read", z.null()))).toBe(401);
  });

  it("returns a thread's messages oldest first, with participants", async () => {
    signInAs("coordinator");
    const detail = await getThread("req_017");
    expect(detail.request?.number).toBe("KW-1017");
    expect(detail.messages).toHaveLength(5);
    const times = detail.messages.map((message) => message.createdAt);
    expect(times).toEqual([...times].sort());
    expect(detail.participants.map((p) => p.name)).toEqual(["Diego Santillán", "Grace Adeyemi"]);
  });

  it("keeps residents inside their unit, even in the same building", async () => {
    signInAs("usr_res_diego");
    expect(await status(getThread("req_023"))).toBe(404);
    expect(await status(send("req_023", { body: "Hello" }))).toBe(404);
    expect(await status(getThread("does-not-exist"))).toBe(404);
  });

  it("sends a message and shows it to the other side", async () => {
    signInAs("coordinator");
    const sent = await send("req_017", { body: "  Plumber confirmed.  " });
    expect(sent.body).toBe("Plumber confirmed.");
    expect(sent.authorId).toBe("usr_coord_grace");

    signInAs("usr_res_diego");
    const detail = await getThread("req_017");
    expect(detail.messages.at(-1)?.body).toBe("Plumber confirmed.");
    const [thread] = await listThreads();
    expect(thread?.unreadCount).toBe(1);
  });

  it("creates the thread with the first message", async () => {
    signInAs("resident");
    expect((await getThread("req_030")).thread).toBeNull();
    await send("req_030", { body: "Is someone coming today?" });
    const detail = await getThread("req_030");
    expect(detail.thread).toMatchObject({ buildingId: "bld_harbor", residentId: "usr_res_amara" });
    expect(detail.messages).toHaveLength(1);
  });

  it("rejects empty, whitespace-only and too-long messages (422)", async () => {
    signInAs("resident");
    expect(await status(send("req_023", { body: "   " }))).toBe(422);
    expect(await status(send("req_023", {}))).toBe(422);
    expect(await status(send("req_023", { body: "x".repeat(2001) }))).toBe(422);
  });

  it("fails the next send once when the demo failure is armed", async () => {
    signInAs("resident");
    armFailuresFromUrl(new URL("http://localhost/messages?fail=messages"));
    expect(await status(send("req_023", { body: "First try" }))).toBe(500);
    expect(await status(send("req_023", { body: "Second try" }))).toBe(200);
    expect(getDb().messages.some((m) => m.body === "First try")).toBe(false);
  });

  it("marks a thread read for the caller only", async () => {
    signInAs("resident");
    await api.post("/threads/req_023/read", z.null());
    expect((await listThreads())[0]?.unreadCount).toBe(0);
    await api.post("/threads/req_030/read", z.null()); // no thread yet: still fine
    signInAs("coordinator");
    expect((await listThreads()).find((t) => t.requestId === "req_017")?.unreadCount).toBe(1);
  });
});

describe("general chats", () => {
  const start = (body: unknown) => api.post("/threads", threadSchema, body);
  const chat = { subject: "Bike storage key", body: "Where do I get a key for the bike room?" };

  it("lets a resident start a chat with their building's coordinator", async () => {
    signInAs("resident");
    const thread = await start(chat);
    expect(thread).toMatchObject({
      requestId: null,
      subject: "Bike storage key",
      buildingId: "bld_harbor",
      residentId: "usr_res_amara",
      coordinatorId: "usr_coord_grace",
    });
    const detail = await getThread(thread.id);
    expect(detail.request).toBeNull();
    expect(detail.subject).toBe("Bike storage key");
    expect(detail.messages.map((m) => m.body)).toEqual([chat.body]);
    expect((await listThreads())[0]).toMatchObject({ subject: "Bike storage key", unreadCount: 0 });

    signInAs("coordinator");
    const inbox = await listThreads("bld_harbor");
    expect(inbox.find((t) => t.id === thread.id)?.unreadCount).toBe(1);
    await send(thread.id, { body: "The front desk has them." });
    signInAs("resident");
    expect((await listThreads()).find((t) => t.id === thread.id)?.unreadCount).toBe(1);
  });

  it("validates the subject and message (422) and is resident-only (403)", async () => {
    signInAs("resident");
    expect(await status(start({ subject: "Hi", body: "Question" }))).toBe(422);
    expect(await status(start({ subject: "Bike storage key", body: "  " }))).toBe(422);
    expect(await status(start({ subject: "x".repeat(81), body: "Question" }))).toBe(422);
    signInAs("coordinator");
    expect(await status(start(chat))).toBe(403);
    signInAs("manager");
    expect(await status(start(chat))).toBe(403);
  });

  it("keeps chats inside the resident and the covering coordinators (404)", async () => {
    signInAs("usr_res_diego");
    expect(await status(getThread("thr_028"))).toBe(404);
    expect(await status(send("thr_028", { body: "Hello" }))).toBe(404);
    signInAs("usr_coord_theo");
    expect(await status(getThread("thr_028"))).toBe(404);
    expect((await getThread("thr_029")).subject).toBe("Moving a sofa in on Saturday");
    signInAs("manager");
    expect(await status(getThread("thr_028"))).toBe(403);
    // A request's thread is only reachable by its request id.
    signInAs("resident");
    expect(await status(getThread("thr_001"))).toBe(404);
  });

  it("marks a chat read", async () => {
    signInAs("resident");
    const thread = await start(chat);
    signInAs("coordinator");
    await api.post(`/threads/${thread.id}/read`, z.null());
    expect((await listThreads()).find((t) => t.id === thread.id)?.unreadCount).toBe(0);
  });
});
