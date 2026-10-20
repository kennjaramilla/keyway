"use client";

import { ErrorScreen } from "@/components/errors/ErrorScreen";
import type { ErrorBoundaryProps } from "@/components/errors/RouteError";

export default function RootError(props: ErrorBoundaryProps) {
  return <ErrorScreen {...props} boundary="root" />;
}
