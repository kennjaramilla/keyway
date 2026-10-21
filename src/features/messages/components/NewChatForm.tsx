"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-client";
import { useCreateChat } from "../hooks/useCreateChat";
import { chatCreateSchema, MESSAGE_MAX_LENGTH, SUBJECT_MAX_LENGTH } from "../schema";

/** Resident: a general question for the coordinator that isn't a maintenance request. */
export function NewChatForm() {
  const create = useCreateChat();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(chatCreateSchema),
    defaultValues: { subject: "", body: "" },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => create.mutate(values))}
      noValidate
      className="grid max-w-2xl gap-6"
    >
      <FormField
        label="Subject"
        hint="For example: Guest parking this weekend"
        required
        error={errors.subject?.message}
      >
        {(control) => (
          <Input {...control} {...register("subject")} maxLength={SUBJECT_MAX_LENGTH} />
        )}
      </FormField>
      <FormField label="Message" required error={errors.body?.message}>
        {(control) => (
          <Textarea {...control} {...register("body")} rows={5} maxLength={MESSAGE_MAX_LENGTH} />
        )}
      </FormField>

      {create.isError && !(create.error instanceof ApiError && create.error.status === 422) && (
        <p role="alert" className="text-sm font-medium text-danger">
          We couldn&apos;t start the chat. {create.error.message} Please try again.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={create.isPending}>
          {create.isPending ? "Sending…" : "Start chat"}
        </Button>
        <Link href="/messages" className={buttonVariants({ variant: "secondary" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
