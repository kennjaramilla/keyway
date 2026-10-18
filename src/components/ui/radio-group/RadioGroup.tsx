import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function RadioGroup({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} />;
}

export type RadioGroupItemProps = ComponentProps<typeof RadioGroupPrimitive.Item> & {
  label: ReactNode;
};

export function RadioGroupItem({ label, className, id, ...props }: RadioGroupItemProps) {
  const generatedId = useId();
  const itemId = id ?? generatedId;
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <RadioGroupPrimitive.Item
        id={itemId}
        className="flex size-4.5 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:border-primary"
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-primary" />
      </RadioGroupPrimitive.Item>
      <label htmlFor={itemId} className="text-sm text-fg">
        {label}
      </label>
    </div>
  );
}
