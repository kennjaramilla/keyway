import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-surface">
      <table className={cn("w-full border-collapse text-left text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("bg-surface-muted text-fg-muted", className)} {...props} />;
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn("divide-y divide-border", className)} {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("hover:bg-surface-muted/60", className)} {...props} />;
}

export function TableHead({ className, scope = "col", ...props }: ComponentProps<"th">) {
  return (
    <th
      scope={scope}
      className={cn("px-4 py-2.5 text-xs font-semibold tracking-wide uppercase", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 align-middle text-fg", className)} {...props} />;
}

export type SortDirection = "asc" | "desc";

export type SortableHeadProps = Omit<ComponentProps<"th">, "onClick"> & {
  /** Current direction if this column is the active sort, otherwise undefined. */
  direction?: SortDirection;
  onSort: () => void;
};

/** Column header with a sort button; exposes the state through aria-sort. */
export function SortableHead({
  direction,
  onSort,
  children,
  className,
  ...props
}: SortableHeadProps) {
  const Icon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <TableHead
      aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}
      className={cn("p-0", className)}
      {...props}
    >
      <button
        type="button"
        onClick={onSort}
        className="flex w-full items-center gap-1.5 px-4 py-2.5 text-xs font-semibold tracking-wide uppercase hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        {children}
        <Icon aria-hidden className={cn("size-3.5", !direction && "opacity-50")} />
      </button>
    </TableHead>
  );
}
