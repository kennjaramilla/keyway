// E2E-3: a coordinator works KW-1030 from New to Resolved (docs/spec/user-stories.md 2.5).
describe("coordinator workflow", () => {
  it("finds KW-1030 in the queue and works it to resolved", () => {
    cy.signInAs("coordinator");
    cy.visitFresh("/requests");
    cy.findByRole("checkbox", { name: "Triaged" }).click();
    cy.findByRole("checkbox", { name: "Scheduled" }).click();
    cy.findByRole("checkbox", { name: "In progress" }).click();
    cy.location("search").should("eq", "?status=new");
    cy.findByRole("columnheader", { name: /urgency/i }).within(() =>
      cy.findByRole("button").click(),
    );
    cy.findByRole("columnheader", { name: /urgency/i }).should(
      "have.attr",
      "aria-sort",
      "descending",
    );
    cy.findByRole("table")
      .findAllByRole("row")
      .eq(1)
      .should("contain.text", "KW-1030")
      .and("contain.text", "Emergency");
    cy.checkPageA11y();

    // Filters survive a reload because they live in the URL.
    cy.reload();
    cy.findByRole("checkbox", { name: "Triaged" }).should("have.attr", "aria-checked", "false");

    cy.findByRole("link", { name: "Water heater leaking onto the floor" }).click();
    cy.findByRole("heading", { level: 1, name: "Water heater leaking onto the floor" });
    cy.checkPageA11y();

    cy.findByRole("button", { name: "Triage" }).click();
    cy.findByRole("dialog", { name: "Triage KW-1030" }).within(() => {
      cy.findByRole("button", { name: "Mark triaged" }).click();
    });
    cy.findByText("KW-1030 triaged").should("be.visible");

    cy.findByRole("button", { name: "Assign vendor" }).click();
    cy.findByRole("dialog", { name: /assign a vendor/i }).within(() => {
      cy.findByRole("radio", { name: /Tidewater Plumbing Co\./ }).click();
      cy.checkPageA11y();
      cy.findByRole("button", { name: "Assign vendor" }).click();
    });
    cy.findByText("KW-1030 assigned to a vendor").should("be.visible");

    cy.findByRole("button", { name: "Schedule visit" }).click();
    cy.findByRole("dialog", { name: /schedule the visit/i }).within(() => {
      cy.findByLabelText(/^End/).clear().type("09:00");
      cy.findByRole("button", { name: "Schedule visit" }).click();
      cy.findByText("End the visit after it starts.").should("be.visible");
      cy.findByLabelText(/^End/).clear().type("12:00");
      cy.findByRole("button", { name: "Schedule visit" }).click();
    });
    cy.findByText("KW-1030 scheduled").should("be.visible");
    cy.findByText(/\(building time\)/).should("be.visible");

    cy.findByRole("button", { name: "Mark in progress" }).click();
    cy.findByText("KW-1030 marked in progress").should("be.visible");

    cy.findByRole("button", { name: "Resolve" }).click();
    cy.findByRole("dialog", { name: "Resolve KW-1030" }).within(() => {
      cy.findByLabelText(/Resolution note/).type("Replaced the relief valve and dried the closet.");
      cy.findByRole("button", { name: "Resolve request" }).click();
    });
    cy.findByText("KW-1030 resolved").should("be.visible");
    cy.findByRole("list", { name: "Timeline" }).findAllByRole("listitem").should("have.length", 6);
    cy.findByRole("group", { name: "Workflow actions" }).should("not.exist");
    cy.checkPageA11y();

    cy.findByRole("link", { name: "All requests" }).click();
    cy.findByText("KW-1030").should("not.exist"); // resolved leaves the open queue
  });
});
