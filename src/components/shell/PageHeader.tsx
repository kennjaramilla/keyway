"use client";

import type { ReactNode } from "react";
import { useCurrentSession } from "@/features/session/hooks";

/** "building" shows the active building; "portfolio" is for views that span every building. */
export type PageScope = "building" | "portfolio";

function useScopeLabel(scope: PageScope) {
  const { activeBuilding } = useCurrentSession();
  return scope === "portfolio" ? "All buildings" : activeBuilding.name;
}

/** "<title> · <scope> · Keyway": the tenant is always visible in the tab. React hoists <title> into <head>. */
export function PageTitle({ title, scope = "building" }: { title: string; scope?: PageScope }) {
  return <title>{`${title} · ${useScopeLabel(scope)} · Keyway`}</title>;
}

/** Page heading with the active building and an optional actions slot. Also sets the page title. */
export function PageHeader({
  title,
  description,
  actions,
  scope = "building",
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  scope?: PageScope;
}) {
  const scopeLabel = useScopeLabel(scope);
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <PageTitle title={title} scope={scope} />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-fg-muted">{scopeLabel}</p>
        <h1 className="text-2xl font-semibold text-fg">{title}</h1>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
