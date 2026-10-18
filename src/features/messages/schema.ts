import { z } from "zod";

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
    .max(2000, "Keep messages under 2,000 characters."),
});
export type MessageCreate = z.infer<typeof messageCreateSchema>;
