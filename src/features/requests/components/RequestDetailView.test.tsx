import { http, HttpResponse } from "msw";
import { getDb } from "@/mocks/db";
import { server } from "@/mocks/node";
import { sessionKeys } from "@/features/session/api";
import { sessionSchema } from "@/features/session/schema";
import { api } from "@/lib/api-client";
import { readSessionCookie } from "@/lib/auth/session-cookie";
import { act, renderInWorkspace, screen, waitFor, within } from "@/test/render";
import { fetchRequests, requestKeys } from "../api";
import type { RequestListItem } from "../schema";
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
  it("shows details to the resident, with cancel as the only action", async () => {
    await openDetail("req_030", "resident");
    expect(screen.getByText(/KW-1030 · Unit 4B · Plumbing/)).toBeInTheDocument();
    expect(screen.getByText("Dog will be in the bedroom.")).toBeInTheDocument();
    expect(screen.getByText("As soon as possible")).toBeInTheDocument();
    expect(timelineItems()).toHaveLength(1);
    expect(timelineItems()[0]).toHaveTextContent("Request submitted");
    expect(timelineItems()[0]).toHaveTextContent("Amara Okafor");
    expect(
      within(actions()!)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Cancel request"]);
    expect(await screen.findByRole("region", { name: "Messages" })).toBeInTheDocument();
  });

  it("lets the resident cancel a new request after confirming", async () => {
    const { user } = await openDetail("req_030", "resident");
    await user.click(screen.getByRole("button", { name: "Cancel request" }));
    const dialog = await screen.findByRole("dialog", { name: "Cancel KW-1030?" });
    await user.click(within(dialog).getByRole("button", { name: "Keep request" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(getDb().requests.find((r) => r.id === "req_030")?.status).toBe("new");

    await user.click(screen.getByRole("button", { name: "Cancel request" }));
    const confirm = await screen.findByRole("dialog", { name: "Cancel KW-1030?" });
    await user.type(
      within(confirm).getByLabelText("Reason (optional)"),
      "Landlord's plumber came.",
    );
    await user.click(within(confirm).getByRole("button", { name: "Cancel request" }));
    expect(await screen.findByText("KW-1030 cancelled")).toBeInTheDocument();
    expect(screen.getByText("Cancelled", { selector: "span" })).toBeInTheDocument();
    await waitFor(() => expect(timelineItems()).toHaveLength(2));
    expect(timelineItems()[1]).toHaveTextContent("New → Cancelled");
    expect(timelineItems()[1]).toHaveTextContent("Landlord's plumber came.");
    expect(actions()).not.toBeInTheDocument();
  });

  it("nests the empty messages heading under the Messages card", async () => {
    await openDetail("req_030", "resident");
    expect(
      await screen.findByRole("heading", { level: 3, name: "No messages yet" }),
    ).toBeInTheDocument();
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

  it("hides actions on requests resolved more than 7 days ago", async () => {
    await openDetail("req_001");
    expect(actions()).not.toBeInTheDocument();
  });

  it("lets the resident reopen a recently resolved request with a reason", async () => {
    const { user } = await openDetail("req_016", "usr_res_meilin");
    await user.click(screen.getByRole("button", { name: "Reopen" }));
    const dialog = await screen.findByRole("dialog", { name: "Reopen KW-1016?" });
    await user.click(within(dialog).getByRole("button", { name: "Reopen request" }));
    expect(await within(dialog).findByText(/Say what's still wrong/)).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/What's still wrong/), "Buzzing is back.");
    await user.click(within(dialog).getByRole("button", { name: "Reopen request" }));
    expect(await screen.findByText("KW-1016 reopened")).toBeInTheDocument();
    expect(screen.getByText("In progress", { selector: "span" })).toBeInTheDocument();
    await waitFor(() => expect(timelineItems().at(-1)).toHaveTextContent("Resolved → In progress"));
    expect(timelineItems().at(-1)).toHaveTextContent("Buzzing is back.");
    expect(screen.queryByText("Resolved", { selector: "dt" })).not.toBeInTheDocument();
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
    // A just-resolved request can only be reopened.
    expect(
      within(actions()!)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Reopen"]);
  });

  it("patches only list fields into cached request lists", async () => {
    const { user, queryClient } = await openDetail("req_030");
    const listKey = requestKeys.list({ buildingId: "bld_harbor" });
    queryClient.setQueryData(listKey, await fetchRequests({ buildingId: "bld_harbor" }));

    await user.click(screen.getByRole("button", { name: "Triage" }));
    const triage = screen.getByRole("dialog", { name: "Triage KW-1030" });
    await user.click(within(triage).getByRole("button", { name: "Mark triaged" }));
    const cached = () =>
      queryClient.getQueryData<RequestListItem[]>(listKey)?.find((r) => r.id === "req_030");
    const saved = () => getDb().requests.find((r) => r.id === "req_030");
    await waitFor(() => expect(cached()?.updatedAt).toBe(saved()?.updatedAt));

    const item = cached();
    expect(item?.status).toBe("triaged");
    expect(item).not.toHaveProperty("people");
    expect(item).not.toHaveProperty("buildingName");
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
    expect(screen.getByText(/we've refreshed it/i, { selector: "div" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Mark in progress" })).toBeInTheDocument();
    expect(getDb().requests.find((r) => r.id === "req_023")?.status).toBe("scheduled");
  });

  it("switches a coordinator to the request's building on a deep link", async () => {
    await openDetail("req_029", "coordinator", "bld_harbor");
    expect(await screen.findByText("Maple Court", { selector: "p" })).toBeInTheDocument();
  });

  it("does not switch back when the coordinator later picks another building", async () => {
    const { queryClient } = await openDetail("req_030", "coordinator", "bld_harbor");
    const maple = await api.put("/session/building", sessionSchema, { buildingId: "bld_maple" });
    act(() => queryClient.setQueryData(sessionKeys.current, maple));
    expect(await screen.findByText("Maple Court", { selector: "p" })).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(readSessionCookie()?.activeBuildingId).toBe("bld_maple");
  });
});

describe("sortVendors", () => {
  it("puts matching trades first, then general repair", () => {
    const vendors = getDb().vendors;
    const sorted = sortVendors(vendors, "plumbing").map((vendor) => vendor.trade);
    expect(sorted.slice(0, 2)).toEqual(["plumbing", "general"]);
  });
});
