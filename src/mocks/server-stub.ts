// The SSR bundle can't resolve msw/browser (it has no Node export). The worker
// only ever starts in the browser, so server builds get this stub (next.config.ts).
export function setupWorker(): never {
  throw new Error("msw/browser is only available in the browser");
}
