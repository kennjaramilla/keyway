// E2E-2: tenant isolation is enforced by the API, and the UI follows the active building.
const apiStatus = (path: string) =>
  cy.window().then((win) => win.fetch(path).then((response) => response.status));

describe("tenant isolation", () => {
  it("hides another unit's request and conversation from a resident (404)", () => {
    cy.signInAs("resident", "usr_res_diego");
    cy.visitFresh("/messages/req_023");
    cy.findByRole("heading", { name: "Conversation not found" }).should("be.visible");
    apiStatus("/api/requests/req_023").should("eq", 404);
    apiStatus("/api/threads/req_023/messages").should("eq", 404);
    cy.checkPageA11y();
  });

  it("shows 'Request not found' on another unit's request detail", () => {
    cy.signInAs("resident", "usr_res_diego");
    cy.visitFresh("/requests/req_023");
    cy.findByRole("heading", { level: 1, name: "Request not found" }).should("be.visible");
    cy.findByText("Dishwasher leaves dishes wet and cloudy").should("not.exist");
    cy.findByRole("link", { name: "All requests" }).should("be.visible");
    cy.title().should("eq", "Request not found · Harbor View Lofts · Keyway");
    cy.checkPageA11y();
  });

  it("hides uncovered buildings from a coordinator (404)", () => {
    cy.signInAs("coordinator", "usr_coord_theo");
    cy.visitFresh("/messages");
    cy.findByRole("list", { name: "Conversations" })
      .findAllByRole("link")
      .should("have.length", 2)
      .each((link) => expect(link.text()).not.to.contain("KW-1017"));
    apiStatus("/api/requests?buildingId=bld_harbor").should("eq", 404);
    apiStatus("/api/threads?buildingId=bld_harbor").should("eq", 404);
    apiStatus("/api/requests/req_017").should("eq", 404);
    cy.checkPageA11y();
  });

  it("switches requests, threads and rules together", () => {
    cy.signInAs("coordinator");
    cy.visitFresh("/messages");
    cy.findByRole("list", { name: "Conversations" }).should("contain.text", "KW-1017");

    cy.findByRole("button", { name: /Switch building/ }).click();
    cy.findByRole("menuitemradio", { name: /Maple Court/ }).click();
    cy.title().should("eq", "Messages · Maple Court · Keyway");
    cy.findByRole("list", { name: "Conversations" })
      .should("contain.text", "KW-1029")
      .and("not.contain.text", "KW-1017");

    cy.findByRole("link", { name: "Requests" }).click();
    cy.findByRole("table").findAllByRole("row").should("have.length", 8); // header + 7 open
    cy.findByRole("checkbox", { name: "Resolved" }).click();
    cy.findByRole("table").findAllByRole("row").should("have.length", 12); // header + 11 Maple Court
    cy.findByRole("table").should("not.contain.text", "Water heater leaking onto the floor");

    cy.findByRole("link", { name: "House rules" }).click();
    cy.findByRole("button", { name: "How many dogs or cats can I keep?" }).click();
    cy.findByRole("list", { name: "Sources" })
      .should("contain.text", "Maple Court Resident Handbook")
      .and("not.contain.text", "Harbor View");
    cy.checkPageA11y();
  });
});
