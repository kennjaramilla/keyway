import type { Result } from "axe-core";
import {
  DEMO_USER_IDS,
  SESSION_COOKIE,
  encodeSession,
  type Role,
} from "../../src/lib/auth/demo-users";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Sign in as a seeded demo user by setting the session cookie (no UI). */
      signInAs(role: Role): Chainable<void>;
      /** Visit a page with fresh seed data (clears the persisted mock db). */
      visitFresh(path: string): Chainable<AUTWindow>;
      /** Inject axe and fail on serious/critical WCAG A/AA violations. */
      checkPageA11y(context?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add("signInAs", (role: Role) => {
  cy.setCookie(SESSION_COOKIE, encodeSession({ role, userId: DEMO_USER_IDS[role] }));
});

Cypress.Commands.add("visitFresh", (path: string) => {
  return cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.clear();
    },
  });
});

function logViolations(violations: Result[]) {
  cy.task(
    "table",
    violations.map(({ id, impact, description, nodes }) => ({
      id,
      impact,
      description,
      nodes: nodes.length,
    })),
  );
}

Cypress.Commands.add("checkPageA11y", (context?: string) => {
  cy.injectAxe();
  cy.checkA11y(
    context,
    {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      includedImpacts: ["serious", "critical"],
    },
    logViolations,
  );
});

export {};
