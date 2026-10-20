import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows the limit per window, then says how long to wait", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    expect(limiter.take("amara", 0).ok).toBe(true);
    expect(limiter.take("amara", 10_000).ok).toBe(true);
    expect(limiter.take("amara", 20_000)).toEqual({ ok: false, retryAfter: 40 });
    expect(limiter.take("grace", 20_000).ok).toBe(true);
  });

  it("frees a slot as old hits leave the window", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    limiter.take("amara", 0);
    limiter.take("amara", 10_000);
    expect(limiter.take("amara", 60_000).ok).toBe(true);
    expect(limiter.take("amara", 60_001).ok).toBe(false);
    limiter.reset();
    expect(limiter.take("amara", 60_002).ok).toBe(true);
  });
});
