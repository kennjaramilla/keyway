import { actionForPath, homePathFor } from "./routes";

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
});
