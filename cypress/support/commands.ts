import type { Result } from "axe-core";
import seed from "../../src/mocks/seed.json";
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
      /**
       * Sign in by setting the session cookie (no UI). Defaults: resident Amara,
       * coordinator Grace, manager Helena; pass a seeded userId for anyone else.
       */
      signInAs(role: Role, userId?: string): Chainable<void>;
      /** Visit a page with fresh seed data (clears the persisted mock db). */
      visitFresh(path: string, options?: Partial<VisitOptions>): Chainable<AUTWindow>;
      /** Inject axe and fail on serious/critical WCAG A/AA violations. */
      checkPageA11y(context?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add("signInAs", (role: Role, userId: string = DEMO_USER_IDS[role]) => {
  const user = seed.users.find((candidate) => candidate.id === userId);
  const activeBuildingId = user?.buildingIds[0];
  if (!user || user.role !== role || !activeBuildingId) {
    throw new Error(`No seeded ${role} with id ${userId}`);
  }
  cy.setCookie(
    SESSION_COOKIE,
    encodeURIComponent(encodeSession({ role, userId, activeBuildingId })),
  );
});

Cypress.Commands.add("visitFresh", (path: string, options: Partial<Cypress.VisitOptions> = {}) => {
  return cy.visit(path, {
    ...options,
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
