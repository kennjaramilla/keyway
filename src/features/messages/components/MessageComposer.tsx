"use client";

import { Send } from "lucide-react";
import { useId, useRef, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MESSAGE_MAX_LENGTH } from "../schema";

const numberFormat = new Intl.NumberFormat();

export type MessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: (body: string) => void;
  label?: string;
};

/** Message box: Enter sends, Shift+Enter adds a new line. Focus stays in the box after sending. */
export function MessageComposer({
  value,
  onChange,
  onSend,
  label = "Write a message",
}: MessageComposerProps) {
  const id = useId();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const remaining = MESSAGE_MAX_LENGTH - value.length;
  const body = value.trim();

  function submit() {
    if (!body) return;
    onSend(body);
    textarea.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        ref={textarea}
        id={id}
        rows={3}
        value={value}
        maxLength={MESSAGE_MAX_LENGTH}
        aria-describedby={`${id}-hint`}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={`${id}-hint`} className="text-xs text-fg-muted">
          Enter to send, Shift+Enter for a new line ·{" "}
          <span className={remaining < 100 ? "font-medium text-warning" : undefined}>
            {numberFormat.format(remaining)} characters left
          </span>
        </p>
        <Button type="submit" disabled={!body}>
          <Send aria-hidden />
          Send
        </Button>
      </div>
    </form>
  );
}
