import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { renderInWorkspace, screen, within } from "@/test/render";
import { BillingView } from "./BillingView";

describe("BillingView", () => {
  it("shows the balance, open charges and payment history", async () => {
    renderInWorkspace(<BillingView />, { as: "resident" });
    const totals = await screen.findByLabelText("Account summary");
    expect(totals).toHaveTextContent("Balance due$2,536.40");
    expect(totals).toHaveTextContent("Overdue$0.00");

    const open = screen.getByRole("table", { name: "Open charges" });
    const rows = within(open).getAllByRole("row").slice(1);
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("September water and sewer"),
      expect.stringContaining("November rent"),
    ]);
    expect(rows[1]).toHaveTextContent("Due");
    const history = screen.getByRole("table", { name: "Payment history" });
    expect(within(history).getAllByRole("row")).toHaveLength(4);
    expect(within(history).getAllByText("Visa ending 4242")).toHaveLength(3);
  });

  it("marks overdue charges with text, not just colour", async () => {
    renderInWorkspace(<BillingView />, { as: "usr_res_diego" });
    const open = await screen.findByRole("table", { name: "Open charges" });
    expect(within(open).getByRole("row", { name: /^October rent/ })).toHaveTextContent("Overdue");
    expect(screen.getByLabelText("Account summary")).toHaveTextContent("Overdue$2,800.00");
  });

  it("pays the selected charges with a saved method", async () => {
    const { user } = renderInWorkspace(<BillingView />, { as: "resident" });
    await user.click(await screen.findByRole("button", { name: "Pay now" }));
    const dialog = await screen.findByRole("dialog", { name: "Make a payment" });
    expect(within(dialog).getByRole("button", { name: "Pay $2,536.40" })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("checkbox", { name: /November rent/ }));
    await user.click(within(dialog).getByRole("radio", { name: "Checking ending 6789" }));
    await user.click(within(dialog).getByRole("button", { name: "Pay $86.40" }));

    expect(await screen.findByText("Paid $86.40")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await screen.findByLabelText("Account summary")).toHaveTextContent(
      "Balance due$2,450.00",
    );
    const history = screen.getByRole("table", { name: "Payment history" });
    expect(within(history).getAllByRole("row")[1]).toHaveTextContent("Checking ending 6789");
  });

  it("asks for at least one charge", async () => {
    const { user } = renderInWorkspace(<BillingView />, { as: "resident" });
    await user.click(await screen.findByRole("button", { name: "Pay now" }));
    const dialog = await screen.findByRole("dialog");
    for (const box of within(dialog).getAllByRole("checkbox")) await user.click(box);
    await user.click(within(dialog).getByRole("button", { name: "Pay $0.00" }));
    expect(within(dialog).getByText("Choose at least one charge to pay.")).toBeInTheDocument();
  });

  it("keeps the dialog open and explains a declined payment", async () => {
    server.use(
      http.post("*/api/billing/payments", () =>
        HttpResponse.json(
          {
            title: "Payment declined",
            status: 502,
            detail: "The bank didn't approve this payment.",
          },
          { status: 502 },
        ),
      ),
    );
    const { user } = renderInWorkspace(<BillingView />, { as: "resident" });
    await user.click(await screen.findByRole("button", { name: "Pay now" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /^Pay \$/ }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Payment didn't go through.",
    );
  });

  it("shows an all-paid empty state", async () => {
    server.use(
      http.get("*/api/billing", () =>
        HttpResponse.json({ charges: [], payments: [], balanceCents: 0, overdueCents: 0 }),
      ),
    );
    renderInWorkspace(<BillingView />, { as: "resident" });
    expect(await screen.findByRole("heading", { name: "You're all paid up" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No payments yet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pay now" })).toBeDisabled();
    expect(screen.getByLabelText("Account summary")).toHaveTextContent("Next dueNothing due");
  });

  it("shows an error with a working retry", async () => {
    server.use(
      http.get(
        "*/api/billing",
        () => HttpResponse.json({ title: "Boom", status: 500 }, { status: 500 }),
        { once: true },
      ),
    );
    const { user } = renderInWorkspace(<BillingView />, { as: "usr_res_meilin" });
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load billing");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByLabelText("Account summary")).toBeInTheDocument();
  });
});
