"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ErrorState } from "@/components/ui/error-state";
import { FormField, Fieldset } from "@/components/ui/form-field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SkeletonList } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentSession } from "@/features/session/hooks";
import type { Vendor } from "@/features/vendors/schema";
import { useVendors } from "../../hooks/useRequest";
import { assignSchema, CATEGORY_LABELS, reassignErrors } from "../../schema";
import { ActionDialog, type DialogProps } from "./ActionDialog";

/** Matching trade first, then general repair, then the rest. */
export function sortVendors(vendors: Vendor[], category: Vendor["trade"]) {
  const rank = (vendor: Vendor) =>
    vendor.trade === category ? 0 : vendor.trade === "general" ? 1 : 2;
  return [...vendors].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

/** The API's rules, so a same-vendor pick or a missing reason is caught before sending. */
const formSchema = (currentVendorId: string | null) =>
  assignSchema.superRefine((input, ctx) => {
    for (const [path, [message]] of Object.entries(reassignErrors(currentVendorId, input) ?? {})) {
      ctx.addIssue({ code: "custom", path: [path], message });
    }
  });

export function AssignDialog({ request, run, disabled, onFinished }: DialogProps) {
  const { user } = useCurrentSession();
  // The vendors API is scoped to the active building; don't refetch the old one mid-switch.
  const vendors = useVendors(request.buildingId, request.buildingId === user.activeBuildingId);
  const reassigning = request.vendorId !== null;
  const { control, register, handleSubmit, formState } = useForm({
    resolver: zodResolver(formSchema(request.vendorId)),
    defaultValues: { vendorId: request.vendorId ?? "", reason: "" },
  });
  return (
    <ActionDialog
      label={reassigning ? "Change vendor" : "Assign vendor"}
      title={
        reassigning
          ? `Change the vendor on ${request.number}`
          : `Assign a vendor to ${request.number}`
      }
      description={`Only vendors serving ${request.buildingName} are listed. Matching trades come first.${
        reassigning ? " The status and visit window stay as they are." : ""
      }`}
      variant={reassigning ? "secondary" : "primary"}
      disabled={disabled}
      formId="assign-form"
      submitLabel={reassigning ? "Change vendor" : "Assign vendor"}
      onFinished={onFinished}
    >
      {(finish) => (
        <form
          id="assign-form"
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit(({ vendorId, reason }) => {
            finish();
            run({ action: "assign", body: reassigning ? { vendorId, reason } : { vendorId } });
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
          {reassigning && (
            <FormField label="Why change vendor?" required error={formState.errors.reason?.message}>
              {(field) => <Textarea {...field} {...register("reason")} rows={3} />}
            </FormField>
          )}
        </form>
      )}
    </ActionDialog>
  );
}
