import { CATEGORIES, STATUSES, URGENCIES, type RequestListItem, type Status } from "./schema";

// Queue filters and sorting, kept in the URL (?status=new,triaged&sort=urgency&dir=desc).

const SORT_KEYS = ["urgency", "age", "updated"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
type SortDir = "asc" | "desc";

export type QueueState = {
  statuses: Status[];
  urgency: string;
  category: string;
  q: string;
  sort: SortKey;
  dir: SortDir;
};

const OPEN_STATUSES: Status[] = STATUSES.filter((status) => status !== "resolved");

/** Staff default to open work; residents see everything they've reported. */
export const defaultQueue = (role: string): QueueState => ({
  statuses: role === "resident" ? [...STATUSES] : OPEN_STATUSES,
  urgency: "",
  category: "",
  q: "",
  sort: "age",
  dir: "asc",
});

const oneOf = <T extends string>(values: readonly T[], value: string | null) =>
  values.includes(value as T) ? (value as T) : undefined;

export function parseQueue(params: URLSearchParams, base: QueueState): QueueState {
  const status = params.get("status");
  const statuses =
    status === null
      ? base.statuses
      : status
          .split(",")
          .map((value) => oneOf(STATUSES, value))
          .filter((value): value is Status => value !== undefined);
  return {
    statuses,
    urgency: oneOf(URGENCIES, params.get("urgency")) ?? "",
    category: oneOf(CATEGORIES, params.get("category")) ?? "",
    q: params.get("q") ?? "",
    sort: oneOf(SORT_KEYS, params.get("sort")) ?? base.sort,
    dir: oneOf(["asc", "desc"] as const, params.get("dir")) ?? base.dir,
  };
}

/** Only non-default values go in the URL, so a plain /requests link shows the default view. */
export function serializeQueue(state: QueueState, base: QueueState) {
  const params = new URLSearchParams();
  const sameStatuses =
    state.statuses.length === base.statuses.length &&
    base.statuses.every((status) => state.statuses.includes(status));
  if (!sameStatuses)
    params.set("status", STATUSES.filter((s) => state.statuses.includes(s)).join(","));
  if (state.urgency) params.set("urgency", state.urgency);
  if (state.category) params.set("category", state.category);
  if (state.q.trim()) params.set("q", state.q.trim());
  if (state.sort !== base.sort || state.dir !== base.dir) {
    params.set("sort", state.sort);
    params.set("dir", state.dir);
  }
  return params.toString();
}

const URGENCY_RANK = Object.fromEntries(URGENCIES.map((urgency, index) => [urgency, index]));

const compare: Record<SortKey, (a: RequestListItem, b: RequestListItem) => number> = {
  // Ascending = least urgent first, youngest first, least recently updated first.
  urgency: (a, b) => URGENCY_RANK[b.urgency]! - URGENCY_RANK[a.urgency]!,
  age: (a, b) => b.createdAt.localeCompare(a.createdAt),
  updated: (a, b) => a.updatedAt.localeCompare(b.updatedAt),
};

export function applyQueue(items: RequestListItem[], state: QueueState) {
  const q = state.q.trim().toLowerCase();
  const direction = state.dir === "asc" ? 1 : -1;
  return items
    .filter((item) => state.statuses.includes(item.status))
    .filter((item) => !state.urgency || item.urgency === state.urgency)
    .filter((item) => !state.category || item.category === state.category)
    .filter(
      (item) =>
        !q ||
        [item.number, item.title, item.unitLabel, item.vendorName ?? ""].some((field) =>
          field.toLowerCase().includes(q),
        ),
    )
    .sort(
      (a, b) => direction * compare[state.sort](a, b) || b.createdAt.localeCompare(a.createdAt),
    );
}

/** First click on a column sorts its most useful way (most urgent, oldest, latest update). */
export function toggleSort(state: QueueState, key: SortKey): QueueState {
  if (state.sort === key) return { ...state, dir: state.dir === "asc" ? "desc" : "asc" };
  return { ...state, sort: key, dir: "desc" };
}

/** True when no filter differs from the default (sorting doesn't count). */
export const isUnfiltered = (state: QueueState, base: QueueState) =>
  serializeQueue({ ...state, sort: base.sort, dir: base.dir }, base) === "";
