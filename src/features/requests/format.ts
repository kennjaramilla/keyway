import { TIME_SLOT_LABELS, type PreferredWindow, type VisitWindow } from "./schema";

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const shortDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDate = (iso: string) => shortDate.format(new Date(iso));

/** "Tue, Oct 20, 10:00 – 12:00" in the building's timezone. */
export function formatVisitWindow({ start, end }: VisitWindow, timeZone: string) {
  const day = new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day.format(new Date(start))}, ${time.format(new Date(start))} – ${time.format(new Date(end))}`;
}

/** "Tue, Oct 20 · Morning (8–12)" for a building-local preferred window. */
export function formatPreferredWindow({ date, slot }: PreferredWindow) {
  const day = new Intl.DateTimeFormat(undefined, {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
  return `${day} · ${TIME_SLOT_LABELS[slot]}`;
}

/** "3h", "2d" or "just now": how long ago a request was created. */
export function formatAge(iso: string, now: Date = new Date()) {
  const hours = Math.floor((now.getTime() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "Under 1h";
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
