import { renderInWorkspace, screen, within } from "@/test/render";
import { RequestList } from "./RequestList";

// Pretend every media query matches, so the list renders its phone layout.
function mockPhone() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: true,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe("RequestList on phones", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/requests");
    mockPhone();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows one card per request instead of a table", async () => {
    renderInWorkspace(<RequestList />, { as: "coordinator" });
    const list = await screen.findByRole("list", { name: "Maintenance requests" });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(within(list).getAllByRole("listitem")).toHaveLength(7);
    const card = within(list).getByRole("link", { name: "Fob not opening the garage gate" });
    expect(card).toHaveAttribute("href", "/requests/req_014");
    expect(card.closest("li")).toHaveTextContent(/Overdue/);
  });

  it("keeps filters behind a toggle", async () => {
    const { user } = renderInWorkspace(<RequestList />, { as: "coordinator" });
    const toggle = await screen.findByRole("button", { name: "Filters" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("search")).not.toBeInTheDocument();

    await user.click(toggle);
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "garage");
    expect(screen.getByText("Showing 1 of 10 requests")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide filters" }));
    expect(screen.getByRole("button", { name: "Filters (on)" })).toBeInTheDocument();
  });
});
