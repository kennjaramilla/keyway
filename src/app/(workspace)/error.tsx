"use client";

import { RouteError, type ErrorBoundaryProps } from "@/components/errors/RouteError";

export default function WorkspaceError(props: ErrorBoundaryProps) {
  return <RouteError {...props} />;
}
