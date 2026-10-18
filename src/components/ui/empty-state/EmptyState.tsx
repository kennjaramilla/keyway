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
};

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
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
      <h2 className="text-base font-semibold text-fg">{title}</h2>
      {description && <p className="max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
