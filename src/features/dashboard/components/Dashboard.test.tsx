import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { renderInWorkspace, screen, within } from "@/test/render";
import { Dashboard } from "./Dashboard";

const panel = (name: string) => screen.getByRole("region", { name });
const bars = (name: string) =>
  within(panel(name))
    .getAllByRole("listitem")
    .map((item) => item.textContent);

describe("Dashboard", () => {
  it("shows a skeleton, then the seeded portfolio numbers", async () => {
    renderInWorkspace(<Dashboard />, { as: "manager" });
    expect(await screen.findByRole("status", { name: "Loading dashboard" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await screen.findByText("Open requests");

    expect(screen.getByText("Open requests").nextSibling).toHaveTextContent("20");
    expect(screen.getByText("Overdue").nextSibling).toHaveTextContent("4");
    expect(bars("Open by building")).toEqual(["Harbor View Lofts7", "Maple Court7", "The Linden6"]);
    expect(bars("Overdue by urgency")).toEqual(["Emergency0", "High2", "Normal1", "Low1"]);
    expect(bars("Coordinator workload")).toEqual(["Grace Adeyemi14", "Theo Marchetti6"]);
    expect(
      within(panel("Overdue by urgency")).getByText(/High 2, Normal 1, Low 1/),
    ).toBeInTheDocument();
  });

  it("switches a chart to an accessible table and back", async () => {
    const { user } = renderInWorkspace(<Dashboard />, { as: "manager" });
    await screen.findByText("Open requests");
    const workload = panel("Coordinator workload");
    const toggle = within(workload).getByRole("button", { name: "Show table" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle);

    const table = within(workload).getByRole("table", { name: "Coordinator workload" });
    const grace = within(table).getByRole("rowheader", { name: "Grace Adeyemi" }).closest("tr")!;
    expect(within(grace).getAllByRole("cell").at(-1)).toHaveTextContent("14");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Coordinator", "New", "Triaged", "Scheduled", "In progress", "Total"]);

    await user.click(within(workload).getByRole("button", { name: "Show chart" }));
    expect(within(workload).queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows an empty state when there is no data", async () => {
    server.use(
      http.get("*/api/dashboard", () =>
        HttpResponse.json({
          totals: { open: 0, overdue: 0, resolved30d: 0, avgResolveHours30d: null },
          openByBuilding: [],
          resolveTimeByBuilding: [],
          overdueByUrgency: [],
          workload: [],
        }),
      ),
    );
    renderInWorkspace(<Dashboard />, { as: "manager" });
    expect(await screen.findByRole("heading", { name: "No requests yet" })).toBeInTheDocument();
  });

  it("shows an error with a working retry", async () => {
    server.use(
      http.get(
        "*/api/dashboard",
        () => HttpResponse.json({ title: "Boom", status: 500 }, { status: 500 }),
        {
          once: true,
        },
      ),
    );
    const { user } = renderInWorkspace(<Dashboard />, { as: "manager" });
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load the dashboard");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Open requests")).toBeInTheDocument();
  });
});
