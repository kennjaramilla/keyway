import { STATUS_LABELS, type RequestDetail, type TimelineEvent } from "../schema";
import { formatDateTime, formatVisitWindow } from "../format";

const EVENT_LABELS: Record<TimelineEvent["type"], string> = {
  created: "Request submitted",
  triaged: "Triaged",
  vendor_assigned: "Vendor assigned",
  scheduled: "Visit scheduled",
  rescheduled: "Visit rescheduled",
  started: "Work started",
  resolved: "Resolved",
  note: "Note added",
  cancelled: "Cancelled",
  reopened: "Reopened",
};

function eventDetail(event: TimelineEvent, request: RequestDetail) {
  const window = event.meta?.visitWindow;
  if (window) return formatVisitWindow(window, request.timeZone);
  return event.meta?.vendorId ? request.people[event.meta.vendorId] : undefined;
}

/** Vertical, oldest-first timeline of what happened to a request. */
export function RequestTimeline({ request }: { request: RequestDetail }) {
  return (
    <ol aria-label="Timeline" className="relative grid gap-5 border-l border-border pl-5">
      {request.timeline.map((event) => {
        // Seeded events often describe the vendor or window in their note already.
        const detail = event.note ? undefined : eventDetail(event, request);
        return (
          <li key={event.id} className="relative">
            <span
              aria-hidden
              className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-surface bg-primary"
            />
            <p className="text-sm font-medium text-fg">
              {EVENT_LABELS[event.type]}
              {event.toStatus && event.fromStatus && event.toStatus !== event.fromStatus && (
                <span className="font-normal text-fg-muted">
                  {" "}
                  · {STATUS_LABELS[event.fromStatus]} → {STATUS_LABELS[event.toStatus]}
                </span>
              )}
            </p>
            <p className="text-sm text-fg-muted">
              {request.people[event.actorId] ?? "Someone"} ·{" "}
              <time dateTime={event.at}>{formatDateTime(event.at)}</time>
            </p>
            {detail && <p className="mt-1 text-sm text-fg">{detail}</p>}
            {event.note && <p className="mt-1 text-sm whitespace-pre-line text-fg">{event.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}
