import {
  isOverdue,
  makeRequestCreateSchema,
  makeScheduleFormSchema,
  makeScheduleSchema,
  nextStatus,
  resolveSchema,
  STATUSES,
  TRANSITIONS,
  visitWindowIssues,
} from "./schema";

const today = "2026-10-19";
const base = {
  category: "electrical",
  urgency: "normal",
  title: "Exhaust fan rattles",
  description: "Loud rattle when the fan is on.",
  location: "bathroom",
  preferredWindows: [{ date: "2026-10-20", slot: "morning" }],
  permissionToEnter: true,
};
const create = makeRequestCreateSchema(today);
const errorPaths = (input: unknown) =>
  create.safeParse(input).error?.issues.map((issue) => issue.path.join(".")) ?? [];

describe("request create schema", () => {
  it("accepts a valid request and trims text", () => {
    const parsed = create.parse({ ...base, title: "  Exhaust fan rattles  " });
    expect(parsed.title).toBe("Exhaust fan rattles");
  });

  it("reports every missing field with plain messages", () => {
    const result = create.safeParse({
      urgency: "normal",
      title: "",
      description: "",
      preferredWindows: [],
    });
    const messages = Object.fromEntries(
      result.error!.issues.map((issue) => [issue.path.join("."), issue.message]),
    );
    expect(messages).toMatchObject({
      category: "Choose a category.",
      title: "Use at least 5 characters.",
      location: "Choose where in your unit.",
      permissionToEnter: "Choose yes or no.",
    });
  });

  it("needs 1-3 distinct windows in the next 14 days, unless it's an emergency", () => {
    expect(errorPaths({ ...base, preferredWindows: [] })).toEqual(["preferredWindows"]);
    expect(errorPaths({ ...base, urgency: "emergency", preferredWindows: [] })).toEqual([]);
    expect(errorPaths({ ...base, preferredWindows: [{ date: "", slot: "" }] })).toEqual([
      "preferredWindows",
    ]);
    expect(
      errorPaths({ ...base, preferredWindows: [{ date: "2026-10-18", slot: "morning" }] }),
    ).toEqual(["preferredWindows.0.date"]);
    expect(
      errorPaths({ ...base, preferredWindows: [{ date: "2026-11-02", slot: "morning" }] }),
    ).toEqual([]);
    expect(
      errorPaths({ ...base, preferredWindows: [{ date: "2026-11-03", slot: "morning" }] }),
    ).toEqual(["preferredWindows.0.date"]);
    const same = { date: "2026-10-20", slot: "morning" };
    expect(errorPaths({ ...base, preferredWindows: [same, same] })).toEqual(["preferredWindows"]);
    expect(errorPaths({ ...base, preferredWindows: [same, same, same, same] })).toContain(
      "preferredWindows",
    );
  });

  it("limits entry notes", () => {
    expect(errorPaths({ ...base, entryNotes: "x".repeat(201) })).toEqual(["entryNotes"]);
  });
});

describe("status machine", () => {
  it("has an entry for every status", () => {
    expect(Object.keys(TRANSITIONS).sort()).toEqual([...STATUSES].sort());
  });

  it("allows only the documented transitions", () => {
    expect(nextStatus("new", "request:triage")).toBe("triaged");
    expect(nextStatus("triaged", "request:schedule")).toBe("scheduled");
    expect(nextStatus("scheduled", "request:schedule")).toBe("scheduled");
    expect(nextStatus("scheduled", "request:start")).toBe("in_progress");
    expect(nextStatus("in_progress", "request:resolve")).toBe("resolved");
    expect(nextStatus("new", "request:start")).toBeNull();
    expect(nextStatus("triaged", "request:resolve")).toBeNull();
    expect(nextStatus("resolved", "request:triage")).toBeNull();
  });
});

describe("overdue", () => {
  const createdAt = "2026-10-19T00:00:00Z";
  it("is overdue after the urgency's SLA while open", () => {
    const at = (iso: string) => new Date(iso);
    expect(
      isOverdue({ createdAt, urgency: "emergency", status: "new" }, at("2026-10-19T23:59:00Z")),
    ).toBe(false);
    expect(
      isOverdue({ createdAt, urgency: "emergency", status: "new" }, at("2026-10-20T00:01:00Z")),
    ).toBe(true);
    expect(
      isOverdue({ createdAt, urgency: "high", status: "triaged" }, at("2026-10-22T00:01:00Z")),
    ).toBe(true);
    expect(
      isOverdue({ createdAt, urgency: "low", status: "triaged" }, at("2026-10-26T00:00:00Z")),
    ).toBe(false);
    expect(
      isOverdue({ createdAt, urgency: "high", status: "resolved" }, at("2026-12-01T00:00:00Z")),
    ).toBe(false);
  });
});

describe("visit window rules", () => {
  const ctx = {
    now: new Date("2026-10-19T14:00:00Z"),
    timeZone: "America/New_York",
    urgency: "normal",
  } as const;
  const issues = (start: string, end: string, overrides = {}) =>
    visitWindowIssues(new Date(start), new Date(end), { ...ctx, ...overrides }).map(
      (issue) => issue.message,
    );

  it("accepts a 2 hour window tomorrow morning", () => {
    expect(issues("2026-10-20T14:00:00Z", "2026-10-20T16:00:00Z")).toEqual([]);
  });

  it("rejects past, reversed, too long, too far and after-hours windows", () => {
    expect(issues("2026-10-19T13:00:00Z", "2026-10-19T15:00:00Z")).toContain(
      "Pick a start time in the future.",
    );
    expect(issues("2026-10-20T16:00:00Z", "2026-10-20T15:00:00Z")).toContain(
      "End the visit after it starts.",
    );
    expect(issues("2026-10-20T14:00:00Z", "2026-10-20T14:30:00Z")).toContain(
      "Visits must be 1 to 4 hours long.",
    );
    expect(issues("2026-10-20T14:00:00Z", "2026-10-20T19:00:00Z")).toContain(
      "Visits must be 1 to 4 hours long.",
    );
    expect(issues("2026-11-25T14:00:00Z", "2026-11-25T16:00:00Z")).toContain(
      "Pick a date in the next 30 days.",
    );
    expect(issues("2026-10-20T23:00:00Z", "2026-10-21T01:00:00Z")).toContain(
      "Book between 8:00 and 20:00 building time.",
    );
  });

  it("lets emergencies book after hours but not across midnight", () => {
    expect(
      issues("2026-10-20T01:00:00Z", "2026-10-20T03:00:00Z", { urgency: "emergency" }),
    ).toEqual([]);
    expect(
      issues("2026-10-20T03:00:00Z", "2026-10-20T05:00:00Z", { urgency: "emergency" }),
    ).toContain("Start and end on the same day.");
  });

  it("maps errors onto the API and form fields", () => {
    const api = makeScheduleSchema(ctx).safeParse({
      start: "2026-10-20T16:00:00Z",
      end: "2026-10-20T15:00:00Z",
    });
    expect(api.error?.issues[0]?.path).toEqual(["end"]);
    const form = makeScheduleFormSchema(ctx);
    expect(
      form.safeParse({ date: "2026-10-20", startTime: "07:00", endTime: "09:00" }).error?.issues[0]
        ?.path,
    ).toEqual(["startTime"]);
    expect(form.parse({ date: "2026-10-20", startTime: "10:00", endTime: "12:00" })).toEqual({
      start: "2026-10-20T14:00:00.000Z",
      end: "2026-10-20T16:00:00.000Z",
    });
  });
});

describe("resolve schema", () => {
  it("requires a short note", () => {
    expect(resolveSchema.safeParse({ resolutionNote: "  ok " }).success).toBe(false);
    expect(resolveSchema.safeParse({ resolutionNote: "Replaced the valve." }).success).toBe(true);
  });
});
