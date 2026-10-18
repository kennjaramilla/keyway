import { TIME, zonedFormatter } from "@/lib/datetime";
import { TIME_SLOT_LABELS, type PreferredWindow, type VisitWindow } from "./schema";

/** "Tue, Oct 20, 10:00 AM – 12:00 PM EDT" */
export function formatVisitWindow({ start, end }: VisitWindow, timeZone: string) {
  const day = zonedFormatter(timeZone, { weekday: "short", month: "short", day: "numeric" });
  const from = zonedFormatter(timeZone, TIME).format(new Date(start));
  const to = zonedFormatter(timeZone, { ...TIME, timeZoneName: "short" }).format(new Date(end));
  return `${day.format(new Date(start))}, ${from} – ${to}`;
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
