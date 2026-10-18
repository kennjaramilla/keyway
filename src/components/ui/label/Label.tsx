import { Label as LabelPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type LabelProps = ComponentProps<typeof LabelPrimitive.Root> & { required?: boolean };

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root className={cn("text-sm font-medium text-fg", className)} {...props}>
      {children}
      {required && (
        <span className="ml-0.5 text-danger" aria-hidden>
          *
        </span>
      )}
    </LabelPrimitive.Root>
  );
}
