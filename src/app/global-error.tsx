"use client";

import { ErrorScreen } from "@/components/errors/ErrorScreen";
import type { ErrorBoundaryProps } from "@/components/errors/RouteError";
import { themeScript } from "@/components/theme/theme";
import "./globals.css";

/** Replaces the root layout when it crashes, so it brings its own document, styles and theme. */
export default function GlobalError(props: ErrorBoundaryProps) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ErrorScreen {...props} boundary="global" />
      </body>
    </html>
  );
}
