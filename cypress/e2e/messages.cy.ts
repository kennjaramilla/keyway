import { mockOnlyIt } from "../support/commands";

// E2E-4: messaging between coordinator and resident, with optimistic send and rollback.
describe("messages", () => {
  it("lists conversations with unread counts", () => {
    cy.signInAs("coordinator");
    cy.visitFresh("/messages");
    cy.title().should("eq", "Messages · Harbor View Lofts · Keyway");
    cy.findByRole("list", { name: "Conversations" }).within(() => {
      cy.findAllByRole("link").should("have.length", 3);
      cy.findByRole("link", { name: /KW-1017/ }).should("contain.text", "1 unread");
    });
    cy.checkPageA11y();
  });

  it("delivers a coordinator reply to the resident", () => {
    const reply = "Plumber confirmed the cartridge is replaced. Can you check tonight?";
    cy.signInAs("coordinator");
    cy.visitFresh("/messages");
    cy.findByRole("link", { name: /KW-1017/ }).click();
    cy.findByRole("heading", { level: 1, name: /KW-1017/ }).should("be.visible");
    cy.findByRole("list", { name: "Conversation" }).should("contain.text", "Great, thank you!");

    cy.findByLabelText("Message Diego Santillán").type(`${reply}{enter}`);
    cy.findByLabelText("Message Diego Santillán").should("have.value", "").and("have.focus");
    cy.findByRole("list", { name: "Conversation" }).should("contain.text", reply);
    cy.findByText("Sending…").should("not.exist");
    cy.checkPageA11y();

    // Same browser db, different person: Diego sees the reply on his request.
    cy.signInAs("resident", "usr_res_diego");
    cy.visit("/messages");
    cy.findByRole("link", { name: /KW-1017/ })
      .should("contain.text", "1 unread")
      .click();
    cy.findByRole("list", { name: "Conversation" }).should("contain.text", reply);
    cy.checkPageA11y();
  });

  mockOnlyIt("rolls back a failed send and retries it (?fail=messages)", () => {
    const text = "Second note about the valve.";
    cy.signInAs("coordinator");
    cy.visitFresh("/messages/req_017?fail=messages");
    cy.findByLabelText("Message Diego Santillán").type(`${text}{enter}`);

    cy.findByText("Not sent").should("be.visible");
    cy.findByText("Message not sent").should("be.visible");
    cy.findByLabelText("Message Diego Santillán").should("have.value", text);
    cy.checkPageA11y();

    cy.findByRole("button", { name: "Retry" }).click();
    cy.findByText("Not sent").should("not.exist");
    cy.findByLabelText("Message Diego Santillán").should("have.value", "");
    cy.findByRole("list", { name: "Conversation" }).should("contain.text", text);
  });

  it("lets a resident start a general chat that the coordinator answers", () => {
    cy.signInAs("resident");
    cy.visitFresh("/messages");
    cy.findByRole("link", { name: "New chat" }).click();
    cy.findByRole("heading", { level: 1, name: "New chat" }).should("be.visible");
    cy.checkPageA11y();
    cy.findByRole("textbox", { name: /Subject/ }).type("Bike storage key");
    cy.findByRole("textbox", { name: /Message/ }).type("Where do I get a key for the bike room?");
    cy.findByRole("button", { name: "Start chat" }).click();

    cy.findByRole("heading", { level: 1, name: "Bike storage key" }).should("be.visible");
    cy.findByRole("list", { name: "Conversation" }).should("contain.text", "bike room");
    cy.findByRole("link", { name: "View request" }).should("not.exist");
    cy.checkPageA11y();

    cy.signInAs("coordinator");
    cy.visit("/messages");
    cy.findByRole("link", { name: /Bike storage key/ })
      .should("contain.text", "1 unread")
      .click();
    cy.findByLabelText("Message Amara Okafor").type("The front desk has them.{enter}");
    cy.findByRole("list", { name: "Conversation" }).should("contain.text", "front desk");
  });

  it("shows not found for another unit's conversation", () => {
    cy.signInAs("resident", "usr_res_diego");
    cy.visitFresh("/messages/req_023");
    cy.findByRole("heading", { name: "Conversation not found" }).should("be.visible");
    cy.checkPageA11y();
  });
});
