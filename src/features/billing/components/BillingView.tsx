"use client";

import { Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAccount } from "../hooks/useAccount";
import {
  CHARGE_KIND_LABELS,
  chargeStatus,
  formatMoney,
  PAYMENT_METHODS,
  type Charge,
} from "../schema";
import { ChargeStatusBadge } from "./ChargeStatusBadge";
import { PayDialog } from "./PayDialog";
import { Total } from "./Total";

/** Resident billing: balance, open charges with Pay now, and payment history. */
export function BillingView() {
  const { activeBuilding } = useCurrentSession();
  const account = useAccount();
  const date = (iso: string) => formatDate(iso, activeBuilding.timezone);

  if (account.isPending) return <SkeletonList rows={4} label="Loading billing" />;
  if (account.isError) {
    return (
      <ErrorState
        title="Couldn't load billing"
        onRetry={() => account.refetch()}
        retrying={account.isRefetching}
      />
    );
  }

  const { charges, payments, balanceCents, overdueCents } = account.data;
  const open = charges
    .filter((charge) => !charge.paidAt)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const nextDue = open[0];
  const chargeById = new Map(charges.map((charge) => [charge.id, charge] as const));
  const describe = (ids: string[]) =>
    ids
      .map((id) => chargeById.get(id)?.description)
      .filter(Boolean)
      .join(", ");

  return (
    <div className="grid grid-cols-1 gap-6">
      <dl aria-label="Account summary" className="grid gap-3 sm:grid-cols-3">
        <Total label="Balance due" value={formatMoney(balanceCents)} />
        <Total
          label="Overdue"
          value={formatMoney(overdueCents)}
          tone={overdueCents > 0 ? "danger" : undefined}
        />
        <Total label="Next due" value={nextDue ? date(nextDue.dueAt) : "Nothing due"} />
      </dl>

      <Card aria-labelledby="open-charges">
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle id="open-charges">Open charges</CardTitle>
            <CardDescription>A late fee applies 5 days after a missed due date.</CardDescription>
          </div>
          <PayDialog open={open} />
        </CardHeader>
        <CardContent>
          {open.length === 0 ? (
            <EmptyState
              icon={<Receipt />}
              title="You're all paid up"
              description="New charges show up here when they're posted."
              headingLevel={3}
            />
          ) : (
            <ChargeTable charges={open} caption="Open charges" date={date} />
          )}
        </CardContent>
      </Card>

      <Card aria-labelledby="payment-history">
        <CardHeader>
          <CardTitle id="payment-history">Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <EmptyState icon={<Receipt />} title="No payments yet" headingLevel={3} />
          ) : (
            <Table>
              <caption className="sr-only">Payment history</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>For</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap">{date(payment.createdAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">{payment.reference}</TableCell>
                    <TableCell>{describe(payment.chargeIds)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {PAYMENT_METHODS[payment.method]}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {formatMoney(payment.amountCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ChargeTable({
  charges,
  caption,
  date,
}: {
  charges: Charge[];
  caption: string;
  date: (iso: string) => string;
}) {
  return (
    <Table>
      <caption className="sr-only">{caption}</caption>
      <TableHeader>
        <TableRow>
          <TableHead>Charge</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Due</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {charges.map((charge) => (
          <TableRow key={charge.id}>
            <TableCell>{charge.description}</TableCell>
            <TableCell className="whitespace-nowrap">{CHARGE_KIND_LABELS[charge.kind]}</TableCell>
            <TableCell className="whitespace-nowrap">{date(charge.dueAt)}</TableCell>
            <TableCell>
              <ChargeStatusBadge status={chargeStatus(charge)} />
            </TableCell>
            <TableCell className="text-right whitespace-nowrap tabular-nums">
              {formatMoney(charge.amountCents)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
