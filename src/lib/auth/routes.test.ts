import {
  actionForPath,
  homePathFor,
  isPortfolioPath,
  pathAfterBuildingSwitch,
  safeNextPath,
} from "./routes";

describe("routes", () => {
  it.each([
    ["/requests", "request:list"],
    ["/requests/req_001", "request:list"],
    ["/requests/new", "request:create"],
    ["/messages", "thread:view"],
    ["/house-rules", "rules:ask"],
    ["/dashboard", "dashboard:view"],
    ["/dashboards", null],
    ["/forbidden", null],
  ])("%s requires %s", (path, action) => {
    expect(actionForPath(path)).toBe(action);
  });

  it("sends managers to the dashboard and everyone else to requests", () => {
    expect(homePathFor("manager")).toBe("/dashboard");
    expect(homePathFor("resident")).toBe("/requests");
  });

  describe("safeNextPath", () => {
    const origin = "https://keyway.test";

    it.each(["/\\evil.com", "//evil.com", "https://evil.com", "javascript:alert(1)"])(
      "rejects %s",
      (next) => {
        expect(safeNextPath(next, origin)).toBeNull();
      },
    );

    it("keeps a same-origin path with its query and hash", () => {
      expect(safeNextPath("/requests?status=new#top", origin)).toBe("/requests?status=new#top");
    });

    it("returns null when there is no next", () => {
      expect(safeNextPath(null, origin)).toBeNull();
    });
  });

  it.each([
    ["/requests/req_001", "/requests"],
    ["/messages/req_001", "/messages"],
    ["/requests", null],
    ["/requests/new", null],
    ["/house-rules", null],
  ])("after a building switch, %s goes to %s", (path, expected) => {
    expect(pathAfterBuildingSwitch(path)).toBe(expected);
  });

  it("treats only the dashboard as a portfolio page", () => {
    expect(isPortfolioPath("/dashboard")).toBe(true);
    expect(isPortfolioPath("/requests")).toBe(false);
  });
});
