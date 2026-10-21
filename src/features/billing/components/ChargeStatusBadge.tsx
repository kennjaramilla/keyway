import { StatusBadge, type BadgeTone } from "@/components/ui/badge";
import type { ChargeStatus } from "../schema";

const TONES: Record<ChargeStatus, BadgeTone> = {
  paid: "success",
  overdue: "danger",
  due: "warning",
};
const LABELS: Record<ChargeStatus, string> = { paid: "Paid", overdue: "Overdue", due: "Due" };

export function ChargeStatusBadge({ status }: { status: ChargeStatus }) {
  return <StatusBadge tone={TONES[status]}>{LABELS[status]}</StatusBadge>;
}
