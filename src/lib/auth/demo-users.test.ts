import { decodeSession, encodeSession } from "./demo-users";

describe("session cookie encoding", () => {
  const session = {
    role: "coordinator",
    userId: "usr_coord_grace",
    activeBuildingId: "bld_maple",
  } as const;

  it("round-trips a session", () => {
    expect(decodeSession(encodeSession(session))).toEqual(session);
  });

  it("accepts a URL-encoded value", () => {
    expect(decodeSession(encodeURIComponent(encodeSession(session)))).toEqual(session);
  });

  it.each([
    undefined,
    null,
    "",
    "admin.usr_x.bld_x",
    "resident",
    "resident.usr_x",
    "resident.usr_x.bld_x.extra",
  ])("rejects %s", (value) => {
    expect(decodeSession(value)).toBeNull();
  });
});
