import { http, HttpResponse } from "msw";
import { getDb } from "@/mocks/db";
import { server } from "@/mocks/node";
import { renderInWorkspace, screen, within } from "@/test/render";
import { RequestList } from "./RequestList";

const bodyRows = async () => {
  const table = await screen.findByRole("table", { name: /maintenance requests/i });
  return within(table).getAllByRole("row").slice(1);
};
const rowFor = (number: string) => screen.getByText(number).closest("tr") as HTMLElement;

describe("RequestList", () => {
  beforeEach(() => window.history.replaceState(null, "", "/requests"));

  it("shows a loading state, then only the resident's own requests", async () => {
    renderInWorkspace(<RequestList />, { as: "resident" });
    expect(await screen.findByRole("status", { name: /loading/i })).toBeInTheDocument();
    expect(await bodyRows()).toHaveLength(5);
    expect(screen.getByText("Water heater leaking onto the floor")).toBeInTheDocument();
    // Diego's request in the same building (7A) must not leak into Amara's list.
    expect(screen.queryByText("KW-1017")).not.toBeInTheDocument();
  });

  it("labels status and urgency with text, and links to the detail page", async () => {
    renderInWorkspace(<RequestList />, { as: "resident" });
    await bodyRows();
    const row = rowFor("KW-1030");
    expect(within(row).getByText("Emergency")).toBeInTheDocument();
    expect(within(row).getByText("New")).toBeInTheDocument();
    expect(
      within(row).getByRole("link", { name: "Water heater leaking onto the floor" }),
    ).toHaveAttribute("href", "/requests/req_030");
  });

  it("shows coordinators open requests in the active building, with overdue badges", async () => {
    renderInWorkspace(<RequestList />, { as: "coordinator" });
    expect(await bodyRows()).toHaveLength(7);
    expect(screen.getByText("Showing 7 of 10 requests")).toBeInTheDocument();
    expect(within(rowFor("KW-1014")).getByText("Overdue")).toBeInTheDocument();
    expect(within(rowFor("KW-1030")).queryByText("Overdue")).not.toBeInTheDocument();
    expect(screen.queryByText("KW-1029")).not.toBeInTheDocument(); // Maple Court
  });

  it("filters by status, urgency, category and search, and keeps filters in the URL", async () => {
    const { user } = renderInWorkspace(<RequestList />, { as: "coordinator" });
    await bodyRows();

    for (const status of ["Scheduled", "In progress"]) {
      await user.click(screen.getByRole("checkbox", { name: status }));
    }
    expect(window.location.search).toBe("?status=new%2Ctriaged");
    expect(await bodyRows()).toHaveLength(4);

    await user.selectOptions(screen.getByLabelText("Urgency"), "high");
    expect(await bodyRows()).toHaveLength(1);
    expect(screen.getByText("KW-1014")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(window.location.search).toBe("");
    await user.selectOptions(screen.getByLabelText("Category"), "plumbing");
    await user.type(screen.getByLabelText("Search"), "shower");
    expect(await bodyRows()).toHaveLength(1);
    expect(screen.getByText("KW-1017")).toBeInTheDocument();
  });

  it("reads filters from the URL and offers a way out of an empty result", async () => {
    window.history.replaceState(null, "", "/requests?urgency=emergency&category=pest");
    const { user } = renderInWorkspace(<RequestList />, { as: "coordinator" });
    expect(
      await screen.findByRole("heading", { name: "No requests match these filters" }),
    ).toBeInTheDocument();
    const [clear] = screen.getAllByRole("button", { name: "Clear filters" });
    await user.click(clear!);
    expect(await bodyRows()).toHaveLength(7);
  });

  it("sorts by urgency, age and last update with aria-sort", async () => {
    const { user } = renderInWorkspace(<RequestList />, { as: "coordinator" });
    await bodyRows();
    const urgency = screen.getByRole("columnheader", { name: /urgency/i });
    expect(urgency).toHaveAttribute("aria-sort", "none");
    await user.click(within(urgency).getByRole("button"));
    expect(urgency).toHaveAttribute("aria-sort", "descending");
    expect(within((await bodyRows())[0]!).getByText("KW-1030")).toBeInTheDocument();
    expect(window.location.search).toBe("?sort=urgency&dir=desc");

    const age = screen.getByRole("columnheader", { name: /age/i });
    await user.click(within(age).getByRole("button"));
    expect(within((await bodyRows())[0]!).getByText("KW-1012")).toBeInTheDocument(); // oldest open
    await user.click(within(age).getByRole("button"));
    expect(age).toHaveAttribute("aria-sort", "ascending");

    const updated = screen.getByRole("columnheader", { name: /last updated/i });
    await user.click(within(updated).getByRole("button"));
    expect(updated).toHaveAttribute("aria-sort", "descending");
  });

  it("offers resolved requests when nothing is open", async () => {
    const resolved = getDb()
      .requests.filter((item) => item.buildingId === "bld_harbor" && item.status === "resolved")
      .map((item) => ({ ...item, unitLabel: "4B", vendorName: null }));
    server.use(http.get("*/api/requests", () => HttpResponse.json(resolved)));
    const { user } = renderInWorkspace(<RequestList />, { as: "coordinator" });
    expect(
      await screen.findByRole("heading", { name: "No open requests in Harbor View Lofts" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show resolved" }));
    expect(await bodyRows()).toHaveLength(resolved.length);
  });

  it("tells staff when a building has no requests", async () => {
    server.use(http.get("*/api/requests", () => HttpResponse.json([])));
    renderInWorkspace(<RequestList />, { as: "coordinator", buildingId: "bld_maple" });
    expect(
      await screen.findByRole("heading", { name: "No requests in Maple Court" }),
    ).toBeInTheDocument();
  });

  it("shows residents an empty state with a next step", async () => {
    server.use(http.get("*/api/requests", () => HttpResponse.json([])));
    renderInWorkspace(<RequestList />);
    expect(
      await screen.findByRole("heading", { name: "You haven't reported anything yet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New request" })).toHaveAttribute(
      "href",
      "/requests/new",
    );
  });

  it("shows an error with a working retry", async () => {
    server.use(
      http.get(
        "*/api/requests",
        () => HttpResponse.json({ title: "Boom", status: 500 }, { status: 500 }),
        {
          once: true,
        },
      ),
    );
    const { user } = renderInWorkspace(<RequestList />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load requests");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });
});
