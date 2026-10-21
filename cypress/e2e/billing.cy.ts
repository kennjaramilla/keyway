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

  it("is not available to staff", () => {
    cy.signInAs("coordinator");
    cy.visitFresh("/billing");
    cy.findByRole("heading", { name: "You don't have access to this page" }).should("be.visible");
  });
});
