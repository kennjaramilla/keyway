import { StatusBadge, type BadgeTone } from "@/components/ui/badge";
import { STATUS_LABELS, URGENCY_LABELS, type Status, type Urgency } from "../schema";

const STATUS_TONES: Record<Status, BadgeTone> = {
  new: "warning",
  triaged: "neutral",
  scheduled: "primary",
  in_progress: "info",
  resolved: "success",
  cancelled: "neutral",
};

const URGENCY_TONES: Record<Urgency, BadgeTone> = {
  emergency: "danger",
  high: "warning",
  normal: "neutral",
  low: "neutral",
};

export function RequestStatusBadge({ status }: { status: Status }) {
  return <StatusBadge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</StatusBadge>;
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return <StatusBadge tone={URGENCY_TONES[urgency]}>{URGENCY_LABELS[urgency]}</StatusBadge>;
}
