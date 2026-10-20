"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { cancelSchema } from "../../schema";
import { ActionDialog, type DialogProps } from "./ActionDialog";

export function CancelDialog({ request, run, disabled, onFinished }: DialogProps) {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: "" },
  });
  return (
    <ActionDialog
      label="Cancel request"
      title={`Cancel ${request.number}?`}
      description="Your coordinator will see that you cancelled it. You can't undo this."
      variant="secondary"
      disabled={disabled}
      formId="cancel-form"
      submitLabel="Cancel request"
      submitVariant="danger"
      closeLabel="Keep request"
      onFinished={onFinished}
    >
      {(finish) => (
        <form
          id="cancel-form"
          noValidate
          onSubmit={handleSubmit((body) => {
            finish();
            run({ action: "cancel", body });
          })}
        >
          <FormField label="Reason (optional)" error={formState.errors.reason?.message}>
            {(control) => <Textarea {...control} {...register("reason")} rows={3} />}
          </FormField>
        </form>
      )}
    </ActionDialog>
  );
}
