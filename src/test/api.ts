/** Resolves to 200 on success or the ApiError's status, for compact handler assertions. */
export const statusOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 200,
    (error: { status: number }) => error.status,
  );

/** POST a raw (possibly malformed) body to the mock API. */
export const postRaw = (path: string, body: string, method = "POST") =>
  fetch(`http://localhost/api${path}`, {
    method,
    credentials: "include",
    headers: { "content-type": "application/json" },
    body,
  });
