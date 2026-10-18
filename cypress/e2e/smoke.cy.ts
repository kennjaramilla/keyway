describe("smoke", () => {
  it("sends a signed-out visitor to the demo sign-in page", () => {
    cy.visitFresh("/");
    cy.location("pathname").should("eq", "/sign-in");
    cy.findByRole("heading", { level: 1, name: "Sign in to Keyway" }).should("be.visible");
    cy.findByText(/no passwords/i).should("be.visible");
    cy.findByRole("region", { name: "Resident" }).should("be.visible");
    cy.checkPageA11y();
  });
});
