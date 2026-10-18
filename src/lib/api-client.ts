import { z } from "zod";

/** RFC 9457-style problem details returned by the (mock) API on errors. */
export const problemDetailsSchema = z.object({
  type: z.string().optional(),
  title: z.string(),
  status: z.number(),
  detail: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
    this.status = problem.status;
    this.problem = problem;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
};

export function buildUrl(path: string, query?: RequestOptions["query"]) {
  const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const url = new URL(`${BASE_URL}${path}`, origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = problemDetailsSchema.safeParse(body);
  if (parsed.success) return new ApiError(parsed.data);
  return new ApiError({ title: response.statusText || "Request failed", status: response.status });
}

/**
 * Typed fetch: every response is parsed with the given Zod schema, so a
 * contract drift fails loudly here instead of deep inside a component.
 */
export async function apiRequest<S extends z.ZodType>(
  path: string,
  schema: S,
  { method = "GET", body, query, signal }: RequestOptions = {},
): Promise<z.infer<S>> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal,
      credentials: "same-origin",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError({
      title: "Network error",
      status: 0,
      detail: "Check your connection and try again.",
    });
  }

  if (!response.ok) throw await toApiError(response);

  const data: unknown = response.status === 204 ? null : await response.json();
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError({
      title: "Unexpected response",
      status: 502,
      detail: `Response for ${method} ${path} did not match the expected shape.`,
    });
  }
  return parsed.data;
}

export const api = {
  get: <S extends z.ZodType>(
    path: string,
    schema: S,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => apiRequest(path, schema, { ...options, method: "GET" }),
  post: <S extends z.ZodType>(path: string, schema: S, body?: unknown) =>
    apiRequest(path, schema, { method: "POST", body }),
  patch: <S extends z.ZodType>(path: string, schema: S, body?: unknown) =>
    apiRequest(path, schema, { method: "PATCH", body }),
  put: <S extends z.ZodType>(path: string, schema: S, body?: unknown) =>
    apiRequest(path, schema, { method: "PUT", body }),
  delete: <S extends z.ZodType>(path: string, schema: S) =>
    apiRequest(path, schema, { method: "DELETE" }),
};
