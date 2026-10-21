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
      /** Visit a page with fresh seed data (clears the mock db, or re-seeds the real API). */
      visitFresh(path: string, options?: Partial<VisitOptions>): Chainable<AUTWindow>;
      /**
       * Inject axe and fail on serious/critical WCAG A/AA violations, in the light
       * theme and then the dark theme (moderate/minor issues are logged by the a11y addon in Storybook).
       */
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
  if (Cypress.env("REAL_API")) cy.request("POST", "/api/demo/reset");
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

const AXE_OPTIONS = {
  runOnly: { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
  // Serious and critical only: these block users; lower impacts are reviewed in Storybook.
  includedImpacts: ["serious", "critical"],
};

function setTheme(theme: "light" | "dark") {
  cy.document().then((doc) => {
    doc.documentElement.dataset.theme = theme;
  });
}

Cypress.Commands.add("checkPageA11y", (context?: string) => {
  cy.injectAxe();
  // No colour transitions, so contrast is measured on final colours after the theme flips.
  cy.document().then((doc) => {
    const style = doc.createElement("style");
    style.textContent = "*,*::before,*::after{transition:none!important}";
    doc.head.appendChild(style);
  });
  cy.document().then((doc) => {
    const original = doc.documentElement.dataset.theme === "dark" ? "dark" : "light";
    setTheme("light");
    cy.checkA11y(context, AXE_OPTIONS, logViolations);
    setTheme("dark");
    cy.checkA11y(context, AXE_OPTIONS, logViolations);
    setTheme(original);
  });
});

export {};

/** For tests that rely on the mock API's `?fail=` demo toggles, which the real API doesn't have. */
export const mockOnlyIt = (title: string, test: () => void) =>
  Cypress.env("REAL_API") ? it.skip(title, test) : it(title, test);
