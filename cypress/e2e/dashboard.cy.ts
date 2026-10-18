// Story 5.1: the manager's portfolio dashboard, with table alternatives.
describe("manager dashboard", () => {
  it("shows the seeded portfolio numbers and a table alternative", () => {
    cy.signInAs("manager");
    cy.visitFresh("/dashboard");
    cy.findByRole("heading", { level: 1, name: "Dashboard" }).should("be.visible");

    cy.findByRole("region", { name: "Open by building" })
      .findAllByRole("listitem")
      .then((items) => [...items].map((item) => item.textContent))
      .should("deep.equal", ["Harbor View Lofts7", "Maple Court7", "The Linden6"]);
    cy.findByRole("region", { name: "Overdue by urgency" }).should(
      "contain.text",
      "High 2, Normal 1, Low 1",
    );
    cy.checkPageA11y();

    cy.findByRole("region", { name: "Coordinator workload" }).within(() => {
      cy.findByRole("button", { name: "Show table" }).click();
      cy.findByRole("table", { name: "Coordinator workload" }).within(() => {
        cy.findByRole("rowheader", { name: "Grace Adeyemi" }).parent().should("contain.text", "14");
        cy.findByRole("rowheader", { name: "Theo Marchetti" }).parent().should("contain.text", "6");
      });
    });
    cy.checkPageA11y();
  });

  it("is blocked for coordinators in the route and the api", () => {
    cy.signInAs("coordinator");
    cy.visitFresh("/dashboard");
    cy.findByRole("heading", { name: "You don't have access to this page" }).should("be.visible");
    cy.window()
      .then((win) => win.fetch("/api/dashboard").then((response) => response.status))
      .should("eq", 403);
  });
});
