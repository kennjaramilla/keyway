"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Fieldset } from "@/components/ui/form-field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCurrentSession } from "@/features/session/hooks";
import { formatDate } from "@/lib/datetime";
import { usePayment } from "../hooks/useAccount";
import { formatMoney, PAYMENT_METHODS, type Charge, type PaymentMethod } from "../schema";

/** Choose open charges and a saved method, then pay. Everything open is selected to start. */
export function PayDialog({ open: openCharges }: { open: Charge[] }) {
  const { activeBuilding } = useCurrentSession();
  const pay = usePayment();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [error, setError] = useState<string | null>(null);

  const total = openCharges
    .filter((charge) => selected.includes(charge.id))
    .reduce((sum, charge) => sum + charge.amountCents, 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setSelected(openCharges.map((charge) => charge.id));
          setError(null);
          pay.reset();
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={openCharges.length === 0}>Pay now</Button>
      </DialogTrigger>
      <DialogContent
        title="Make a payment"
        description="Demo only: no money moves and no card details are collected."
        footer={
          <>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" form="pay-form" loading={pay.isPending}>
              {pay.isPending ? "Paying…" : `Pay ${formatMoney(total)}`}
            </Button>
          </>
        }
      >
        <form
          id="pay-form"
          noValidate
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (selected.length === 0) {
              setError("Choose at least one charge to pay.");
              return;
            }
            pay.mutate({ chargeIds: selected, method }, { onSuccess: () => setOpen(false) });
          }}
        >
          <Fieldset legend="Charges" required error={error ?? undefined}>
            <div className="grid gap-3">
              {openCharges.map((charge) => (
                <Checkbox
                  key={charge.id}
                  label={`${charge.description}: ${formatMoney(charge.amountCents)}`}
                  description={`Due ${formatDate(charge.dueAt, activeBuilding.timezone)}`}
                  checked={selected.includes(charge.id)}
                  onCheckedChange={(checked) => {
                    setError(null);
                    setSelected((current) =>
                      checked === true
                        ? [...current, charge.id]
                        : current.filter((id) => id !== charge.id),
                    );
                  }}
                />
              ))}
            </div>
          </Fieldset>
          <Fieldset legend="Pay with" required>
            <RadioGroup value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
              {(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((key) => (
                <RadioGroupItem key={key} value={key} label={PAYMENT_METHODS[key]} />
              ))}
            </RadioGroup>
          </Fieldset>
          {pay.isError && (
            <p role="alert" className="text-sm font-medium text-danger">
              Payment didn&apos;t go through. {pay.error.message}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
