"use client";

import type { ReactNode } from "react";
import { useCurrentSession } from "@/features/session/hooks";

/** "<title> · <building> · Keyway": the tenant is always visible in the tab. React hoists <title> into <head>. */
export function PageTitle({ title }: { title: string }) {
  const { activeBuilding } = useCurrentSession();
  return <title>{`${title} · ${activeBuilding.name} · Keyway`}</title>;
}

/** Page heading with the active building and an optional actions slot. Also sets the page title. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  const { activeBuilding } = useCurrentSession();
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <PageTitle title={title} />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-fg-muted">{activeBuilding.name}</p>
        <h1 className="text-2xl font-semibold text-fg">{title}</h1>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
