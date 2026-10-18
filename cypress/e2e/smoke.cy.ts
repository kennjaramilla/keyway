describe("smoke", () => {
  it("serves the home page with no accessibility violations", () => {
    cy.visitFresh("/");
    cy.findByRole("heading", { level: 1, name: /keyway/i }).should("be.visible");
    cy.checkPageA11y();
  });
});
