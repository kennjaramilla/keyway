import { addDays, localDate, localMinutes, localTime, zonedTimeToUtc } from "./time";

const NY = "America/New_York";

describe("building-local time", () => {
  it("converts wall time to UTC across daylight saving", () => {
    expect(zonedTimeToUtc("2026-10-20", "10:00", NY).toISOString()).toBe(
      "2026-10-20T14:00:00.000Z",
    );
    expect(zonedTimeToUtc("2026-12-01", "10:00", NY).toISOString()).toBe(
      "2026-12-01T15:00:00.000Z",
    );
  });

  it("reads local date, minutes and time", () => {
    const late = new Date("2026-10-20T02:30:00Z"); // 22:30 on the 19th in New York
    expect(localDate(late, NY)).toBe("2026-10-19");
    expect(localMinutes(late, NY)).toBe(22 * 60 + 30);
    expect(localTime(late, NY)).toBe("22:30");
  });

  it("adds whole days to a date", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
  });
});
