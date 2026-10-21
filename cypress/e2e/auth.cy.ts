describe("sign-in and route gating", () => {
  const people = [
    {
      name: "Amara Okafor",
      home: "/requests",
      heading: "Requests",
      nav: ["Requests", "Messages", "House rules", "Billing"],
    },
    {
      name: "Grace Adeyemi",
      home: "/requests",
      heading: "Requests",
      nav: ["Requests", "Messages", "House rules", "Billing"],
    },
    {
      name: "Helena Brightwater",
      home: "/dashboard",
      heading: "Dashboard",
      nav: ["Dashboard", "Requests", "House rules", "Billing"],
    },
  ];

  people.forEach(({ name, home, heading, nav }) => {
    it(`signs in as ${name} from the role picker`, () => {
      cy.visitFresh("/sign-in");
      cy.findByRole("button", { name: new RegExp(name) }).click();
      cy.location("pathname").should("eq", home);
      cy.findByRole("heading", { level: 1, name: heading }).should("be.visible");
      cy.findByRole("navigation", { name: "Main" })
        .findAllByRole("link")
        .then((links) =>
          // Ignore an unread badge after a label.
          expect(
            [...links].map((link) => link.textContent?.replace(/ \d+\+? unread$/, "")),
          ).to.deep.equal(nav),
        );
      cy.findByRole("button", { name: new RegExp(`^${name}`) }).should("be.visible");
      cy.checkPageA11y();
    });
  });

  it("returns a signed-out deep link after signing in", () => {
    cy.visitFresh("/house-rules");
    cy.location("pathname").should("eq", "/sign-in");
    cy.findByRole("button", { name: /Amara Okafor/ }).click();
    cy.location("pathname").should("eq", "/house-rules");
  });

  it("keeps an off-site ?next on this site", () => {
    cy.visitFresh("/sign-in?next=/%5Cexample.com/x");
    cy.findByRole("button", { name: /Amara Okafor/ }).click();
    cy.location("pathname").should("eq", "/requests");
  });

  it("blocks a resident from the dashboard with a no-access page", () => {
    cy.signInAs("resident");
    cy.visitFresh("/dashboard");
    cy.location("pathname").should("eq", "/dashboard");
    cy.findByRole("heading", { name: "You don't have access to this page" }).should("be.visible");
    cy.checkPageA11y();
  });

  it("signs out", () => {
    cy.signInAs("coordinator");
    cy.visitFresh("/requests");
    cy.findByRole("button", { name: /^Grace Adeyemi/ }).click();
    cy.findByRole("menuitem", { name: "Sign out" }).click();
    cy.location("pathname").should("eq", "/sign-in");
    cy.getCookie("keyway_session").should("be.null");
  });
});
