import "@testing-library/jest-dom/vitest";
import { setProjectAnnotations } from "@storybook/nextjs-vite";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { clearSessionCookie } from "@/lib/auth/session-cookie";
import { resetDb } from "@/mocks/db";
import { server } from "@/mocks/node";
import * as previewAnnotations from "../../.storybook/preview";
import { navigationState } from "./next-navigation";

vi.mock("next/navigation", async () => (await import("./next-navigation")).nextNavigationMock);

// Portable stories (composeStories) get the same decorators/parameters as Storybook.
setProjectAnnotations([previewAnnotations]);

// The same MSW handlers as the app. Unhandled requests fail the test.
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
beforeEach(() => {
  resetDb();
  navigationState.pathname = "/requests";
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
  clearSessionCookie();
  localStorage.clear();
});
afterAll(() => server.close());

// jsdom gaps that Radix primitives rely on.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};
