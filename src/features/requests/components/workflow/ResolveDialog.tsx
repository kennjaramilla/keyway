"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { resolveSchema } from "../../schema";
import { ActionDialog, type DialogProps } from "./ActionDialog";

export function ResolveDialog({ request, run, disabled, onFinished }: DialogProps) {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(resolveSchema),
    defaultValues: { resolutionNote: "" },
  });
  return (
    <ActionDialog
      label="Resolve"
      title={`Resolve ${request.number}`}
      description="Add a short note about what was done. The resident will see it."
      disabled={disabled}
      formId="resolve-form"
      submitLabel="Resolve request"
      onFinished={onFinished}
    >
      {(finish) => (
        <form
          id="resolve-form"
          noValidate
          onSubmit={handleSubmit((body) => {
            finish();
            run({ action: "resolve", body });
          })}
        >
          <FormField
            label="Resolution note"
            required
            error={formState.errors.resolutionNote?.message}
          >
            {(control) => <Textarea {...control} {...register("resolutionNote")} rows={3} />}
          </FormField>
        </form>
      )}
    </ActionDialog>
  );
}
