import { RequestDetailView } from "@/features/requests/components/RequestDetailView";
import { getDb } from "@/mocks/db";
import { renderInWorkspace, screen, within } from "@/test/render";

const card = () => screen.findByRole("region", { name: "Damage charge" });

describe("DamageChargeCard", () => {
  it("lets a coordinator charge a resolved request, then shows the charge", async () => {
    const { user } = renderInWorkspace(<RequestDetailView id="req_004" />, { as: "coordinator" });
    await user.click(await within(await card()).findByRole("button", { name: "Charge resident" }));
    const dialog = await screen.findByRole("dialog", { name: "Charge for KW-1004" });
    expect(dialog).toHaveTextContent("Added to Amara Okafor's account");
    expect(within(dialog).getByLabelText(/^What it's for/)).toHaveValue(
      "Damage repair: Closet door off its track",
    );

    await user.type(within(dialog).getByLabelText(/^Amount/), "$1,250.5");
    await user.click(within(dialog).getByRole("button", { name: "Add charge" }));

    expect(await screen.findByText("Charged $1,250.50")).toBeInTheDocument();
    expect(await within(await card()).findByText(/: \$1,250\.50$/)).toBeInTheDocument();
    expect(within(await card()).getByText("Due")).toBeInTheDocument();
    expect(getDb().charges.find((charge) => charge.requestId === "req_004")?.amountCents).toBe(
      125050,
    );
  });

  it("validates the amount in the form", async () => {
    const { user } = renderInWorkspace(<RequestDetailView id="req_004" />, { as: "coordinator" });
    await user.click(await within(await card()).findByRole("button", { name: "Charge resident" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Add charge" }));
    expect(await within(dialog).findByText("Enter an amount like 125.00.")).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/^Amount/), "0.50");
    await user.click(within(dialog).getByRole("button", { name: "Add charge" }));
    expect(await within(dialog).findByText("The minimum is $1.00.")).toBeInTheDocument();
    expect(getDb().charges.some((charge) => charge.requestId === "req_004")).toBe(false);
  });

  it("is read-only for the manager and hidden for residents and open requests", async () => {
    const { unmount } = renderInWorkspace(<RequestDetailView id="req_004" />, { as: "manager" });
    expect(await within(await card()).findByText("No damage charge.")).toBeInTheDocument();
    unmount();

    const resident = renderInWorkspace(<RequestDetailView id="req_004" />, { as: "resident" });
    await screen.findByRole("heading", { level: 1, name: "Closet door off its track" });
    expect(screen.queryByRole("region", { name: "Damage charge" })).not.toBeInTheDocument();
    resident.unmount();

    renderInWorkspace(<RequestDetailView id="req_023" />, { as: "coordinator" });
    await screen.findByRole("heading", { level: 1 });
    expect(screen.queryByRole("region", { name: "Damage charge" })).not.toBeInTheDocument();
  });
});
