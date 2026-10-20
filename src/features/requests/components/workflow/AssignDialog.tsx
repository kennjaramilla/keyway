"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorState } from "@/components/ui/error-state";
import { Fieldset } from "@/components/ui/form-field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SkeletonList } from "@/components/ui/skeleton";
import { useCurrentSession } from "@/features/session/hooks";
import type { Vendor } from "@/features/vendors/schema";
import { useVendors } from "../../hooks/useRequest";
import { CATEGORY_LABELS } from "../../schema";
import { ActionDialog, type DialogProps } from "./ActionDialog";

/** Matching trade first, then general repair, then the rest. */
export function sortVendors(vendors: Vendor[], category: Vendor["trade"]) {
  const rank = (vendor: Vendor) =>
    vendor.trade === category ? 0 : vendor.trade === "general" ? 1 : 2;
  return [...vendors].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

export function AssignDialog({ request, run, disabled, onFinished }: DialogProps) {
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
