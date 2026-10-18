import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Circle, CircleDot, Info, XCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      tone: {
        neutral: "border-border bg-neutral-soft text-fg",
        info: "border-transparent bg-info-soft text-info",
        success: "border-transparent bg-success-soft text-success",
        warning: "border-transparent bg-warning-soft text-warning",
        danger: "border-transparent bg-danger-soft text-danger",
        primary: "border-transparent bg-primary-soft text-primary",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;
export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

const toneIcons = {
  neutral: Circle,
  info: Info,
  primary: CircleDot,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
} satisfies Record<BadgeTone, unknown>;

/**
 * A status pill: text label plus a tone-specific icon shape, so status is
 * never conveyed by colour alone. Map domain statuses to tones in the feature.
 */
export function StatusBadge({ tone = "neutral", children, ...props }: BadgeProps) {
  const Icon = toneIcons[tone ?? "neutral"];
  return (
    <Badge tone={tone} {...props}>
      <Icon aria-hidden />
      {children}
    </Badge>
  );
}
