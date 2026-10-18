# 0003. Radix primitives + Tailwind tokens for the component library

- Status: accepted
- Date: 2026-10-19

## Context

The UI has to be production quality: accessible (WCAG AA, keyboard-first), themeable (light and dark), consistent and quick to build with. Behaviour such as focus traps, menus, tabs and tooltips is hard to get right by hand.

## Decision

- **Radix UI primitives** (`radix-ui`) provide behaviour and ARIA for Dialog, DropdownMenu, Tabs, Tooltip, Checkbox, RadioGroup, Toast, Avatar and Label. We own all styling.
- **Design tokens** are CSS variables in `src/app/globals.css` (colour, radius, type scale, shadows) with a light and a dark set, switched by `data-theme` on `<html>`. Tailwind v4 `@theme inline` exposes them as utilities (`bg-surface`, `text-fg-muted`, `border-border`). Components never use raw colours. Text and background pairs meet 4.5:1, and UI boundaries meet 3:1.
- **Select is a styled native `<select>`**: it has the best mobile and assistive-technology support, it works directly with React Hook Form, and it needs no jsdom workarounds.
- **Status is never colour alone**: `StatusBadge` pairs a text label with a tone-specific icon shape.
- Each component lives in `src/components/ui/<name>/` with its stories (every state) and a test that reuses the stories through `composeStories`. Storybook runs the a11y addon with `a11y.test = "error"` and has a theme switcher. Variants use `class-variance-authority`, and `cn()` merges classes.
- The set stays lean: we only build what the features use. Add a component when a second feature needs it.

## Consequences

- Accessible behaviour comes for free and is tested once in the library.
- Re-theming means editing the token values, not the components.
- Radix needs a few jsdom shims in `src/test/setup.ts` (ResizeObserver, pointer capture).
- In Vitest, portable stories use the plain React renderer (aliased in `vitest.config.mts`), because the Next.js Storybook framework aliases React internals that Vitest can't load. UI components must not depend on Next.js APIs.
