import { http, HttpResponse } from "msw";
import {
  messageCreateSchema,
  type Message,
  type Participant,
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

/** The thread's resource for can(): its building and resident. */
const threadResource = (request: MaintenanceRequest) => ({
  buildingId: request.buildingId,
  unitId: request.unitId,
  residentId: request.residentId,
});

/**
 * Look up a request for a thread call: 404 if missing or out of scope
 * (checked before the role, so out-of-scope always wins), 403 for the wrong role.
 */
function findRequest(user: SessionUser, requestId: unknown) {
  const request = getDb().requests.find((item) => item.id === requestId);
  if (!request || !can(user, "request:view", request)) return { error: notFound("Conversation") };
  const denied = deny(user, "thread:view", threadResource(request));
  return denied ? { error: denied } : { request };
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
        const req = db.requests.find((item) => item.id === thread.requestId);
        if (!req || !can(user, "request:view", req)) return [];
        const last = db.messages
          .filter((message) => message.threadId === thread.id)
          .reduce<Message | null>(
            (latest, message) =>
              !latest || message.createdAt > latest.createdAt ? message : latest,
            null,
          );
        return [
          {
            id: thread.id,
            requestId: thread.requestId,
            request: { id: req.id, number: req.number, title: req.title },
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

  http.get(`${API}/threads/:requestId/messages`, ({ params, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const { request, error } = findRequest(user, params.requestId);
    if (error) return error;

    const db = getDb();
    const thread = db.threads.find((item) => item.requestId === request.id) ?? null;
    return HttpResponse.json({
      request: { id: request.id, number: request.number, title: request.title },
      thread,
      participants: [request.residentId, request.coordinatorId].map((id) => participant(db, id)),
      messages: thread
        ? db.messages
            .filter((message) => message.threadId === thread.id)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        : [],
    });
  }),

  http.post(
    `${API}/threads/:requestId/messages`,
    async ({ params, cookies, request: incoming }) => {
      const user = sessionUser(cookies);
      if (!user) return unauthorized();
      const { request, error } = findRequest(user, params.requestId);
      if (error) return error;
      const denied = deny(user, "message:send", threadResource(request));
      if (denied) return denied;

      const parsed = messageCreateSchema.safeParse(await incoming.json().catch(() => null));
      if (!parsed.success) return validationError(parsed.error);
      if (consumeFailure("messages")) {
        return problem(500, "Server error", "The message couldn't be delivered.");
      }

      const now = new Date().toISOString();
      const message = updateDb((db) => {
        let thread = db.threads.find((item) => item.requestId === request.id);
        if (!thread) {
          thread = {
            id: nextId("thr"),
            requestId: request.id,
            buildingId: request.buildingId,
            residentId: request.residentId,
            coordinatorId: request.coordinatorId,
            createdAt: now,
            lastMessageAt: now,
            lastReadAt: {},
          };
          db.threads.push(thread);
        }
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
    },
  ),

  // Mark the thread read for the caller. No thread yet: nothing to mark.
  http.post(`${API}/threads/:requestId/read`, ({ params, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const { request, error } = findRequest(user, params.requestId);
    if (error) return error;
    updateDb((db) => {
      const thread = db.threads.find((item) => item.requestId === request.id);
      if (thread) thread.lastReadAt[user.id] = new Date().toISOString();
    });
    return new HttpResponse(null, { status: 204 });
  }),
];
