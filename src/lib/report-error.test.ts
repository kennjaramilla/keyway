import { errorDigest, reportError, setErrorReporter } from "./report-error";

describe("reportError", () => {
  afterEach(() => setErrorReporter(null));

  it("logs to the console by default", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("boom");
    reportError(error, { boundary: "workspace" });
    expect(log).toHaveBeenCalledWith("[keyway] workspace error", error);
  });

  it("sends errors to a reporter that's plugged in", () => {
    const reporter = vi.fn();
    setErrorReporter(reporter);
    reportError("oops", { boundary: "global" });
    expect(reporter).toHaveBeenCalledWith("oops", { boundary: "global" });
  });

  it("reads Next's digest only when it's a string", () => {
    expect(errorDigest(Object.assign(new Error("x"), { digest: "abc123" }))).toBe("abc123");
    expect(errorDigest(new Error("x"))).toBeUndefined();
    expect(errorDigest(null)).toBeUndefined();
    expect(errorDigest({ digest: 42 })).toBeUndefined();
  });
});
