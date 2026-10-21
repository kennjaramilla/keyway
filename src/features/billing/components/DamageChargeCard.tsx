"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SkeletonList } from "@/components/ui/skeleton";
import type { RequestDetail } from "@/features/requests/schema";
import { useCurrentSession } from "@/features/session/hooks";
import { ApiError } from "@/lib/api-client";
import { can, roleCan } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/datetime";
import { useCreateDamageCharge, useRequestCharges } from "../hooks/useStaffBilling";
import { chargeStatus, damageChargeSchema, formatMoney, parseMoney } from "../schema";
import { ChargeStatusBadge } from "./ChargeStatusBadge";

/** Staff, on a resolved request: the damage charge billed for it, or a way to add one. */
export function DamageChargeCard({ request }: { request: RequestDetail }) {
  const { user } = useCurrentSession();
  const staff = user.role !== "resident" && roleCan(user.role, "billing:view");
  const charges = useRequestCharges(request.id, staff && request.status === "resolved");
  if (!staff || request.status !== "resolved") return null;

  const charge = charges.data?.[0];
  return (
    <Card aria-labelledby="damage-charge">
      <CardHeader>
        <CardTitle id="damage-charge">Damage charge</CardTitle>
        <CardDescription>Bill the resident when the repair was caused by damage.</CardDescription>
      </CardHeader>
      <CardContent>
        {charges.isPending ? (
          <SkeletonList rows={1} label="Loading charges" />
        ) : charges.isError ? (
          <ErrorState title="Couldn't load charges" onRetry={() => charges.refetch()} />
        ) : charge ? (
          <dl className="grid gap-1 text-sm">
            <dt className="sr-only">Charge</dt>
            <dd className="font-medium text-fg">
              {charge.description}: {formatMoney(charge.amountCents)}
            </dd>
            <dt className="sr-only">Status</dt>
            <dd className="flex items-center gap-2 text-fg-muted">
              <ChargeStatusBadge status={chargeStatus(charge)} />
              Due {formatDate(charge.dueAt, request.timeZone)}
            </dd>
          </dl>
        ) : can(user, "charge:create", request) ? (
          <ChargeDialog request={request} />
        ) : (
          <p className="text-sm text-fg-muted">No damage charge.</p>
        )}
      </CardContent>
    </Card>
  );
}

const formSchema = z.object({
  amount: z.string().refine((text) => parseMoney(text) !== null, "Enter an amount like 125.00."),
  description: damageChargeSchema.shape.description,
});

function ChargeDialog({ request }: { request: RequestDetail }) {
  const [open, setOpen] = useState(false);
  const create = useCreateDamageCharge(request.id, request.number);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: "", description: `Damage repair: ${request.title}`.slice(0, 120) },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          reset();
          create.reset();
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary">Charge resident</Button>
      </DialogTrigger>
      <DialogContent
        title={`Charge for ${request.number}`}
        description={`Added to ${request.people[request.residentId] ?? "the resident"}'s account, due in 14 days.`}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" form="charge-form" loading={create.isPending}>
              Add charge
            </Button>
          </>
        }
      >
        <form
          id="charge-form"
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit(({ amount, description }) => {
            const amountCents = parseMoney(amount) ?? 0;
            const checked = damageChargeSchema.shape.amountCents.safeParse(amountCents);
            if (!checked.success) {
              setError("amount", { message: checked.error.issues[0]?.message });
              return;
            }
            create.mutate({ amountCents, description }, { onSuccess: () => setOpen(false) });
          })}
        >
          <FormField label="Amount (USD)" required error={errors.amount?.message}>
            {(control) => (
              <Input {...control} {...register("amount")} inputMode="decimal" placeholder="0.00" />
            )}
          </FormField>
          <FormField label="What it's for" required error={errors.description?.message}>
            {(control) => <Input {...control} {...register("description")} maxLength={120} />}
          </FormField>
          {create.isError && !(create.error instanceof ApiError && create.error.status === 422) && (
            <p role="alert" className="text-sm font-medium text-danger">
              Couldn&apos;t add the charge. {create.error.message}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
