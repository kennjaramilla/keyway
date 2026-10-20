"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentSession } from "@/features/session/hooks";
import { can } from "@/lib/auth/permissions";
import { useWorkflowAction } from "../hooks/useRequest";
import { canStillReopen, TRANSITIONS, type RequestDetail } from "../schema";
import type { Run } from "./workflow/ActionDialog";
import { AssignDialog } from "./workflow/AssignDialog";
import { CancelDialog } from "./workflow/CancelDialog";
import { ReopenDialog } from "./workflow/ReopenDialog";
import { ResolveDialog } from "./workflow/ResolveDialog";
import { ScheduleDialog } from "./workflow/ScheduleDialog";
import { TriageDialog } from "./workflow/TriageDialog";

/** Next valid workflow steps for this request, from TRANSITIONS and can(). */
export function WorkflowActions({ request }: { request: RequestDetail }) {
  const { user } = useCurrentSession();
  const mutation = useWorkflowAction(request);
  const groupRef = useRef<HTMLDivElement>(null);

  const offered = TRANSITIONS[request.status]
    .map((transition) => transition.action)
    .filter(
      (action) =>
        (action !== "request:reopen" || canStillReopen(request)) && can(user, action, request),
    );
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
      {offered.includes("request:cancel") && <CancelDialog {...dialogProps} />}
      {offered.includes("request:reopen") && <ReopenDialog {...dialogProps} />}
    </div>
  );
}
