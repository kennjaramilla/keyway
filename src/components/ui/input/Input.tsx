import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const fieldClasses =
  "w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-fg shadow-sm placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70 aria-invalid:border-danger";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return <input type={type} className={cn(fieldClasses, "h-10", className)} {...props} />;
}
