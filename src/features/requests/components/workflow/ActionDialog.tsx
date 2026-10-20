"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { WorkflowInput } from "../../api";
import type { RequestDetail } from "../../schema";

export type Run = (input: WorkflowInput) => void;

/** What every workflow dialog gets from WorkflowActions. */
export type DialogProps = {
  request: RequestDetail;
  run: Run;
  disabled: boolean;
  onFinished: () => void;
};

/** Dialog shell: after a submit it closes and moves focus to the actions group, since the trigger may vanish. */
export function ActionDialog({
  label,
  title,
  description,
  variant = "primary",
  disabled,
  hint,
  formId,
  submitLabel,
  submitVariant = "primary",
  closeLabel = "Cancel",
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
  submitVariant?: "primary" | "danger";
  closeLabel?: string;
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
              <Button variant="secondary">{closeLabel}</Button>
            </DialogClose>
            <Button type="submit" form={formId} variant={submitVariant}>
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
