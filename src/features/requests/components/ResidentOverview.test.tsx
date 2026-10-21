import { renderInWorkspace, screen, within } from "@/test/render";
import { ResidentOverview } from "./ResidentOverview";

describe("ResidentOverview", () => {
  it("greets the resident with their unit and request counts", async () => {
    renderInWorkspace(<ResidentOverview />, { as: "resident" });
    expect(await screen.findByRole("heading", { name: "Hi Amara" })).toBeInTheDocument();
    expect(screen.getByText("Harbor View Lofts · Unit 4B")).toBeInTheDocument();
    const stats = await screen.findByRole("list", { name: "Your requests at a glance" });
    expect(
      within(stats)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["3Open", "1Visit booked", "2Resolved"]);
  });

  it("links to the resident's main tasks", async () => {
    renderInWorkspace(<ResidentOverview />, { as: "resident" });
    const actions = await screen.findByRole("region", { name: "Quick actions" });
    expect(within(actions).getByRole("link", { name: "Report a problem" })).toHaveAttribute(
      "href",
      "/requests/new",
    );
    expect(within(actions).getByRole("link", { name: "Messages" })).toHaveAttribute(
      "href",
      "/messages",
    );
    expect(within(actions).getByRole("link", { name: "Pay rent" })).toHaveAttribute(
      "href",
      "/billing",
    );
    expect(within(actions).getByRole("link", { name: "House rules" })).toHaveAttribute(
      "href",
      "/house-rules",
    );
  });
});
