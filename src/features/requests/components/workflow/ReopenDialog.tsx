"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { reopenSchema } from "../../schema";
import { ActionDialog, type DialogProps } from "./ActionDialog";

export function ReopenDialog({ request, run, disabled, onFinished }: DialogProps) {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(reopenSchema),
    defaultValues: { reason: "" },
  });
  return (
    <ActionDialog
      label="Reopen"
      title={`Reopen ${request.number}?`}
      description="It goes back to In progress with the same vendor."
      variant="secondary"
      disabled={disabled}
      formId="reopen-form"
      submitLabel="Reopen request"
      onFinished={onFinished}
    >
      {(finish) => (
        <form
          id="reopen-form"
          noValidate
          onSubmit={handleSubmit((body) => {
            finish();
            run({ action: "reopen", body });
          })}
        >
          <FormField label="What's still wrong?" required error={formState.errors.reason?.message}>
            {(control) => <Textarea {...control} {...register("reason")} rows={3} />}
          </FormField>
        </form>
      )}
    </ActionDialog>
  );
}
