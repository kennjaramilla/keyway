import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  /** Usually a primary Button, e.g. "New request". */
  action?: ReactNode;
  className?: string;
  /** Match the outline: 2 under a page h1, 3 inside a card titled with an h2. */
  headingLevel?: 2 | 3;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  headingLevel = 2,
}: EmptyStateProps) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong px-6 py-12 text-center",
        className,
      )}
    >
      <div aria-hidden className="mb-1 text-fg-subtle [&_svg]:size-8">
        {icon ?? <Inbox />}
      </div>
      <Heading className="text-base font-semibold text-fg">{title}</Heading>
      {description && <p className="max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
