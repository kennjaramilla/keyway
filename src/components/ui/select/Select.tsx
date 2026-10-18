import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { fieldClasses } from "../input";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = Omit<ComponentProps<"select">, "children"> & {
  options: readonly SelectOption[];
  /** Adds an empty first option, e.g. "Choose a category". */
  placeholder?: string;
};

/**
 * Native select styled with tokens: best mobile UX, works with React Hook
 * Form's register() and needs no pointer-event workarounds in tests.
 */
export function Select({ className, options, placeholder, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select className={cn(fieldClasses, "h-10 appearance-none pr-9", className)} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted"
      />
    </div>
  );
}
