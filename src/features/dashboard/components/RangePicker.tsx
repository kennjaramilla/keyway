"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { DASHBOARD_RANGES, type DashboardRange } from "../schema";

/** Segmented 7 / 14 / 30 day control. A radio group, so arrow keys move between ranges. */
export function RangePicker({
  value,
  onChange,
}: {
  value: DashboardRange;
  onChange: (days: DashboardRange) => void;
}) {
  return (
    <RadioGroupPrimitive.Root
      aria-label="Date range"
      value={String(value)}
      onValueChange={(next) => onChange(Number(next) as DashboardRange)}
      orientation="horizontal"
      className="inline-flex rounded-lg border border-border bg-surface p-0.5"
    >
      {DASHBOARD_RANGES.map((days) => (
        <RadioGroupPrimitive.Item
          key={days}
          value={String(days)}
          className="h-8 rounded-md px-3 text-sm font-medium text-fg-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-fg"
        >
          {days} days
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
