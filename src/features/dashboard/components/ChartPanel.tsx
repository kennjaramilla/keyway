"use client";

import { BarChart3, Table2 } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/cn";

export type Bar = { label: string; value: number; display: string };
export type TableData = { columns: string[]; rows: { key: string; cells: ReactNode[] }[] };

/**
 * A titled horizontal bar chart with a text summary and a "Show table" toggle.
 * Every bar carries its value as text, so nothing depends on colour or length alone.
 */
export function ChartPanel({
  title,
  summary,
  bars,
  table,
  tone = "primary",
}: {
  title: string;
  summary: string;
  bars: Bar[];
  table: TableData;
  tone?: "primary" | "danger";
}) {
  const [asTable, setAsTable] = useState(false);
  const titleId = useId();
  const summaryId = useId();
  const max = Math.max(1, ...bars.map((bar) => bar.value));

  return (
    <Card aria-labelledby={titleId}>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="grid gap-1">
          <CardTitle id={titleId}>{title}</CardTitle>
          <CardDescription id={summaryId}>{summary}</CardDescription>
        </div>
        <Button
          variant="secondary"
          size="sm"
          aria-pressed={asTable}
          onClick={() => setAsTable(!asTable)}
        >
          {asTable ? <BarChart3 aria-hidden /> : <Table2 aria-hidden />}
          {asTable ? "Show chart" : "Show table"}
        </Button>
      </CardHeader>
      <CardContent>
        {asTable ? (
          // Focusable so keyboard users can scroll a wide table on small screens.
          <div
            role="region"
            aria-label={`${title} table`}
            tabIndex={0}
            className="overflow-x-auto rounded-lg border border-border focus-visible:outline-2 focus-visible:outline-ring"
          >
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">{title}</caption>
              <TableHeader>
                <TableRow>
                  {table.columns.map((column, index) => (
                    <TableHead key={column} className={cn(index > 0 && "text-right")}>
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map((row) => (
                  <TableRow key={row.key}>
                    {row.cells.map((cell, index) =>
                      index === 0 ? (
                        <TableHead
                          key={index}
                          scope="row"
                          className="text-sm font-medium tracking-normal text-fg normal-case"
                        >
                          {cell}
                        </TableHead>
                      ) : (
                        <TableCell key={index} className="text-right tabular-nums">
                          {cell}
                        </TableCell>
                      ),
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </table>
          </div>
        ) : (
          <figure aria-labelledby={titleId} aria-describedby={summaryId}>
            <ul className="grid gap-3">
              {bars.map((bar) => (
                <li
                  key={bar.label}
                  className="grid grid-cols-[minmax(7rem,10rem)_1fr_auto] items-center gap-3 text-sm"
                >
                  <span className="truncate text-fg">{bar.label}</span>
                  <span aria-hidden className="h-6 rounded-sm bg-surface-muted">
                    <span
                      className={cn(
                        "block h-full rounded-sm",
                        tone === "danger" ? "bg-danger" : "bg-primary",
                      )}
                      style={{ width: `${(bar.value / max) * 100}%` }}
                    />
                  </span>
                  <span className="min-w-16 text-right font-medium text-fg tabular-nums">
                    {bar.display}
                  </span>
                </li>
              ))}
            </ul>
          </figure>
        )}
      </CardContent>
    </Card>
  );
}
