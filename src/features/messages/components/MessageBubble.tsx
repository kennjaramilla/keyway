import { AlertCircle, Clock, RotateCw } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/auth/demo-users";
import { cn } from "@/lib/cn";
import type { DisplayMessage } from "../outbox";
import type { Participant } from "../schema";

const timeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export type MessageBubbleProps = {
  message: DisplayMessage;
  author: Participant;
  own: boolean;
  onRetry?: () => void;
};

/** One message: author, role and time, the body, and its delivery state for your own messages. */
export function MessageBubble({ message, author, own, onRetry }: MessageBubbleProps) {
  return (
    <li className={cn("flex gap-3", own && "flex-row-reverse")}>
      <Avatar name={author.name} size="sm" decorative />
      <div className={cn("flex max-w-[min(36rem,85%)] flex-col gap-1", own && "items-end")}>
        <p className="text-xs text-fg-muted">
          <span className="font-medium text-fg">{own ? "You" : author.name}</span>
          <span> · {ROLE_LABELS[author.role]} · </span>
          <time dateTime={message.createdAt}>{timeFormat.format(new Date(message.createdAt))}</time>
        </p>
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-sm break-words whitespace-pre-wrap",
            own ? "bg-primary-soft text-fg" : "border border-border bg-surface text-fg",
            message.status === "sending" && "opacity-70",
            message.status === "failed" && "border border-danger",
          )}
        >
          {message.body}
        </p>
        {message.status === "sending" && (
          <p className="flex items-center gap-1 text-xs text-fg-muted">
            <Clock aria-hidden className="size-3.5" />
            Sending…
          </p>
        )}
        {message.status === "failed" && (
          <p className="flex items-center gap-2 text-xs font-medium text-danger">
            <AlertCircle aria-hidden className="size-3.5" />
            Not sent
            {onRetry && (
              <Button variant="secondary" size="sm" onClick={onRetry}>
                <RotateCw aria-hidden />
                Retry
              </Button>
            )}
          </p>
        )}
      </div>
    </li>
  );
}
