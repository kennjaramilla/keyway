import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { renderInWorkspace, screen, within } from "@/test/render";
import { UnitBalances } from "./UnitBalances";

describe("UnitBalances", () => {
  it("shows each unit's balance with a text status, most overdue first", async () => {
    renderInWorkspace(<UnitBalances />, { as: "coordinator" });
    const table = await screen.findByRole("table", { name: "Unit balances in Harbor View Lofts" });
    const [diego, amara] = within(table).getAllByRole("row").slice(1);
    expect(diego).toHaveTextContent(/7A.*Diego Santillán.*Overdue/);
    expect(amara).toHaveTextContent(/4B.*Amara Okafor.*Balance due.*\$2,536\.40/);
    const totals = screen.getByLabelText("Building totals");
    expect(totals).toHaveTextContent("Overdue$2,800.00");
    expect(totals).toHaveTextContent("Units overdue1 of 2");
  });

  it("follows the active building", async () => {
    renderInWorkspace(<UnitBalances />, { as: "manager", buildingId: "bld_linden" });
    expect(
      await screen.findByRole("table", { name: "Unit balances in The Linden" }),
    ).toHaveTextContent("Priya Natarajan");
  });

  it("shows an empty state and an error with retry", async () => {
    server.use(http.get("*/api/billing/units", () => HttpResponse.json([]), { once: true }));
    const { unmount } = renderInWorkspace(<UnitBalances />, { as: "coordinator" });
    expect(
      await screen.findByRole("heading", { name: "No residents in Harbor View Lofts" }),
    ).toBeInTheDocument();
    unmount();

    server.use(
      http.get(
        "*/api/billing/units",
        () => HttpResponse.json({ title: "Boom", status: 500 }, { status: 500 }),
        { once: true },
      ),
    );
    const { user } = renderInWorkspace(<UnitBalances />, { as: "coordinator" });
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load balances");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });
});
