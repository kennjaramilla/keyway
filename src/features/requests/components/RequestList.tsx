"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonList } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRequests } from "../hooks/useRequests";
import { CATEGORY_LABELS, isOverdue } from "../schema";
import { RequestStatusBadge, UrgencyBadge } from "./RequestStatusBadge";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

/** Read-only list of requests in scope: the reference pattern for data views. */
export function RequestList() {
  const requests = useRequests();

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
    return (
      <EmptyState
        title="No requests yet"
        description="New maintenance requests will show up here."
      />
    );
  }

  return (
    <Table>
      <caption className="sr-only">Maintenance requests, newest first</caption>
      <TableHeader>
        <TableRow>
          <TableHead>Request</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Urgency</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.data.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <span className="block text-xs font-medium text-fg-muted">{request.number}</span>
              <span className="font-medium">{request.title}</span>
            </TableCell>
            <TableCell>{CATEGORY_LABELS[request.category]}</TableCell>
            <TableCell>
              <UrgencyBadge urgency={request.urgency} />
            </TableCell>
            <TableCell>
              <span className="flex flex-wrap gap-1">
                <RequestStatusBadge status={request.status} />
                {isOverdue(request) && (
                  <span className="text-xs font-medium text-danger">Overdue</span>
                )}
              </span>
            </TableCell>
            <TableCell>
              <time dateTime={request.createdAt}>
                {dateFormat.format(new Date(request.createdAt))}
              </time>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
