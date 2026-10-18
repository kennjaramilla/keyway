import { Check } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root> & {
  label: ReactNode;
  description?: ReactNode;
};

export function Checkbox({ label, description, className, id, ...props }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <CheckboxPrimitive.Root
        id={checkboxId}
        aria-describedby={description ? `${checkboxId}-description` : undefined}
        className="peer mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-sm border border-border-strong bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-fg"
        {...props}
      >
        <CheckboxPrimitive.Indicator>
          <Check aria-hidden className="size-3.5" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <div className="grid gap-0.5">
        <label htmlFor={checkboxId} className="text-sm text-fg peer-disabled:opacity-60">
          {label}
        </label>
        {description && (
          <p id={`${checkboxId}-description`} className="text-sm text-fg-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
