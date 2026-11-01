import { act, renderHook } from "@testing-library/react";
import { mockRouter } from "@/test/next-navigation";
import { useDashboardRange } from "./useDashboard";

const at = (search: string) => window.history.replaceState(null, "", `/dashboard${search}`);

describe("useDashboardRange", () => {
  afterEach(() => at(""));

  it("reads the range from ?days and falls back to 7 days", () => {
    at("?days=14");
    expect(renderHook(() => useDashboardRange()).result.current[0]).toBe(14);
    at("?days=99");
    expect(renderHook(() => useDashboardRange()).result.current[0]).toBe(7);
  });

  it("writes the range to the URL, leaving it clean for the default", () => {
    const { result } = renderHook(() => useDashboardRange());
    act(() => result.current[1](30));
    expect(mockRouter.replace).toHaveBeenLastCalledWith("/dashboard?days=30", { scroll: false });
    act(() => result.current[1](7));
    expect(mockRouter.replace).toHaveBeenLastCalledWith("/dashboard", { scroll: false });
  });
});
