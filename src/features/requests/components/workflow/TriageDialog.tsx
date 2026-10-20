"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, CATEGORY_LABELS, triageSchema, URGENCIES, URGENCY_LABELS } from "../../schema";
import { ActionDialog, type DialogProps } from "./ActionDialog";

const triageFormSchema = z.object({
  category: z.enum(CATEGORIES),
  urgency: z.enum(URGENCIES),
  note: triageSchema.shape.note,
});

export function TriageDialog({ request, run, disabled, onFinished }: DialogProps) {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(triageFormSchema),
    defaultValues: { category: request.category, urgency: request.urgency, note: "" },
  });
  return (
    <ActionDialog
      label="Triage"
      title={`Triage ${request.number}`}
      description="Confirm or correct the category and urgency."
      disabled={disabled}
      formId="triage-form"
      submitLabel="Mark triaged"
      onFinished={onFinished}
    >
      {(finish) => (
        <form
          id="triage-form"
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit((values) => {
            finish();
            run({ action: "triage", body: { ...values, note: values.note || undefined } });
          })}
        >
          <FormField label="Category" error={formState.errors.category?.message}>
            {(control) => (
              <Select
                {...control}
                {...register("category")}
                options={CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] }))}
              />
            )}
          </FormField>
          <FormField label="Urgency" error={formState.errors.urgency?.message}>
            {(control) => (
              <Select
                {...control}
                {...register("urgency")}
                options={URGENCIES.map((value) => ({ value, label: URGENCY_LABELS[value] }))}
              />
            )}
          </FormField>
          <FormField label="Note (optional)" error={formState.errors.note?.message}>
            {(control) => <Textarea {...control} {...register("note")} rows={2} />}
          </FormField>
        </form>
      )}
    </ActionDialog>
  );
}
