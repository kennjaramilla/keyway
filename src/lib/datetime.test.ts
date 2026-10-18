import { formatDate, formatDateTime } from "./datetime";

describe("datetime", () => {
  it("formats in the building's time zone with its abbreviation, not the viewer's", () => {
    // 01:30 UTC on Oct 20 is still Oct 19 in New York (EDT, UTC-4).
    expect(formatDateTime("2026-10-20T01:30:00Z", "America/New_York")).toBe(
      "Oct 19, 2026, 9:30 PM EDT",
    );
    expect(formatDate("2026-10-20T01:30:00Z", "America/New_York")).toBe("Oct 19, 2026");
    expect(formatDateTime("2026-12-01T15:00:00Z", "America/New_York")).toContain("EST");
  });
});
