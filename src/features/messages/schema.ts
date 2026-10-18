import { z } from "zod";

export const MESSAGE_MAX_LENGTH = 2000;

export const threadSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  buildingId: z.string(),
  residentId: z.string(),
  coordinatorId: z.string(),
  createdAt: z.iso.datetime(),
  lastMessageAt: z.iso.datetime(),
  lastReadAt: z.record(z.string(), z.iso.datetime().nullable()),
});
export type Thread = z.infer<typeof threadSchema>;

export const messageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  authorId: z.string(),
  body: z.string(),
  createdAt: z.iso.datetime(),
});
export type Message = z.infer<typeof messageSchema>;

export const messageCreateSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a message first.")
    .max(MESSAGE_MAX_LENGTH, "Keep messages under 2,000 characters."),
});

const participantSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(["resident", "coordinator", "manager"]),
});
export type Participant = z.infer<typeof participantSchema>;

const requestRefSchema = z.object({ id: z.string(), number: z.string(), title: z.string() });

/** GET /api/threads: one row per request with a conversation, newest activity first. */
const threadSummarySchema = z.object({
  id: z.string(),
  requestId: z.string(),
  request: requestRefSchema,
  resident: participantSchema,
  lastMessage: messageSchema.extend({ authorName: z.string() }).nullable(),
  lastMessageAt: z.iso.datetime(),
  unreadCount: z.number().int().nonnegative(),
});
export type ThreadSummary = z.infer<typeof threadSummarySchema>;
export const threadSummaryListSchema = z.array(threadSummarySchema);

/** GET /api/threads/:requestId/messages. `thread` is null until the first message. */
export const threadDetailSchema = z.object({
  request: requestRefSchema,
  thread: threadSchema.nullable(),
  participants: z.array(participantSchema),
  messages: z.array(messageSchema),
});
export type ThreadDetail = z.infer<typeof threadDetailSchema>;
