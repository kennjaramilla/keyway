import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { renderInWorkspace, screen, within } from "@/test/render";
import { RequestList } from "./RequestList";

describe("RequestList", () => {
  it("shows a loading state, then only the resident's own requests", async () => {
    renderInWorkspace(<RequestList />, { as: "resident" });
    expect(await screen.findByRole("status", { name: /loading/i })).toBeInTheDocument();

    const table = await screen.findByRole("table", { name: /maintenance requests/i });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(5);
    expect(within(table).getByText("Water heater leaking onto the floor")).toBeInTheDocument();
    // Diego's request in the same building (7A) must not leak into Amara's list.
    expect(within(table).queryByText("KW-1017")).not.toBeInTheDocument();
  });

  it("labels status and urgency with text, not colour alone", async () => {
    renderInWorkspace(<RequestList />, { as: "resident" });
    const row = (await screen.findByText("KW-1030")).closest("tr");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText("Emergency")).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText("New")).toBeInTheDocument();
  });

  it("shows the coordinator's active building only", async () => {
    renderInWorkspace(<RequestList />, { as: "coordinator", buildingId: "bld_maple" });
    await screen.findByRole("table");
    expect(screen.queryByText("Water heater leaking onto the floor")).not.toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    server.use(http.get("*/api/requests", () => HttpResponse.json([])));
    renderInWorkspace(<RequestList />);
    expect(await screen.findByRole("heading", { name: "No requests yet" })).toBeInTheDocument();
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
