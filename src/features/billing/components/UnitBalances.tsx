"use client";

import { Receipt } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
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
import { useCurrentSession } from "@/features/session/hooks";
import { formatDate } from "@/lib/datetime";
import { useUnitBalances } from "../hooks/useStaffBilling";
import { formatMoney } from "../schema";
import { Total } from "./Total";

/** Staff: what each unit in the active building owes, most overdue first. */
export function UnitBalances() {
  const { activeBuilding } = useCurrentSession();
  const balances = useUnitBalances();

  if (balances.isPending) return <SkeletonList rows={4} label="Loading balances" />;
  if (balances.isError) {
    return (
      <ErrorState
        title="Couldn't load balances"
        onRetry={() => balances.refetch()}
        retrying={balances.isRefetching}
      />
    );
  }
  if (balances.data.length === 0) {
    return (
      <EmptyState
        icon={<Receipt />}
        title={`No residents in ${activeBuilding.name}`}
        description="Balances show up here once units are occupied."
      />
    );
  }

  const rows = balances.data;
  const total = (pick: (row: (typeof rows)[number]) => number) =>
    rows.reduce((sum, row) => sum + pick(row), 0);
  const unitsOverdue = rows.filter((row) => row.overdueCents > 0).length;

  return (
    <div className="grid grid-cols-1 gap-6">
      <dl aria-label="Building totals" className="grid gap-3 sm:grid-cols-3">
        <Total label="Outstanding" value={formatMoney(total((row) => row.balanceCents))} />
        <Total
          label="Overdue"
          value={formatMoney(total((row) => row.overdueCents))}
          tone={unitsOverdue > 0 ? "danger" : undefined}
        />
        <Total label="Units overdue" value={`${unitsOverdue} of ${rows.length}`} />
      </dl>
      <Table>
        <caption className="sr-only">Unit balances in {activeBuilding.name}</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Unit</TableHead>
            <TableHead>Resident</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Open charges</TableHead>
            <TableHead className="text-right">Overdue</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Last payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.residentId}>
              <TableHead
                scope="row"
                className="text-sm font-medium tracking-normal text-fg normal-case"
              >
                {row.unitLabel}
              </TableHead>
              <TableCell className="whitespace-nowrap">{row.residentName}</TableCell>
              <TableCell>
                {row.overdueCents > 0 ? (
                  <StatusBadge tone="danger">Overdue</StatusBadge>
                ) : row.balanceCents > 0 ? (
                  <StatusBadge tone="warning">Balance due</StatusBadge>
                ) : (
                  <StatusBadge tone="success">Paid up</StatusBadge>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.openCount}</TableCell>
              <TableCell className="text-right whitespace-nowrap tabular-nums">
                {formatMoney(row.overdueCents)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap tabular-nums">
                {formatMoney(row.balanceCents)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {row.lastPaymentAt
                  ? formatDate(row.lastPaymentAt, activeBuilding.timezone)
                  : "None"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
