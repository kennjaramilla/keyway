import { z } from "zod";
import { api } from "@/lib/api-client";
import {
  messageSchema,
  threadDetailSchema,
  threadSchema,
  threadSummaryListSchema,
  type ChatCreateInput,
} from "./schema";

/** Thread lists are building-scoped, so their key includes the buildingId. */
export const messageKeys = {
  all: ["messages"] as const,
  threads: (buildingId: string) => [...messageKeys.all, "threads", buildingId] as const,
  thread: (conversationId: string) => [...messageKeys.all, "thread", conversationId] as const,
};

/** A request id (request thread) or a thread id (general chat); see conversationId(). */
const path = (conversationId: string) => `/threads/${encodeURIComponent(conversationId)}`;

export const fetchThreads = (buildingId: string, signal?: AbortSignal) =>
  api.get("/threads", threadSummaryListSchema, { query: { buildingId }, signal });

export const fetchThread = (conversationId: string, signal?: AbortSignal) =>
  api.get(`${path(conversationId)}/messages`, threadDetailSchema, { signal });

export const sendMessage = (conversationId: string, body: string) =>
  api.post(`${path(conversationId)}/messages`, messageSchema, { body });

export const markThreadRead = (conversationId: string) =>
  api.post(`${path(conversationId)}/read`, z.null());

export const createChat = (input: ChatCreateInput) => api.post("/threads", threadSchema, input);
