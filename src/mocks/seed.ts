import { z } from "zod";
import { buildingSchema, unitSchema } from "@/features/buildings/schema";
import { ruleDocumentSchema, rulePassageSchema } from "@/features/house-rules/schema";
import { messageSchema, threadSchema } from "@/features/messages/schema";
import { requestSchema } from "@/features/requests/schema";
import { userSchema } from "@/features/session/schema";
import { vendorSchema } from "@/features/vendors/schema";
import seedJson from "./seed.json";

/**
 * The demo dataset (docs/spec/seed.json, copied to src/mocks/seed.json).
 * To change demo data, edit seed.json; to add an entity, add its schema here
 * and a collection in db.ts. Parsing here means a bad seed fails tests loudly.
 */
export const dbSchema = z.object({
  buildings: z.array(buildingSchema),
  units: z.array(unitSchema),
  users: z.array(userSchema),
  vendors: z.array(vendorSchema),
  requests: z.array(requestSchema),
  threads: z.array(threadSchema),
  messages: z.array(messageSchema),
  ruleDocuments: z.array(ruleDocumentSchema),
  rulePassages: z.array(rulePassageSchema),
});
export type Db = z.infer<typeof dbSchema>;

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$/;
const DAY_MS = 86_400_000;

function shiftDate(isoDate: string, days: number) {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Shift every ISO timestamp by deltaMs, and every preferred-window date by whole days. */
function shift(value: unknown, deltaMs: number, deltaDays: number, key?: string): unknown {
  if (typeof value === "string") {
    return ISO_DATETIME.test(value) ? new Date(Date.parse(value) + deltaMs).toISOString() : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      key === "preferredWindows" && item && typeof item === "object"
        ? { ...item, date: shiftDate((item as { date: string }).date, deltaDays) }
        : shift(item, deltaMs, deltaDays),
    );
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, shift(v, deltaMs, deltaDays, k)]),
    );
  }
  return value;
}

export const SEED_META = seedJson.meta;

/**
 * A fresh copy of the seed, re-timed so "now" in the data is `now`
 * (dashboard metrics and overdue flags stay the same on any day).
 */
export function createSeed(now: number = Date.now()): Db {
  const { meta, ...collections } = seedJson;
  const deltaMs = now - Date.parse(meta.anchorNow);
  const deltaDays = Math.round(deltaMs / DAY_MS);
  return dbSchema.parse(shift(collections, deltaMs, deltaDays));
}
