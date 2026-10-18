import { KeyRound } from "lucide-react";
import { cn } from "@/lib/cn";

/** Keyway logo tile plus wordmark. `onDark` is for the sidebar. */
export function BrandMark({ onDark, subtitle }: { onDark?: boolean; subtitle?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          onDark ? "bg-white/10 text-sidebar-fg" : "bg-sidebar text-sidebar-fg",
        )}
      >
        <KeyRound className="size-5" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className={cn("font-semibold", onDark ? "text-sidebar-fg" : "text-fg")}>Keyway</span>
        {subtitle && (
          <span className={cn("text-xs", onDark ? "text-sidebar-muted" : "text-fg-muted")}>
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
