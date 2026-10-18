import "@testing-library/jest-dom/vitest";
import { setProjectAnnotations } from "@storybook/nextjs-vite";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import * as previewAnnotations from "../../.storybook/preview";

// Portable stories (composeStories) get the same decorators/parameters as Storybook.
setProjectAnnotations([previewAnnotations]);

afterEach(() => {
  cleanup();
});

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
