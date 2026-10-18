import { z } from "zod";
import { api } from "@/lib/api-client";
import { messageSchema, threadDetailSchema, threadSummaryListSchema } from "./schema";

/** Thread lists are building-scoped, so their key includes the buildingId. */
export const messageKeys = {
  all: ["messages"] as const,
  threads: (buildingId: string) => [...messageKeys.all, "threads", buildingId] as const,
  thread: (requestId: string) => [...messageKeys.all, "thread", requestId] as const,
};

const path = (requestId: string) => `/threads/${encodeURIComponent(requestId)}`;

export const fetchThreads = (buildingId: string, signal?: AbortSignal) =>
  api.get("/threads", threadSummaryListSchema, { query: { buildingId }, signal });

export const fetchThread = (requestId: string, signal?: AbortSignal) =>
  api.get(`${path(requestId)}/messages`, threadDetailSchema, { signal });

export const sendMessage = (requestId: string, body: string) =>
  api.post(`${path(requestId)}/messages`, messageSchema, { body });

export const markThreadRead = (requestId: string) => api.post(`${path(requestId)}/read`, z.null());
