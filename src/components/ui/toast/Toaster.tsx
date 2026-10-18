"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";
import { useToastStore, type ToastTone } from "./toast-store";

const toneIcon = { neutral: Info, success: CheckCircle2, danger: XCircle } satisfies Record<
  ToastTone,
  unknown
>;
const toneClass: Record<ToastTone, string> = {
  neutral: "text-info",
  success: "text-success",
  danger: "text-danger",
};

/** Mount once near the root. Toasts are announced politely (danger: assertively). */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <ToastPrimitive.Provider swipeDirection="right" label="Notification">
      {toasts.map(({ id, title, description, tone = "neutral", action, durationMs }) => {
        const Icon = toneIcon[tone];
        return (
          <ToastPrimitive.Root
            key={id}
            type={tone === "danger" ? "foreground" : "background"}
            duration={durationMs ?? (action ? 8000 : 5000)}
            onOpenChange={(open) => !open && dismiss(id)}
            className="flex items-start gap-3 rounded-lg border border-border bg-surface-raised p-4 shadow-lg"
          >
            <Icon aria-hidden className={cn("mt-0.5 size-5 shrink-0", toneClass[tone])} />
            <div className="grid flex-1 gap-0.5">
              <ToastPrimitive.Title className="text-sm font-semibold text-fg">
                {title}
              </ToastPrimitive.Title>
              {description && (
                <ToastPrimitive.Description className="text-sm text-fg-muted">
                  {description}
                </ToastPrimitive.Description>
              )}
            </div>
            {action && (
              <ToastPrimitive.Action
                altText={action.label}
                onClick={action.onAction}
                className="rounded-md px-2 py-1 text-sm font-medium text-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-ring"
              >
                {action.label}
              </ToastPrimitive.Action>
            )}
            <ToastPrimitive.Close
              aria-label="Dismiss notification"
              className="rounded-sm p-0.5 text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X aria-hidden className="size-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className="fixed right-0 bottom-0 z-[60] flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
    </ToastPrimitive.Provider>
  );
}
