import { http, HttpResponse } from "msw";
import { getDb } from "@/mocks/db";
import { server } from "@/mocks/node";
import { renderInWorkspace, screen, waitFor, within } from "@/test/render";
import { RequestDetailView } from "./RequestDetailView";
import { sortVendors } from "./WorkflowActions";

const actions = () => screen.queryByRole("group", { name: "Workflow actions" });
const timelineItems = () =>
  within(screen.getByRole("list", { name: "Timeline" })).getAllByRole("listitem");

async function openDetail(id: string, as = "coordinator", buildingId?: string) {
  const view = renderInWorkspace(<RequestDetailView id={id} />, { as, buildingId });
  await screen.findByRole("heading", {
    level: 1,
    name: getDb().requests.find((r) => r.id === id)?.title,
  });
  return view;
}

describe("RequestDetailView", () => {
  it("shows details and a read-only view for the resident", async () => {
    await openDetail("req_030", "resident");
    expect(screen.getByText(/KW-1030 · Unit 4B · Plumbing/)).toBeInTheDocument();
    expect(screen.getByText("Dog will be in the bedroom.")).toBeInTheDocument();
    expect(screen.getByText("As soon as possible")).toBeInTheDocument();
    expect(timelineItems()).toHaveLength(1);
    expect(timelineItems()[0]).toHaveTextContent("Request submitted");
    expect(timelineItems()[0]).toHaveTextContent("Amara Okafor");
    expect(actions()).not.toBeInTheDocument();
    expect(await screen.findByRole("region", { name: "Messages" })).toBeInTheDocument();
  });

  it("leaves messages out for the manager", async () => {
    await openDetail("req_001", "manager");
    expect(screen.queryByRole("region", { name: "Messages" })).not.toBeInTheDocument();
  });

  it("shows 'Request not found' for another unit's request", async () => {
    renderInWorkspace(<RequestDetailView id="req_030" />, { as: "usr_res_diego" });
    expect(
      await screen.findByRole("heading", { name: "Request not found", level: 2 }),
    ).toBeInTheDocument();
  });

  it("shows an error with retry", async () => {
    server.use(
      http.get(
        "*/api/requests/:id",
        () => HttpResponse.json({ title: "Boom", status: 500 }, { status: 500 }),
        {
          once: true,
        },
      ),
    );
    const { user } = renderInWorkspace(<RequestDetailView id="req_030" />, { as: "coordinator" });
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load this request");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: /water heater/i }),
    ).toBeInTheDocument();
  });

  it.each([
    ["req_030", ["Triage"]], // new
    ["req_012", ["Assign vendor", "Schedule visit"]], // triaged, no vendor
    ["req_023", ["Change vendor", "Reschedule", "Mark in progress"]], // scheduled
    ["req_017", ["Resolve"]], // in progress
  ])("offers only the next valid steps for %s", async (id, labels) => {
    await openDetail(id);
    expect(
      within(actions()!)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(labels);
  });

  it("disables scheduling until a vendor is assigned", async () => {
    await openDetail("req_012");
    expect(screen.getByRole("button", { name: "Schedule visit" })).toBeDisabled();
  });

  it("hides actions on resolved requests", async () => {
    await openDetail("req_001");
    expect(actions()).not.toBeInTheDocument();
  });

  it("works KW-1030 from new to resolved", async () => {
    const { user } = await openDetail("req_030");

    await user.click(screen.getByRole("button", { name: "Triage" }));
    const triage = screen.getByRole("dialog", { name: "Triage KW-1030" });
    await user.click(within(triage).getByRole("button", { name: "Mark triaged" }));
    expect(await screen.findByText("KW-1030 triaged")).toBeInTheDocument();
    expect(actions()).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Assign vendor" }));
    const assign = screen.getByRole("dialog", { name: /assign a vendor/i });
    const vendors = await within(assign).findAllByRole("radio");
    expect(vendors[0]).toHaveAccessibleName("Tidewater Plumbing Co. · Plumbing (matches)");
    await user.click(within(assign).getByRole("button", { name: "Assign vendor" }));
    expect(await within(assign).findByText("Choose a vendor.")).toBeInTheDocument();
    await user.click(vendors[0]!);
    await user.click(within(assign).getByRole("button", { name: "Assign vendor" }));
    expect(await screen.findByText("KW-1030 assigned to a vendor")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Schedule visit" }));
    const schedule = screen.getByRole("dialog", { name: /schedule the visit/i });
    const end = within(schedule).getByLabelText(/^End/);
    await user.clear(end);
    await user.type(end, "09:00");
    await user.click(within(schedule).getByRole("button", { name: "Schedule visit" }));
    expect(end).toHaveAccessibleDescription("End the visit after it starts.");
    await user.clear(end);
    await user.type(end, "12:00");
    await user.click(within(schedule).getByRole("button", { name: "Schedule visit" }));
    expect(await screen.findByText("KW-1030 scheduled")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Mark in progress" }));
    expect(await screen.findByText("KW-1030 marked in progress")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Resolve" }));
    const resolve = screen.getByRole("dialog", { name: "Resolve KW-1030" });
    await user.type(
      within(resolve).getByLabelText(/Resolution note/),
      "Replaced the relief valve.",
    );
    await user.click(within(resolve).getByRole("button", { name: "Resolve request" }));
    expect(await screen.findByText("KW-1030 resolved")).toBeInTheDocument();

    await waitFor(() => expect(timelineItems()).toHaveLength(6));
    expect(screen.getByText("Replaced the relief valve.")).toBeInTheDocument();
    expect(actions()).not.toBeInTheDocument();
  });

  it("rolls back and explains when the API rejects a step", async () => {
    server.use(
      http.post("*/api/requests/:id/start", () =>
        HttpResponse.json(
          { title: "Conflict", status: 409, code: "INVALID_TRANSITION" },
          { status: 409 },
        ),
      ),
    );
    const { user } = await openDetail("req_023");
    await user.click(screen.getByRole("button", { name: "Mark in progress" }));
    expect(await screen.findByText("Couldn't update KW-1023")).toBeInTheDocument();
    expect(screen.getByText(/we've refreshed it/i)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Mark in progress" })).toBeInTheDocument();
    expect(getDb().requests.find((r) => r.id === "req_023")?.status).toBe("scheduled");
  });

  it("switches a coordinator to the request's building on a deep link", async () => {
    await openDetail("req_029", "coordinator", "bld_harbor");
    expect(await screen.findByText("Maple Court", { selector: "p" })).toBeInTheDocument();
  });
});

describe("sortVendors", () => {
  it("puts matching trades first, then general repair", () => {
    const vendors = getDb().vendors;
    const sorted = sortVendors(vendors, "plumbing").map((vendor) => vendor.trade);
    expect(sorted.slice(0, 2)).toEqual(["plumbing", "general"]);
  });
});
