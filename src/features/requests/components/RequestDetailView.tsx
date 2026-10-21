"use client";

import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { MessageThread } from "@/features/messages/components/MessageThread";
import { useCurrentSession, useSwitchBuilding } from "@/features/session/hooks";
import { ApiError } from "@/lib/api-client";
import { roleCan } from "@/lib/auth/permissions";
import { formatDateTime } from "@/lib/datetime";
import { formatPreferredWindow, formatVisitWindow } from "../format";
import { useRequest } from "../hooks/useRequest";
import { CATEGORY_LABELS, dueAt, isOpenStatus, isOverdue, LOCATION_LABELS } from "../schema";
import { RequestStatusBadge, UrgencyBadge } from "./RequestStatusBadge";
import { RequestTimeline } from "./RequestTimeline";
import { WorkflowActions } from "./WorkflowActions";

const backLink = (
  <Link href="/requests" className={buttonVariants({ variant: "link", className: "mb-4" })}>
    <ArrowLeft aria-hidden />
    All requests
  </Link>
);

function Detail({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs font-medium tracking-wide text-fg-muted uppercase">{term}</dt>
      <dd className="text-sm text-fg">{children}</dd>
    </div>
  );
}

/** One request: details, workflow actions (coordinators) and the timeline. */
export function RequestDetailView({ id }: { id: string }) {
  const { user } = useCurrentSession();
  const request = useRequest(id);
  const { mutate: switchTo } = useSwitchBuilding();
  const requestBuilding = request.data?.buildingId;
  const checkedDeepLink = useRef<string | null>(null);

  // A deep link into another covered building switches to it once, so the header never lies.
  // Later switches are the user's choice (the switcher then leaves this page).
  useEffect(() => {
    if (!requestBuilding || checkedDeepLink.current === id) return;
    checkedDeepLink.current = id;
    if (user.role !== "resident" && requestBuilding !== user.activeBuildingId) {
      switchTo(requestBuilding);
    }
  }, [id, requestBuilding, user.role, user.activeBuildingId, switchTo]);

  if (request.isPending) {
    return (
      <>
        <PageHeader title="Request" />
        <SkeletonList rows={4} label="Loading request" />
      </>
    );
  }
  if (request.isError) {
    const missing = request.error instanceof ApiError && request.error.isNotFound;
    return (
      <>
        {backLink}
        <PageHeader title={missing ? "Request not found" : "Request"} />
        {missing ? (
          <EmptyState
            icon={<SearchX />}
            title="Request not found"
            description="It doesn't exist, or it isn't part of your unit or buildings."
          />
        ) : (
          <ErrorState
            title="Couldn't load this request"
            onRetry={() => request.refetch()}
            retrying={request.isRefetching}
          />
        )}
      </>
    );
  }

  const item = request.data;
  const overdue = isOverdue(item);
  return (
    <>
      {backLink}
      <PageHeader
        title={item.title}
        description={`${item.number} · Unit ${item.unitLabel} · ${CATEGORY_LABELS[item.category]}`}
        actions={<WorkflowActions request={item} />}
      />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="sr-only">Status:</span>
        <RequestStatusBadge status={item.status} />
        <span className="sr-only">Urgency:</span>
        <UrgencyBadge urgency={item.urgency} />
        {overdue && <StatusBadge tone="danger">Overdue</StatusBadge>}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-5 text-sm whitespace-pre-line text-fg">{item.description}</p>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail term="Location">{LOCATION_LABELS[item.location]}</Detail>
                <Detail term="Submitted">{formatDateTime(item.createdAt, item.timeZone)}</Detail>
                <Detail term="Due by">
                  {!isOpenStatus(item.status)
                    ? "—"
                    : formatDateTime(dueAt(item).toISOString(), item.timeZone)}
                  {overdue && " (overdue)"}
                </Detail>
                <Detail term="Permission to enter">{item.permissionToEnter ? "Yes" : "No"}</Detail>
                <Detail term="Preferred times">
                  {item.preferredWindows.length ? (
                    <ul>
                      {item.preferredWindows.map((window) => (
                        <li key={`${window.date}-${window.slot}`}>
                          {formatPreferredWindow(window)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "As soon as possible"
                  )}
                </Detail>
                <Detail term="Entry notes">{item.entryNotes || "None"}</Detail>
                <Detail term="Vendor">
                  {item.vendor ? `${item.vendor.name} · ${item.vendor.phone}` : "Not assigned yet"}
                </Detail>
                <Detail term="Visit">
                  {item.visitWindow
                    ? formatVisitWindow(item.visitWindow, item.timeZone)
                    : "Not scheduled yet"}
                </Detail>
                {item.resolvedAt && (
                  <Detail term="Resolved">{formatDateTime(item.resolvedAt, item.timeZone)}</Detail>
                )}
              </dl>
            </CardContent>
          </Card>
          {roleCan(user.role, "thread:view") && (
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <MessageThread conversationId={item.id} headingLevel={3} />
              </CardContent>
            </Card>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestTimeline request={item} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
