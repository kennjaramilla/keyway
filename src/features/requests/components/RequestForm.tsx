"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Controller, useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Fieldset, FormField } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentSession } from "@/features/session/hooks";
import { ApiError } from "@/lib/api-client";
import { useCreateRequest } from "../hooks/useRequest";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  LOCATION_LABELS,
  LOCATIONS,
  makeRequestCreateSchema,
  TIME_SLOT_LABELS,
  TIME_SLOTS,
  URGENCIES,
  URGENCY_LABELS,
  type RequestCreate,
  type RequestCreateInput,
  type TimeSlot,
} from "../schema";
import { addDays, localDate } from "../time";
import { PhotoField } from "./PhotoField";

const options = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ value, label: labels[value] }));

type FormValues = Omit<RequestCreateInput, "preferredWindows"> & {
  preferredWindows: { date: string; slot: TimeSlot | "" }[];
};

const BLANK_WINDOW = { date: "", slot: "" } as const;

/** Resident "New request" form. The photo stays in the browser; everything else is validated by the shared schema. */
export function RequestForm() {
  const { activeBuilding } = useCurrentSession();
  const today = localDate(new Date(), activeBuilding.timezone);
  const schema = useMemo(() => makeRequestCreateSchema(today), [today]);
  const create = useCreateRequest();

  const form = useForm<FormValues, unknown, RequestCreate>({
    // The schema drops blank time rows, so its input type is looser than the form values.
    resolver: zodResolver(schema) as unknown as Resolver<FormValues, unknown, RequestCreate>,
    defaultValues: {
      urgency: "normal",
      title: "",
      description: "",
      preferredWindows: [BLANK_WINDOW],
      entryNotes: "",
    },
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;
  const windows = useFieldArray({ control, name: "preferredWindows" });
  const urgency = useWatch({ control, name: "urgency" });
  const descriptionLength = useWatch({ control, name: "description" })?.length ?? 0;
  const emergency = urgency === "emergency";

  const onSubmit = handleSubmit((values) =>
    create.mutate(values, {
      onError: (error) => {
        // Server-side field errors land on the same inputs.
        if (!(error instanceof ApiError)) return;
        for (const [field, messages] of Object.entries(error.problem.errors ?? {})) {
          form.setError(field as keyof FormValues, { message: messages[0] });
        }
      },
    }),
  );

  const windowsError = errors.preferredWindows?.message ?? errors.preferredWindows?.root?.message;

  return (
    <form onSubmit={onSubmit} noValidate className="grid max-w-2xl gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Category" required error={errors.category?.message}>
          {(control) => (
            <Select
              {...control}
              {...register("category")}
              placeholder="Choose a category"
              options={options(CATEGORIES, CATEGORY_LABELS)}
            />
          )}
        </FormField>
        <FormField label="Urgency" required error={errors.urgency?.message}>
          {(control) => (
            <Select
              {...control}
              {...register("urgency")}
              options={options(URGENCIES, URGENCY_LABELS)}
            />
          )}
        </FormField>
      </div>

      {emergency && (
        <div
          role="alert"
          className="flex gap-3 rounded-md border border-danger/40 bg-danger-soft p-4 text-sm text-fg"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
          <p>
            <strong>If there&apos;s fire, smoke or a gas smell, leave and call 911 first.</strong>{" "}
            Preferred times are optional for emergencies: we&apos;ll come as soon as we can.
          </p>
        </div>
      )}

      <FormField
        label="Title"
        required
        hint="A short summary, for example “Kitchen sink leaking”."
        error={errors.title?.message}
      >
        {(control) => <Input {...control} {...register("title")} autoComplete="off" />}
      </FormField>

      <FormField
        label="Description"
        required
        hint={`What's happening, and since when? ${descriptionLength}/1000 characters.`}
        error={errors.description?.message}
      >
        {(control) => <Textarea {...control} {...register("description")} rows={5} />}
      </FormField>

      <FormField label="Location in unit" required error={errors.location?.message}>
        {(control) => (
          <Select
            {...control}
            {...register("location")}
            placeholder="Choose a location"
            options={options(LOCATIONS, LOCATION_LABELS)}
          />
        )}
      </FormField>

      <Fieldset
        legend="Preferred times"
        required={!emergency}
        hint="Choose up to 3 times in the next 14 days when someone can visit."
        error={windowsError}
      >
        <ol className="grid gap-3">
          {windows.fields.map((field, index) => (
            <li key={field.id} className="flex flex-wrap items-end gap-3">
              <FormField
                label={`Date ${index + 1}`}
                className="min-w-40 flex-1"
                error={errors.preferredWindows?.[index]?.date?.message}
              >
                {(control) => (
                  <Input
                    {...control}
                    type="date"
                    min={today}
                    max={addDays(today, 14)}
                    {...register(`preferredWindows.${index}.date`)}
                  />
                )}
              </FormField>
              <FormField
                label={`Time of day ${index + 1}`}
                className="min-w-40 flex-1"
                error={errors.preferredWindows?.[index]?.slot?.message}
              >
                {(control) => (
                  <Select
                    {...control}
                    {...register(`preferredWindows.${index}.slot`)}
                    placeholder="Choose a time"
                    options={options(TIME_SLOTS, TIME_SLOT_LABELS)}
                  />
                )}
              </FormField>
              {windows.fields.length > 1 && (
                <IconButton
                  label={`Remove time ${index + 1}`}
                  variant="ghost"
                  icon={<Trash2 />}
                  onClick={() => windows.remove(index)}
                />
              )}
            </li>
          ))}
        </ol>
        {windows.fields.length < 3 && (
          <Button
            variant="secondary"
            size="sm"
            className="justify-self-start"
            onClick={() => windows.append(BLANK_WINDOW)}
          >
            <Plus aria-hidden />
            Add another time
          </Button>
        )}
      </Fieldset>

      <Controller
        control={control}
        name="permissionToEnter"
        render={({ field, fieldState }) => (
          <Fieldset
            legend="Can we enter if you're not home?"
            required
            error={fieldState.error?.message}
          >
            <RadioGroup
              value={field.value === undefined ? "" : field.value ? "yes" : "no"}
              onValueChange={(value) => field.onChange(value === "yes")}
              className="flex gap-6"
              aria-label="Permission to enter"
            >
              <RadioGroupItem ref={field.ref} value="yes" label="Yes" onBlur={field.onBlur} />
              <RadioGroupItem value="no" label="No" onBlur={field.onBlur} />
            </RadioGroup>
          </Fieldset>
        )}
      />

      <FormField
        label="Entry notes"
        hint="Pets, parking or access instructions. Don't include door codes."
        error={errors.entryNotes?.message}
      >
        {(control) => <Textarea {...control} {...register("entryNotes")} rows={2} />}
      </FormField>

      <PhotoField />

      {create.isError && !(create.error instanceof ApiError && create.error.status === 422) && (
        <p role="alert" className="text-sm font-medium text-danger">
          We couldn&apos;t submit your request. {create.error.message} Please try again.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={create.isPending}>
          {create.isPending ? "Submitting…" : "Submit request"}
        </Button>
        <Link href="/requests" className={buttonVariants({ variant: "secondary" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
