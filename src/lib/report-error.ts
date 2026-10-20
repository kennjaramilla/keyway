export type ErrorContext = {
  /** Which boundary caught it, e.g. "workspace" or "global". */
  boundary: string;
};

type Reporter = (error: unknown, context: ErrorContext) => void;

const logToConsole: Reporter = (error, { boundary }) =>
  console.error(`[keyway] ${boundary} error`, error);

let reporter: Reporter = logToConsole;

/** The one place caught errors go. Error tracking (e.g. Sentry) plugs in via setErrorReporter. */
export function reportError(error: unknown, context: ErrorContext) {
  reporter(error, context);
}

export function setErrorReporter(next: Reporter | null) {
  reporter = next ?? logToConsole;
}

/** Next's hash of a server error, shown so a user can quote it to support. */
export function errorDigest(error: unknown) {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" ? digest : undefined;
}
