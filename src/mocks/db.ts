import { createSeed, dbSchema, type Db } from "./seed";

/**
 * In-memory mock database. In the browser it is persisted to localStorage so
 * the demo survives a reload; in Node (Vitest) it lives in memory only.
 * Handlers read with getDb() and write with updateDb().
 */

const STORAGE_KEY = "keyway:db:v1";

let state: Db | null = null;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readStored(): unknown {
  try {
    return JSON.parse(storage()?.getItem(STORAGE_KEY) ?? "null");
  } catch {
    return null;
  }
}

/** The persisted db, or a fresh seed when it's missing, corrupt or from an older shape. */
function load(): Db {
  const parsed = dbSchema.safeParse(readStored());
  return parsed.success ? parsed.data : createSeed();
}

function persist(db: Db) {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
}

export function getDb(): Db {
  state ??= load();
  return state;
}

/** Mutate the db and persist it. Return values from the mutator are passed through. */
export function updateDb<T>(mutate: (db: Db) => T): T {
  const db = getDb();
  const result = mutate(db);
  persist(db);
  return result;
}

/** Re-seed from scratch (the "Reset demo data" action, and between tests). */
export function resetDb(now?: number): Db {
  state = createSeed(now);
  persist(state);
  return state;
}

/** Next id with a prefix, e.g. nextId("req") -> "req_1a2b3c". */
export function nextId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
