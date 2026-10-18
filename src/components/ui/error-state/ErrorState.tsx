import { AlertCircle, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "../button";

export type ErrorStateProps = {
  title?: string;
  description?: ReactNode;
  /** Shows a "Try again" button. Pass the query's refetch. */
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this. Check your connection and try again.",
  onRetry,
  retrying,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-danger/40 bg-danger-soft px-6 py-10 text-center",
        className,
      )}
    >
      <AlertCircle aria-hidden className="mb-1 size-8 text-danger" />
      <h2 className="text-base font-semibold text-fg">{title}</h2>
      <p className="max-w-sm text-sm text-fg-muted">{description}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-3" onClick={onRetry} loading={retrying}>
          {!retrying && <RotateCw aria-hidden />}
          Try again
        </Button>
      )}
    </div>
  );
}
