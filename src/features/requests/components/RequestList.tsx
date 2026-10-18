"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SkeletonList } from "@/components/ui/skeleton";
import {
  SortableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentSession } from "@/features/session/hooks";
import { can } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/datetime";
import { formatAge, formatVisitWindow } from "../format";
import { useRequests } from "../hooks/useRequests";
import {
  applyQueue,
  defaultQueue,
  isUnfiltered,
  parseQueue,
  serializeQueue,
  toggleSort,
  type QueueState,
  type SortKey,
} from "../queue";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  isOverdue,
  STATUS_LABELS,
  STATUSES,
  URGENCIES,
  URGENCY_LABELS,
  type RequestListItem,
} from "../schema";
import { RequestStatusBadge, UrgencyBadge } from "./RequestStatusBadge";

/** "+ New request" for residents; renders nothing for other roles. */
export function NewRequestButton() {
  const { user } = useCurrentSession();
  if (!can(user, "request:create")) return null;
  return (
    <Link href="/requests/new" className={buttonVariants()}>
      <Plus aria-hidden />
      New request
    </Link>
  );
}

/** Requests in scope with filters, search and sorting kept in the URL. Residents see their unit only. */
export function RequestList() {
  const { user, activeBuilding } = useCurrentSession();
  const requests = useRequests();
  const searchParams = useSearchParams();
  const base = useMemo(() => defaultQueue(user.role), [user.role]);
  const [state, setState] = useState(() => parseQueue(new URLSearchParams(searchParams), base));
  const staff = user.role !== "resident";

  const update = (next: QueueState) => {
    setState(next);
    const query = serializeQueue(next, base);
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  };

  const visible = useMemo(
    () => (requests.data ? applyQueue(requests.data, state) : []),
    [requests.data, state],
  );

  if (requests.isPending) return <SkeletonList rows={5} label="Loading requests" />;
  if (requests.isError) {
    return (
      <ErrorState
        title="Couldn't load requests"
        onRetry={() => requests.refetch()}
        retrying={requests.isRefetching}
      />
    );
  }
  if (requests.data.length === 0) {
    return staff ? (
      <EmptyState
        title={`No requests in ${activeBuilding.name}`}
        description="New maintenance requests from residents will show up here."
      />
    ) : (
      <EmptyState
        title="You haven't reported anything yet"
        description="Tell us what needs fixing and we'll take it from there."
        action={<NewRequestButton />}
      />
    );
  }

  const sortDirection = (key: SortKey) => (state.sort === key ? state.dir : undefined);
  const showingOpenOnly = isUnfiltered(state, base) && !state.statuses.includes("resolved");

  return (
    <div className="grid gap-4">
      <QueueFilters state={state} onChange={update} onReset={() => update(base)} base={base} />
      <p aria-live="polite" className="text-sm text-fg-muted">
        Showing {visible.length} of {requests.data.length} requests
      </p>
      {visible.length === 0 ? (
        <EmptyState
          title={
            showingOpenOnly
              ? `No open requests in ${activeBuilding.name}`
              : "No requests match these filters"
          }
          description="Try different filters, or clear them to see everything."
          action={
            showingOpenOnly ? (
              <Button
                variant="secondary"
                onClick={() => update({ ...state, statuses: [...STATUSES] })}
              >
                Show resolved
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => update(base)}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <Table>
          <caption className="sr-only">Maintenance requests</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Request</TableHead>
              {staff && <TableHead>Unit</TableHead>}
              {staff && <TableHead>Category</TableHead>}
              <SortableHead
                direction={sortDirection("urgency")}
                onSort={() => update(toggleSort(state, "urgency"))}
              >
                Urgency
              </SortableHead>
              <TableHead>Status</TableHead>
              <SortableHead
                direction={sortDirection("age")}
                onSort={() => update(toggleSort(state, "age"))}
              >
                {staff ? "Age" : "Created"}
              </SortableHead>
              {staff ? (
                <SortableHead
                  direction={sortDirection("updated")}
                  onSort={() => update(toggleSort(state, "updated"))}
                >
                  Last updated
                </SortableHead>
              ) : (
                <TableHead>Next visit</TableHead>
              )}
              {staff && <TableHead>Vendor</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                staff={staff}
                timeZone={activeBuilding.timezone}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function RequestRow({
  request,
  staff,
  timeZone,
}: {
  request: RequestListItem;
  staff: boolean;
  timeZone: string;
}) {
  return (
    <TableRow>
      <TableCell>
        <span className="block text-xs font-medium text-fg-muted">{request.number}</span>
        <Link
          href={`/requests/${request.id}`}
          className="rounded-sm font-medium text-fg underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {request.title}
        </Link>
      </TableCell>
      {staff && <TableCell>{request.unitLabel}</TableCell>}
      {staff && <TableCell>{CATEGORY_LABELS[request.category]}</TableCell>}
      <TableCell>
        <UrgencyBadge urgency={request.urgency} />
      </TableCell>
      <TableCell>
        <span className="flex flex-wrap gap-1">
          <RequestStatusBadge status={request.status} />
          {isOverdue(request) && <StatusBadge tone="danger">Overdue</StatusBadge>}
        </span>
      </TableCell>
      <TableCell>
        <time dateTime={request.createdAt}>
          {staff ? formatAge(request.createdAt) : formatDate(request.createdAt, timeZone)}
        </time>
      </TableCell>
      {staff ? (
        <TableCell>
          <time dateTime={request.updatedAt}>{formatDate(request.updatedAt, timeZone)}</time>
        </TableCell>
      ) : (
        <TableCell>
          {request.visitWindow && request.status === "scheduled"
            ? formatVisitWindow(request.visitWindow, timeZone)
            : "None"}
        </TableCell>
      )}
      {staff && <TableCell>{request.vendorName ?? "Unassigned"}</TableCell>}
    </TableRow>
  );
}

function QueueFilters({
  state,
  base,
  onChange,
  onReset,
}: {
  state: QueueState;
  base: QueueState;
  onChange: (state: QueueState) => void;
  onReset: () => void;
}) {
  const toggleStatus = (status: (typeof STATUSES)[number], checked: boolean) =>
    onChange({
      ...state,
      statuses: checked
        ? [...state.statuses, status]
        : state.statuses.filter((value) => value !== status),
    });

  return (
    <div
      role="search"
      aria-label="Filter requests"
      className="grid gap-4 rounded-lg border border-border bg-surface p-4"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Search">
          {(control) => (
            <Input
              {...control}
              type="search"
              placeholder="Number, title, unit or vendor"
              value={state.q}
              onChange={(event) => onChange({ ...state, q: event.target.value })}
            />
          )}
        </FormField>
        <FormField label="Urgency">
          {(control) => (
            <Select
              {...control}
              value={state.urgency}
              onChange={(event) => onChange({ ...state, urgency: event.target.value })}
              placeholder="All urgencies"
              options={URGENCIES.map((value) => ({ value, label: URGENCY_LABELS[value] }))}
            />
          )}
        </FormField>
        <FormField label="Category">
          {(control) => (
            <Select
              {...control}
              value={state.category}
              onChange={(event) => onChange({ ...state, category: event.target.value })}
              placeholder="All categories"
              options={CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] }))}
            />
          )}
        </FormField>
      </div>
      <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <legend className="mb-2 text-sm font-medium text-fg">Status</legend>
        {STATUSES.map((status) => (
          <Checkbox
            key={status}
            label={STATUS_LABELS[status]}
            checked={state.statuses.includes(status)}
            onCheckedChange={(checked) => toggleStatus(status, checked === true)}
          />
        ))}
        {!isUnfiltered(state, base) && (
          <Button variant="link" size="sm" onClick={onReset}>
            Clear filters
          </Button>
        )}
      </fieldset>
    </div>
  );
}
