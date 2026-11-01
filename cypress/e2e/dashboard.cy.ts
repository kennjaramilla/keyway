// Stories 5.1 and 5.2: the manager's portfolio dashboard, table alternatives and date range.
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

  it("switches the date range and keeps it in the url", () => {
    cy.signInAs("manager");
    cy.visitFresh("/dashboard");
    cy.findByRole("radio", { name: "7 days" }).should("have.attr", "aria-checked", "true");
    cy.findByRole("region", { name: "Request volume, last 7 days" }).should("be.visible");

    cy.findByRole("radio", { name: "30 days" }).click();
    cy.location("search").should("eq", "?days=30");
    cy.findByRole("region", { name: "Request volume, last 30 days" }).should("be.visible");
    cy.findByText("Resolved, last 30 days").should("be.visible");
    cy.checkPageA11y();

    cy.reload();
    cy.findByRole("radio", { name: "30 days" }).should("have.attr", "aria-checked", "true");
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
