import { http, HttpResponse } from "msw";
import { readSessionCookie } from "@/lib/auth/session-cookie";
import { getDb, updateDb } from "@/mocks/db";
import { server } from "@/mocks/node";
import { mockRouter, navigationState } from "@/test/next-navigation";
import { renderInWorkspace, renderWithProviders, screen, within } from "@/test/render";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { PageHeader } from "./PageHeader";
import { markFirstRenderDone } from "./route-focus";
import { WorkspaceShell } from "./WorkspaceShell";

const Page = () => <PageHeader title="Requests" />;

async function navLinks() {
  const nav = await screen.findByRole("navigation", { name: "Main" });
  return within(nav)
    .getAllByRole("link")
    .map((link) => link.textContent);
}

describe("WorkspaceShell", () => {
  it.each([
    ["resident", ["Requests", "Messages", "House rules"]],
    ["coordinator", ["Requests", "Messages", "House rules"]],
    ["manager", ["Dashboard", "Requests", "House rules"]],
  ])("shows the %s only the pages their role can open", async (role, expected) => {
    renderInWorkspace(<Page />, { as: role });
    expect(await navLinks()).toEqual(expected);
  });

  it("marks the current page and offers a skip link", async () => {
    renderInWorkspace(<Page />);
    expect(await screen.findByRole("link", { name: "Requests" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute(
      "href",
      "#main",
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  it("puts the page and building in the heading and document title", async () => {
    renderInWorkspace(<Page />, { as: "coordinator", buildingId: "bld_maple" });
    expect(await screen.findByRole("heading", { level: 1, name: "Requests" })).toBeInTheDocument();
    expect(document.title).toBe("Requests · Maple Court · Keyway");
  });

  it("labels a portfolio page with all buildings", async () => {
    renderInWorkspace(<PageHeader title="Dashboard" scope="portfolio" />, { as: "manager" });
    expect(await screen.findByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("All buildings")).toBeInTheDocument();
    expect(document.title).toBe("Dashboard · All buildings · Keyway");
  });

  it("shows a resident their building and unit as static text", async () => {
    renderInWorkspace(<Page />);
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByText("· Unit 4B")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /switch building/i })).not.toBeInTheDocument();
  });

  it("does not offer a switcher to a coordinator with one building", async () => {
    renderInWorkspace(<Page />, { as: "usr_coord_theo" });
    await screen.findByRole("heading", { level: 1 });
    expect(screen.queryByRole("button", { name: /switch building/i })).not.toBeInTheDocument();
  });

  it("switches building, announces it and updates the title", async () => {
    const { user } = renderInWorkspace(<Page />, { as: "coordinator" });
    await user.click(
      await screen.findByRole("button", { name: /Harbor View Lofts\. Switch building/ }),
    );
    const menu = screen.getByRole("menu");
    expect(
      within(menu)
        .getAllByRole("menuitemradio")
        .map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining("Harbor View Lofts"),
      expect.stringContaining("Maple Court"),
    ]);
    await user.click(within(menu).getByRole("menuitemradio", { name: /Maple Court/ }));

    expect(await screen.findByText("Switched to Maple Court")).toBeInTheDocument();
    expect(readSessionCookie()?.activeBuildingId).toBe("bld_maple");
    expect(document.title).toBe("Requests · Maple Court · Keyway");
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("leaves a request page for the new building's queue after switching", async () => {
    navigationState.pathname = "/requests/req_030";
    const { user } = renderInWorkspace(<Page />, { as: "coordinator" });
    await user.click(await screen.findByRole("button", { name: /Switch building/ }));
    await user.click(screen.getByRole("menuitemradio", { name: /Maple Court/ }));
    await vi.waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/requests"));
  });

  it("shows all buildings instead of the switcher on the dashboard", async () => {
    navigationState.pathname = "/dashboard";
    renderInWorkspace(<Page />, { as: "manager" });
    expect(await screen.findByText("All buildings")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Switch building/ })).not.toBeInTheDocument();
  });

  it("moves focus to the new page's heading after a client-side navigation", async () => {
    const { rerender } = renderInWorkspace(<Page />);
    await screen.findByRole("heading", { level: 1, name: "Requests" });
    expect(document.body).toHaveFocus();

    markFirstRenderDone();
    navigationState.pathname = "/house-rules";
    rerender(
      <WorkspaceShell>
        <PageHeader title="House rules" />
      </WorkspaceShell>,
    );
    const heading = screen.getByRole("heading", { level: 1, name: "House rules" });
    await vi.waitFor(() => expect(heading).toHaveFocus());
  });

  it("signs out", async () => {
    const { user } = renderInWorkspace(<Page />);
    await user.click(await screen.findByRole("button", { name: /^Amara Okafor/ }));
    await user.click(screen.getByRole("menuitem", { name: "Sign out" }));
    await vi.waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/sign-in"));
    expect(readSessionCookie()).toBeNull();
  });

  it("resets demo data after confirming, then returns focus to the menu", async () => {
    updateDb((db) => {
      db.requests = [];
    });
    const { user } = renderInWorkspace(<Page />);
    const account = await screen.findByRole("button", { name: /^Amara Okafor/ });
    await user.click(account);
    await user.click(screen.getByRole("menuitem", { name: "Reset demo data" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Reset demo data?" })).getByRole("button", {
        name: "Reset data",
      }),
    );

    expect(await screen.findByText("Demo data reset")).toBeInTheDocument();
    expect(getDb().requests).toHaveLength(30);
    await vi.waitFor(() => expect(account).toHaveFocus());
  });

  it("changes the theme preference", async () => {
    const { user } = renderInWorkspace(<Page />);
    await user.click(await screen.findByRole("button", { name: /^Amara Okafor/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "Dark" }));
    expect(useWorkspaceStore.getState().theme).toBe("dark");
    useWorkspaceStore.setState({ theme: "system" });
  });

  it("sends a signed-out visitor to sign in", async () => {
    renderWithProviders(
      <WorkspaceShell>
        <Page />
      </WorkspaceShell>,
    );
    await vi.waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/sign-in"));
  });

  it("offers a retry when the session can't load", async () => {
    server.use(
      http.get("*/api/session", () =>
        HttpResponse.json({ title: "Down", status: 503 }, { status: 503 }),
      ),
    );
    renderInWorkspace(<Page />);
    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
