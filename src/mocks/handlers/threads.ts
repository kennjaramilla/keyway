import { http, HttpResponse } from "msw";
import {
  chatCreateSchema,
  messageCreateSchema,
  type Message,
  type Participant,
  type Thread,
  type ThreadSummary,
} from "@/features/messages/schema";
import { unreadCount } from "@/features/messages/unread";
import type { MaintenanceRequest } from "@/features/requests/schema";
import type { SessionUser } from "@/features/session/schema";
import { can } from "@/lib/auth/permissions";
import { getDb, nextId, updateDb } from "../db";
import { consumeFailure } from "../demo-failures";
import type { Db } from "../seed";
import { API, deny, notFound, problem, sessionUser, unauthorized, validationError } from "./utils";

function participant(db: Db, id: string): Participant {
  const user = db.users.find((candidate) => candidate.id === id);
  return { id, name: user?.name ?? "Former user", role: user?.role ?? "resident" };
}

/** A conversation's resource for can(): its building and resident. */
const threadResource = (owner: Pick<MaintenanceRequest, "buildingId" | "residentId">) => ({
  buildingId: owner.buildingId,
  residentId: owner.residentId,
});

type Conversation =
  { request: MaintenanceRequest; thread: Thread | null } | { request: null; thread: Thread };

/**
 * Look up a conversation by request id (request thread) or thread id (general chat):
 * 404 if missing or out of scope (checked before the role), 403 for the wrong role.
 */
function findConversation(user: SessionUser, id: unknown): { error: Response } | Conversation {
  const db = getDb();
  const request = db.requests.find((item) => item.id === id);
  if (request) {
    if (!can(user, "request:view", request)) return { error: notFound("Conversation") };
    const denied = deny(user, "thread:view", threadResource(request));
    if (denied) return { error: denied };
    return { request, thread: db.threads.find((item) => item.requestId === request.id) ?? null };
  }
  const thread = db.threads.find((item) => item.id === id && item.requestId === null);
  if (!thread || !inScope(user, thread)) return { error: notFound("Conversation") };
  const denied = deny(user, "thread:view", threadResource(thread));
  return denied ? { error: denied } : { request: null, thread };
}

/** Residents see their own chats; staff see chats in buildings they cover. */
const inScope = (user: SessionUser, thread: Thread) =>
  user.role === "resident"
    ? thread.residentId === user.id
    : user.buildingIds.includes(thread.buildingId);

function lastMessage(db: Db, threadId: string) {
  return db.messages
    .filter((message) => message.threadId === threadId)
    .reduce<Message | null>(
      (latest, message) => (!latest || message.createdAt > latest.createdAt ? message : latest),
      null,
    );
}

export const threadHandlers = [
  // GET /api/threads?buildingId. Residents: own threads. Coordinators: the active building only.
  http.get(`${API}/threads`, ({ request, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const buildingId = new URL(request.url).searchParams.get("buildingId") ?? user.activeBuildingId;
    const denied = deny(user, "thread:view", { buildingId });
    if (denied) return denied;
    if (user.role !== "resident" && buildingId !== user.activeBuildingId) return notFound();

    const db = getDb();
    const summaries: ThreadSummary[] = db.threads
      .filter((thread) =>
        user.role === "resident" ? thread.residentId === user.id : thread.buildingId === buildingId,
      )
      .flatMap((thread) => {
        const req =
          thread.requestId === null
            ? null
            : db.requests.find((item) => item.id === thread.requestId);
        if (req === undefined || (req && !can(user, "request:view", req))) return [];
        const last = lastMessage(db, thread.id);
        return [
          {
            id: thread.id,
            requestId: thread.requestId,
            request: req && { id: req.id, number: req.number, title: req.title },
            subject: thread.subject,
            resident: participant(db, thread.residentId),
            lastMessage: last && { ...last, authorName: participant(db, last.authorId).name },
            lastMessageAt: thread.lastMessageAt,
            unreadCount: unreadCount(thread, db.messages, user.id),
          },
        ];
      })
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
    return HttpResponse.json(summaries);
  }),

  http.get(`${API}/threads/:id/messages`, ({ params, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const found = findConversation(user, params.id);
    if ("error" in found) return found.error;
    const { request, thread } = found;

    const db = getDb();
    const people = request ?? thread;
    return HttpResponse.json({
      request: request && { id: request.id, number: request.number, title: request.title },
      subject: thread?.subject ?? null,
      thread,
      participants: [people.residentId, people.coordinatorId].map((id) => participant(db, id)),
      messages: thread
        ? db.messages
            .filter((message) => message.threadId === thread.id)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        : [],
    });
  }),

  http.post(`${API}/threads/:id/messages`, async ({ params, cookies, request: incoming }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const found = findConversation(user, params.id);
    if ("error" in found) return found.error;
    const { request } = found;
    const denied = deny(user, "message:send", threadResource(request ?? found.thread));
    if (denied) return denied;

    const parsed = messageCreateSchema.safeParse(await incoming.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    if (consumeFailure("messages")) {
      return problem(500, "Server error", "The message couldn't be delivered.");
    }

    const now = new Date().toISOString();
    const message = updateDb((db) => {
      let thread = db.threads.find((item) =>
        request ? item.requestId === request.id : item.id === found.thread?.id,
      );
      if (!thread && request) {
        thread = {
          id: nextId("thr"),
          requestId: request.id,
          subject: null,
          buildingId: request.buildingId,
          residentId: request.residentId,
          coordinatorId: request.coordinatorId,
          createdAt: now,
          lastMessageAt: now,
          lastReadAt: {},
        };
        db.threads.push(thread);
      }
      if (!thread) throw new Error("Conversation disappeared");
      const created: Message = {
        id: nextId("msg"),
        threadId: thread.id,
        authorId: user.id,
        body: parsed.data.body,
        createdAt: now,
      };
      db.messages.push(created);
      thread.lastMessageAt = now;
      thread.lastReadAt[user.id] = now;
      return created;
    });
    return HttpResponse.json(message, { status: 201 });
  }),

  // POST /api/threads: a resident starts a general chat with their building's coordinator.
  http.post(`${API}/threads`, async ({ cookies, request: incoming }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const denied = deny(user, "thread:create", { residentId: user.id });
    if (denied) return denied;
    const parsed = chatCreateSchema.safeParse(await incoming.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);

    const building = getDb().buildings.find((item) => item.id === user.activeBuildingId);
    const coordinatorId = building?.coordinatorIds[0];
    if (!building || !coordinatorId) {
      return problem(409, "Conflict", "This building has no coordinator yet.", {
        code: "NO_COORDINATOR",
      });
    }
    const now = new Date().toISOString();
    const thread = updateDb((db) => {
      const created: Thread = {
        id: nextId("thr"),
        requestId: null,
        subject: parsed.data.subject,
        buildingId: building.id,
        residentId: user.id,
        coordinatorId,
        createdAt: now,
        lastMessageAt: now,
        lastReadAt: { [user.id]: now },
      };
      db.threads.push(created);
      db.messages.push({
        id: nextId("msg"),
        threadId: created.id,
        authorId: user.id,
        body: parsed.data.body,
        createdAt: now,
      });
      return created;
    });
    return HttpResponse.json(thread, { status: 201 });
  }),

  // Mark the thread read for the caller. No thread yet: nothing to mark.
  http.post(`${API}/threads/:id/read`, ({ params, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const found = findConversation(user, params.id);
    if ("error" in found) return found.error;
    const threadId = found.thread?.id;
    updateDb((db) => {
      const thread = db.threads.find((item) => item.id === threadId);
      if (thread) thread.lastReadAt[user.id] = new Date().toISOString();
    });
    return new HttpResponse(null, { status: 204 });
  }),
];
