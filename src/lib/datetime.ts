// Every time is shown in the building's time zone (with its abbreviation), never the viewer's,
// so submitted times, the timeline, messages and visit windows always agree.
const formatters = new Map<string, Intl.DateTimeFormat>();

export function zonedFormatter(timeZone: string, options: Intl.DateTimeFormatOptions) {
  const key = `${timeZone}|${JSON.stringify(options)}`;
  let format = formatters.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", { ...options, timeZone });
    formatters.set(key, format);
  }
  return format;
}

const DATE = { month: "short", day: "numeric", year: "numeric" } as const;
export const TIME = { hour: "numeric", minute: "2-digit" } as const;

/** "Oct 19, 2026, 2:15 PM EDT" */
export const formatDateTime = (iso: string, timeZone: string) =>
  zonedFormatter(timeZone, { ...DATE, ...TIME, timeZoneName: "short" }).format(new Date(iso));

/** "Oct 19, 2026" */
export const formatDate = (iso: string, timeZone: string) =>
  zonedFormatter(timeZone, DATE).format(new Date(iso));

/** "EDT" (or "EST"): the zone's abbreviation at a given moment. */
export const timeZoneAbbreviation = (timeZone: string, at: Date = new Date()) =>
  zonedFormatter(timeZone, { timeZoneName: "short" })
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")?.value ?? timeZone;
