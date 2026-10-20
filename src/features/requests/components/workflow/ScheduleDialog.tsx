"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { timeZoneAbbreviation } from "@/lib/datetime";
import { makeScheduleFormSchema, type VisitWindow } from "../../schema";
import { addDays, localDate, localTime } from "../../time";
import { ActionDialog, type DialogProps } from "./ActionDialog";

export function ScheduleDialog({ request, run, disabled, onFinished }: DialogProps) {
  const timeZone = request.timeZone;
  const today = localDate(new Date(), timeZone);
  // Reschedules start from the booked window if it's still ahead; otherwise tomorrow 10-12, always valid.
  const current =
    request.visitWindow && new Date(request.visitWindow.start) > new Date()
      ? request.visitWindow
      : null;
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
      description={`Times are in ${request.buildingName} time (${timeZoneAbbreviation(timeZone)}). Visits are 1 to 4 hours, between 8:00 and 20:00 unless it's an emergency.`}
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
