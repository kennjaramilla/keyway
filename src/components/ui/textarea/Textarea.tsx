import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { fieldClasses } from "../input";

export function Textarea({ className, rows = 4, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea rows={rows} className={cn(fieldClasses, "min-h-20 py-2", className)} {...props} />
  );
}
