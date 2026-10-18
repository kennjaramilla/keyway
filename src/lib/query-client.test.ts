import { ApiError } from "./api-client";
import { makeQueryClient } from "./query-client";

describe("query client", () => {
  const retry = makeQueryClient().getDefaultOptions().queries?.retry as (
    count: number,
    error: unknown,
  ) => boolean;

  it("never retries client errors", () => {
    expect(retry(0, new ApiError({ title: "Forbidden", status: 403 }))).toBe(false);
  });

  it("retries server and network errors twice", () => {
    const error = new ApiError({ title: "Server error", status: 500 });
    expect(retry(0, error)).toBe(true);
    expect(retry(1, error)).toBe(true);
    expect(retry(2, error)).toBe(false);
    expect(retry(0, new TypeError("boom"))).toBe(true);
  });
});
