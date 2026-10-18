import { decodeSession, encodeSession } from "./demo-users";

describe("session cookie encoding", () => {
  it("round-trips a session", () => {
    const session = { role: "coordinator", userId: "user-coordinator-1" } as const;
    expect(decodeSession(encodeSession(session))).toEqual(session);
  });

  it("accepts a URL-encoded value", () => {
    expect(decodeSession(encodeURIComponent("resident.user-resident-1"))).toEqual({
      role: "resident",
      userId: "user-resident-1",
    });
  });

  it.each([undefined, null, "", "admin.user-1", "resident", "resident."])("rejects %s", (value) => {
    expect(decodeSession(value)).toBeNull();
  });
});
