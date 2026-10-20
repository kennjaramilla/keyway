describe("requests list", () => {
  it("shows a resident only their own unit's requests", () => {
    cy.signInAs("resident");
    cy.visitFresh("/requests");
    cy.title().should("eq", "Requests · Harbor View Lofts · Keyway");
    cy.findByRole("table", { name: /maintenance requests/i }).within(() => {
      cy.findAllByRole("row").should("have.length", 6); // header + Amara's 5
      cy.findByText("KW-1030").should("exist");
      cy.findByText("KW-1017").should("not.exist"); // Diego, unit 7A, same building
    });
    cy.checkPageA11y();
  });

  it("isolates buildings when a coordinator switches", () => {
    cy.signInAs("coordinator");
    cy.visitFresh("/requests");
    cy.findByRole("table").findByText("Water heater leaking onto the floor").should("exist");

    cy.findByRole("button", { name: /Switch building/ }).click();
    cy.findByRole("menuitemradio", { name: /Maple Court/ }).click();

    cy.findByRole("status").should("contain.text", "Switched to Maple Court");
    cy.title().should("eq", "Requests · Maple Court · Keyway");
    cy.findByRole("table").findByText("Water heater leaking onto the floor").should("not.exist");
    cy.checkPageA11y();
  });

  it("switches to the building of a deep-linked request once", () => {
    cy.signInAs("coordinator");
    cy.visitFresh("/requests/req_003");
    cy.title().should("eq", "Mouse droppings under the kitchen sink · Maple Court · Keyway");
  });

  it("leaves a request page for the new building's queue when the coordinator switches", () => {
    cy.signInAs("coordinator");
    cy.visitFresh("/requests/req_030");
    cy.findByRole("heading", { level: 1 }).should("be.visible");
    cy.title().should("contain", "· Harbor View Lofts · Keyway");

    cy.findByRole("button", { name: /Switch building/ }).click();
    cy.findByRole("menuitemradio", { name: /Maple Court/ }).click();

    cy.location("pathname").should("eq", "/requests");
    cy.title().should("eq", "Requests · Maple Court · Keyway");
    cy.findByRole("button", { name: /Building: Maple Court/ }).should("exist");
    cy.findByRole("status").should("contain.text", "Switched to Maple Court");
    cy.checkPageA11y();
  });

  it("returns 404 from the API for another unit's request", () => {
    cy.signInAs("resident", "usr_res_diego");
    cy.visitFresh("/requests");
    cy.findByRole("table").should("be.visible");
    // Requests made by the page go through the mock API, which enforces scope.
    cy.window()
      .then((win) => win.fetch("/api/requests/req_001").then((response) => response.status))
      .should("eq", 404);
  });

  it("starts each test from fresh seed data", () => {
    cy.signInAs("coordinator", "usr_coord_theo");
    cy.visitFresh("/requests?reset");
    cy.location("search").should("eq", "");
    cy.findByRole("table").findAllByRole("row").should("have.length", 7); // header + 6 open
  });

  it("lets a resident reopen a request resolved this week", () => {
    cy.signInAs("resident", "usr_res_meilin");
    cy.visitFresh("/requests/req_016");
    cy.findByRole("button", { name: "Reopen" }).click();
    cy.findByRole("dialog", { name: "Reopen KW-1016?" }).within(() => {
      cy.findByRole("button", { name: "Reopen request" }).click();
      cy.findByText(/Say what's still wrong/).should("be.visible");
      cy.findByLabelText(/What's still wrong/).type("The light buzzes again at night.");
      cy.findByRole("button", { name: "Reopen request" }).click();
    });
    cy.findByText("KW-1016 reopened").should("be.visible");
    cy.findByRole("list", { name: "Timeline" })
      .findAllByRole("listitem")
      .last()
      .should("contain.text", "Resolved → In progress")
      .and("contain.text", "The light buzzes again at night.");
    cy.checkPageA11y();
  });
});
