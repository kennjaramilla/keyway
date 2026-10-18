/**
 * Demo error toggle: `?fail=messages` on page load makes the next matching
 * mock call fail once (docs/spec/data-model.md), to show rollback.
 */
const armed = new Set<string>();

export function armFailure(name: string) {
  armed.add(name);
}

/** True (and disarmed) if a failure was armed for this name. */
export function consumeFailure(name: string) {
  return armed.delete(name);
}

export function armFailuresFromUrl(url: URL) {
  for (const value of url.searchParams.getAll("fail")) {
    value.split(",").forEach((name) => name && armFailure(name.trim()));
  }
}
