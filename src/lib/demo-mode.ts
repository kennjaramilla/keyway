/**
 * Demo mode (ADR 0005): the sign-in page lists seeded people and anyone can become them.
 * On unless NEXT_PUBLIC_DEMO_MODE=off. Read on each call so tests can flip it.
 */
export const isDemoMode = () => process.env.NEXT_PUBLIC_DEMO_MODE !== "off";

/** Where "Continue with single sign-on" goes when demo mode is off. Unset means not configured. */
export const ssoUrl = () => process.env.NEXT_PUBLIC_SSO_URL || null;
