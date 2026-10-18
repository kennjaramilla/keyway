import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Label } from "../label";

/** Props FormField hands to its control so label, hint and error are wired up. */
export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  "aria-required"?: true;
};

export type FormFieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  /** Render prop: spread the props onto the input, select or textarea. */
  children: (control: FieldControlProps) => ReactNode;
};

export function FormField({ label, hint, error, required, className, children }: FormFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {hint && (
        <p id={hintId} className="text-sm text-fg-muted">
          {hint}
        </p>
      )}
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required ? true : undefined,
      })}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Group label for radio groups and checkbox sets. */
export function Fieldset({
  legend,
  hint,
  error,
  required,
  className,
  children,
}: Omit<FormFieldProps, "children" | "label"> & { legend: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <fieldset
      className={cn("flex flex-col gap-2", className)}
      aria-describedby={
        [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined
      }
      aria-invalid={error ? true : undefined}
    >
      <legend className="text-sm font-medium text-fg">
        {legend}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
      </legend>
      {hint && (
        <p id={`${id}-hint`} className="-mt-1 text-sm text-fg-muted">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
