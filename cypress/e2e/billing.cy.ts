// Resident billing: balance, a demo payment with a saved method, and a declined payment.
describe("billing", () => {
  it("pays a charge and shows it in the history", () => {
    cy.signInAs("resident");
    cy.visitFresh("/billing");
    cy.title().should("eq", "Billing · Harbor View Lofts · Keyway");
    cy.findByLabelText("Account summary").should("contain.text", "$2,536.40");
    cy.checkPageA11y();

    cy.findByRole("button", { name: "Pay now" }).click();
    cy.findByRole("dialog", { name: "Make a payment" }).within(() => {
      cy.findByRole("checkbox", { name: /November rent/ }).click();
      cy.findByRole("radio", { name: "Checking ending 6789" }).click();
    });
    cy.checkPageA11y();
    cy.findByRole("button", { name: "Pay $86.40" }).click();

    cy.findByText("Paid $86.40").should("be.visible");
    cy.findByRole("dialog").should("not.exist");
    cy.findByRole("button", { name: "Pay now" }).should("have.focus");
    cy.findByLabelText("Account summary").should("contain.text", "$2,450.00");
    cy.findByRole("table", { name: "Payment history" })
      .findAllByRole("row")
      .eq(1)
      .should("contain.text", "September water and sewer")
      .and("contain.text", "Checking ending 6789");
  });

  it("keeps the charges open when a payment is declined (?fail=payments)", () => {
    cy.signInAs("resident", "usr_res_diego");
    cy.visitFresh("/billing?fail=payments");
    cy.findByRole("table", { name: "Open charges" }).should("contain.text", "Overdue");
    cy.findByRole("button", { name: "Pay now" }).click();
    cy.findByRole("button", { name: /^Pay \$/ }).click();
    cy.findByRole("alert").should("contain.text", "Payment didn't go through.");
    cy.checkPageA11y();
    cy.findByRole("button", { name: /^Pay \$/ }).click();
    cy.findByText(/^Paid \$/).should("be.visible");
    cy.findByRole("heading", { name: "You're all paid up" }).should("be.visible");
  });

  it("lets a coordinator see balances and charge for damage", () => {
    cy.signInAs("coordinator");
    cy.visitFresh("/billing");
    cy.findByRole("heading", { level: 1, name: "Billing" }).should("be.visible");
    cy.findByRole("table", { name: "Unit balances in Harbor View Lofts" })
      .findAllByRole("row")
      .eq(1)
      .should("contain.text", "Diego Santillán")
      .and("contain.text", "Overdue");
    cy.checkPageA11y();

    cy.visit("/requests/req_004");
    cy.findByRole("region", { name: "Damage charge" }).within(() => {
      cy.findByRole("button", { name: "Charge resident" }).click();
    });
    cy.findByRole("dialog", { name: "Charge for KW-1004" }).within(() => {
      cy.findByRole("textbox", { name: /Amount/ }).type("125");
      cy.findByRole("textbox", { name: /What it's for/ })
        .clear()
        .type("Replace bent closet track");
    });
    cy.checkPageA11y();
    cy.findByRole("button", { name: "Add charge" }).click();
    cy.findByText("Charged $125.00").should("be.visible");
    cy.findByRole("region", { name: "Damage charge" }).should(
      "contain.text",
      "Replace bent closet track: $125.00",
    );
    cy.checkPageA11y();

    cy.signInAs("resident");
    cy.visit("/billing");
    cy.findByRole("table", { name: "Open charges" }).should(
      "contain.text",
      "Replace bent closet track",
    );
    cy.findByLabelText("Account summary").should("contain.text", "$2,661.40");
  });
});
