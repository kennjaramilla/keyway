import { WORKSPACE_STORAGE_KEY } from "@/stores/workspace-store";
import { resolveTheme, themeScript } from "./theme";

describe("theme", () => {
  it("reads the same storage key as the workspace store", () => {
    expect(themeScript).toContain(`localStorage.getItem(${JSON.stringify(WORKSPACE_STORAGE_KEY)})`);
  });

  it.each([
    ["dark", false, "dark"],
    ["light", true, "light"],
    ["system", true, "dark"],
    ["system", false, "light"],
  ] as const)("resolves %s (prefers dark: %s) to %s", (preference, prefersDark, expected) => {
    expect(resolveTheme(preference, prefersDark)).toBe(expected);
  });

  it("applies the saved preference before paint", () => {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify({ state: { theme: "dark" } }));
    new Function(themeScript)();
    expect(document.documentElement.dataset.theme).toBe("dark");
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    delete document.documentElement.dataset.theme;
  });
});
