// E2E-1: a resident submits a request (docs/spec/user-stories.md 2.1).
const PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const tomorrow = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(
    new Date(Date.now() + 86_400_000),
  );

describe("resident submits a request", () => {
  it("validates, previews a photo, submits and shows the new request", () => {
    cy.signInAs("resident");
    cy.visitFresh("/requests");
    cy.findByRole("link", { name: "New request" }).click();
    cy.findByRole("heading", { level: 1, name: "New request" }).should("be.visible");
    cy.title().should("eq", "New request · Harbor View Lofts · Keyway");
    cy.checkPageA11y();

    cy.findByRole("button", { name: "Submit request" }).click();
    cy.findByRole("combobox", { name: /^Category/ })
      .should("have.attr", "aria-invalid", "true")
      .and("have.focus");
    cy.findByText("Choose a category.").should("be.visible");
    cy.findByText("Choose at least one time window.").should("be.visible");
    cy.checkPageA11y();

    cy.findByRole("combobox", { name: /^Category/ }).select("Electrical");
    cy.findByLabelText(/^Title/).type("Bathroom exhaust fan rattles");
    cy.findByLabelText(/^Description/).type("The fan rattles loudly whenever it runs.");
    cy.findByRole("combobox", { name: /^Location in unit/ }).select("Bathroom");
    cy.findByLabelText("Date 1").type(tomorrow());
    cy.findByLabelText("Time of day 1").select("Morning (8–12)");
    cy.findByRole("button", { name: "Add another time" }).click();
    cy.findByLabelText("Date 2").type(tomorrow());
    cy.findByLabelText("Time of day 2").select("Evening (5–8)");
    cy.findByRole("radio", { name: "Yes" }).click();

    cy.findByLabelText("Photo (optional)").selectFile({
      contents: Cypress.Buffer.from(PNG, "base64"),
      fileName: "fan.png",
      mimeType: "image/png",
    });
    cy.findByRole("img", { name: "Preview of fan.png" }).should("be.visible");
    cy.findByText(/It isn't uploaded/).should("be.visible");

    cy.findByRole("button", { name: "Submit request" }).click();
    cy.location("pathname").should("match", /^\/requests\/req_/);
    cy.findByText("Request submitted").should("be.visible");
    cy.findByRole("heading", { level: 1, name: "Bathroom exhaust fan rattles" }).should(
      "be.visible",
    );
    cy.findByText(/KW-1031 · Unit 4B · Electrical/).should("be.visible");
    cy.findByRole("list", { name: "Timeline" }).findAllByRole("listitem").should("have.length", 1);
    cy.checkPageA11y();

    cy.findByRole("link", { name: "All requests" }).click();
    cy.findByRole("table", { name: /maintenance requests/i })
      .findAllByRole("row")
      .should("have.length", 7) // header + 5 seeded + the new one
      .eq(1)
      .should("contain.text", "KW-1031");
  });

  it("shows the emergency banner and makes preferred times optional", () => {
    cy.signInAs("resident");
    cy.visitFresh("/requests/new");
    cy.findByRole("combobox", { name: /^Urgency/ }).select("Emergency");
    cy.findByRole("alert").should("contain.text", "call 911 first");
    cy.findByRole("button", { name: "Submit request" }).click();
    cy.findByText("Choose a category.").should("be.visible");
    cy.findByText("Choose at least one time window.").should("not.exist");
    cy.checkPageA11y();
  });
});
