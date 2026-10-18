---
name: qa
description: Review a Keyway change before it ships. Checks automated gates, permissions and tenant isolation, UI states, accessibility and code quality, then reports blocking issues. Use before opening or merging a PR.
---

# QA a change

Work through the checklist and report a verdict: **SHIP**, or **FIX** followed by a numbered list of blocking issues with file:line. Fix the blocking issues if you were asked to.

## 1. Automated gates

- `npm run check`: lint, typecheck, unit tests (coverage thresholds), build.
- `npm run build && npm run e2e`: Cypress on the production build, including axe.
- `npm run build-storybook` if `src/components/ui` changed.

## 2. Permissions and isolation (highest risk)

- Every new handler calls `sessionUser()` and `deny()`/`can()`. Out of scope returns 404, wrong role returns 403, bad input returns 422, and an invalid transition returns 409.
- Ownership fields come from the session, not the request body.
- List endpoints for coordinators only return the active building. Residents only see their own unit.
- Query keys for building-scoped data include `buildingId`. Switching buildings never shows the old building's data.
- The UI hides controls the user can't use, and there are tests for the denied paths.

## 3. UX states

- Loading skeleton, empty state with guidance, and error state with a working retry on every data view.
- Toasts confirm actions. Destructive or bulk actions confirm first or offer undo.
- The page title reads "Page · Building · Keyway".

## 4. Accessibility

- Everything works with the keyboard, focus is visible, the tab order is logical, Esc closes overlays and focus returns to the trigger.
- Inputs have labels; errors are tied to inputs with aria-describedby and announced.
- Status and urgency always have a text label. The light and dark themes both pass axe (Storybook a11y panel, `cy.checkPageA11y()`).
- Usable at 375px wide.

## 5. Code quality

- Code follows the feature-folder layout and the requests reference slice. There's no dead code, unused dependency or speculative abstraction.
- Types are strict, and API responses are parsed by Zod schemas.
- Comments are short and only explain why.
- Commits are one lowercase line each with no attribution. The PR body has a summary, bullets and Testing:.
