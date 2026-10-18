// E2E-5: the assistant cites the active building's rules, and says when it doesn't know.
const PETS = "How many dogs or cats can I keep?";

function ask(question: string) {
  cy.findByLabelText("Your question").clear().type(`${question}{enter}`);
}

describe("house rules assistant", () => {
  it("cites per building and falls back to I don't know", () => {
    cy.signInAs("coordinator");
    cy.visitFresh("/house-rules");
    cy.title().should("eq", "House rules · Harbor View Lofts · Keyway");
    cy.findByText("Answer mode: Retrieval").should("be.visible");
    cy.findByText("Answers come only from the house rules of Harbor View Lofts.").should("exist");

    ask(PETS);
    cy.findByRole("region", { name: "Answer" }).within(() => {
      cy.findByRole("link", { name: /^Source 1: .*§3\.1 Pets$/ }).should("be.visible");
      cy.findByRole("list", { name: "Sources" }).should(
        "contain.text",
        "Harbor View Lofts House Rules",
      );
    });
    cy.checkPageA11y();

    cy.findByRole("button", { name: /Switch building/ }).click();
    cy.findByRole("menuitemradio", { name: /Maple Court/ }).click();
    cy.title().should("eq", "House rules · Maple Court · Keyway");
    // The previous building's answer is cleared on switch.
    cy.findByRole("list", { name: "Sources" }).should("not.exist");

    cy.findByRole("button", { name: PETS }).click();
    cy.findByRole("region", { name: "Answer" }).within(() => {
      cy.findByRole("link", { name: /^Source 1: Maple Court Resident Handbook §2\.1 Pets$/ })
        .should("be.visible")
        .click();
      cy.findByRole("list", { name: "Sources" }).should("not.contain.text", "Harbor View");
    });

    ask("What is the Wi-Fi password?");
    cy.findByRole("region", { name: "Answer" }).within(() => {
      cy.findByText("I don't know. Check with the resident or your property manager.").should(
        "be.visible",
      );
      cy.findByRole("list", { name: "Sources" }).should("not.exist");
    });
    cy.checkPageA11y();
  });

  it("sends a resident to their coordinator when it doesn't know", () => {
    cy.signInAs("resident");
    cy.visitFresh("/house-rules");
    cy.findByRole("button", { name: /Switch building/ }).should("not.exist");
    ask("Is there a swimming pool or gym?");
    cy.findByRole("link", { name: "Message your coordinator" }).click();
    cy.location("pathname").should("eq", "/messages/req_030");
    cy.findByRole("heading", { name: "No messages yet" }).should("be.visible");
  });

  it("rejects very short questions inline", () => {
    cy.signInAs("resident");
    cy.visitFresh("/house-rules");
    ask("hi");
    cy.findByText("Ask a slightly longer question.").should("be.visible");
    cy.findByLabelText("Your question").should("have.attr", "aria-invalid", "true");
    cy.checkPageA11y();
  });
});
