/** A labelled money or count tile, inside a <dl>. */
export function Total({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 shadow-sm">
      <dt className="text-sm text-fg-muted">{label}</dt>
      <dd
        className={
          tone === "danger"
            ? "text-2xl font-semibold text-danger tabular-nums"
            : "text-2xl font-semibold tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}
