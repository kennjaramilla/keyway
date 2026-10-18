"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Fieldset, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { SkeletonList } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/ui/error-state";
import { useCurrentSession } from "@/features/session/hooks";
import type { Vendor } from "@/features/vendors/schema";
import { can } from "@/lib/auth/permissions";
import type { WorkflowInput } from "../api";
import { useVendors, useWorkflowAction } from "../hooks/useRequest";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  makeScheduleFormSchema,
  resolveSchema,
  TRANSITIONS,
  triageSchema,
  URGENCIES,
  URGENCY_LABELS,
  type RequestDetail,
  type VisitWindow,
} from "../schema";
import { addDays, localDate, localTime } from "../time";

type Run = (input: WorkflowInput) => void;

/** Next valid workflow steps for this request, from TRANSITIONS and can(). */
export function WorkflowActions({ request }: { request: RequestDetail }) {
  const { user } = useCurrentSession();
  const mutation = useWorkflowAction(request);
  const groupRef = useRef<HTMLDivElement>(null);

  const offered = TRANSITIONS[request.status]
    .map((transition) => transition.action)
    .filter((action) => action !== "request:reopen" && can(user, action, request));
  const canAssign =
    (request.status === "triaged" || request.status === "scheduled") &&
    can(user, "request:assign", request);

  if (offered.length === 0 && !canAssign) return null;

  const run: Run = (input) => mutation.mutate(input);
  const focusGroup = () => groupRef.current?.focus();
  const busy = mutation.isPending;
  const dialogProps = { request, run, disabled: busy, onFinished: focusGroup };

  return (
    <div
      ref={groupRef}
      role="group"
      aria-label="Workflow actions"
      tabIndex={-1}
      className="flex flex-wrap items-center gap-2 rounded-md outline-none focus-visible:outline-2 focus-visible:outline-ring"
    >
      {offered.includes("request:triage") && <TriageDialog {...dialogProps} />}
      {canAssign && <AssignDialog {...dialogProps} />}
      {offered.includes("request:schedule") && <ScheduleDialog {...dialogProps} />}
      {offered.includes("request:start") && (
        <Button
          disabled={busy}
          onClick={() => {
            run({ action: "start" });
            focusGroup();
          }}
        >
          Mark in progress
        </Button>
      )}
      {offered.includes("request:resolve") && <ResolveDialog {...dialogProps} />}
    </div>
  );
}

/** Dialog shell: after a submit it closes and moves focus to the actions group, since the trigger may vanish. */
function ActionDialog({
  label,
  title,
  description,
  variant = "primary",
  disabled,
  hint,
  formId,
  submitLabel,
  onFinished,
  children,
}: {
  label: string;
  title: string;
  description?: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  hint?: string;
  formId: string;
  submitLabel: string;
  onFinished: () => void;
  children: (finish: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const finish = () => {
    setSubmitted(true);
    setOpen(false);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setSubmitted(false);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant} disabled={disabled} title={hint}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent
        title={title}
        description={description}
        onCloseAutoFocus={(event) => {
          if (!submitted) return;
          event.preventDefault();
          onFinished();
        }}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" form={formId}>
              {submitLabel}
            </Button>
          </>
        }
      >
        {children(finish)}
      </DialogContent>
    </Dialog>
  );
}

type DialogProps = { request: RequestDetail; run: Run; disabled: boolean; onFinished: () => void };

const triageFormSchema = z.object({
  category: z.enum(CATEGORIES),
  urgency: z.enum(URGENCIES),
  note: triageSchema.shape.note,
});

function TriageDialog({ request, run, disabled, onFinished }: DialogProps) {
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

/** Matching trade first, then general repair, then the rest. */
export function sortVendors(vendors: Vendor[], category: Vendor["trade"]) {
  const rank = (vendor: Vendor) =>
    vendor.trade === category ? 0 : vendor.trade === "general" ? 1 : 2;
  return [...vendors].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

function AssignDialog({ request, run, disabled, onFinished }: DialogProps) {
  const { user } = useCurrentSession();
  // The vendors API is scoped to the active building; don't refetch the old one mid-switch.
  const vendors = useVendors(request.buildingId, request.buildingId === user.activeBuildingId);
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(z.object({ vendorId: z.string().min(1, "Choose a vendor.") })),
    defaultValues: { vendorId: request.vendorId ?? "" },
  });
  return (
    <ActionDialog
      label={request.vendorId ? "Change vendor" : "Assign vendor"}
      title={`Assign a vendor to ${request.number}`}
      description={`Only vendors serving ${request.buildingName} are listed. Matching trades come first.`}
      variant={request.vendorId ? "secondary" : "primary"}
      disabled={disabled}
      formId="assign-form"
      submitLabel="Assign vendor"
      onFinished={onFinished}
    >
      {(finish) => (
        <form
          id="assign-form"
          noValidate
          onSubmit={handleSubmit(({ vendorId }) => {
            finish();
            run({ action: "assign", body: { vendorId } });
          })}
        >
          {vendors.isPending ? (
            <SkeletonList rows={3} label="Loading vendors" />
          ) : vendors.isError ? (
            <ErrorState title="Couldn't load vendors" onRetry={() => vendors.refetch()} />
          ) : (
            <Controller
              control={control}
              name="vendorId"
              render={({ field, fieldState }) => (
                <Fieldset legend="Vendor" required error={fieldState.error?.message}>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    aria-label="Vendor"
                  >
                    {sortVendors(vendors.data, request.category).map((vendor, index) => (
                      <RadioGroupItem
                        key={vendor.id}
                        ref={index === 0 ? field.ref : undefined}
                        value={vendor.id}
                        label={`${vendor.name} · ${CATEGORY_LABELS[vendor.trade]}${
                          vendor.trade === request.category ? " (matches)" : ""
                        }`}
                      />
                    ))}
                  </RadioGroup>
                </Fieldset>
              )}
            />
          )}
        </form>
      )}
    </ActionDialog>
  );
}

function ScheduleDialog({ request, run, disabled, onFinished }: DialogProps) {
  const timeZone = request.timeZone;
  const today = localDate(new Date(), timeZone);
  const current = request.visitWindow;
  const { register, handleSubmit, formState } = useForm({
    // Rebuilt per submit so "in the future" is checked against the current time.
    resolver: (values, context, options) =>
      zodResolver(makeScheduleFormSchema({ now: new Date(), timeZone, urgency: request.urgency }))(
        values,
        context,
        options,
      ),
    defaultValues: current
      ? {
          date: localDate(new Date(current.start), timeZone),
          startTime: localTime(new Date(current.start), timeZone),
          endTime: localTime(new Date(current.end), timeZone),
        }
      : { date: addDays(today, 1), startTime: "10:00", endTime: "12:00" },
  });
  const rescheduling = request.status === "scheduled";
  const noVendor = !request.vendorId;
  const { errors } = formState;
  return (
    <ActionDialog
      label={rescheduling ? "Reschedule" : "Schedule visit"}
      title={`${rescheduling ? "Reschedule" : "Schedule"} the visit for ${request.number}`}
      description={`Times are in ${request.buildingName} local time. Visits are 1 to 4 hours, between 8:00 and 20:00 unless it's an emergency.`}
      variant={rescheduling ? "secondary" : "primary"}
      disabled={disabled || noVendor}
      hint={noVendor ? "Assign a vendor first" : undefined}
      formId="schedule-form"
      submitLabel={rescheduling ? "Reschedule" : "Schedule visit"}
      onFinished={onFinished}
    >
      {(finish) => (
        <form
          id="schedule-form"
          noValidate
          className="grid gap-4 sm:grid-cols-3"
          onSubmit={handleSubmit((window: VisitWindow) => {
            finish();
            run({ action: "schedule", body: window });
          })}
        >
          <FormField label="Date" required error={errors.date?.message}>
            {(control) => (
              <Input
                {...control}
                type="date"
                min={today}
                max={addDays(today, 30)}
                {...register("date")}
              />
            )}
          </FormField>
          <FormField label="Start" required error={errors.startTime?.message}>
            {(control) => <Input {...control} type="time" step={900} {...register("startTime")} />}
          </FormField>
          <FormField label="End" required error={errors.endTime?.message}>
            {(control) => <Input {...control} type="time" step={900} {...register("endTime")} />}
          </FormField>
        </form>
      )}
    </ActionDialog>
  );
}

function ResolveDialog({ request, run, disabled, onFinished }: DialogProps) {
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
