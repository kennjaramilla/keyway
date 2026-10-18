import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./EmptyState.stories";

const { WithAction } = composeStories(stories);

describe("EmptyState", () => {
  it("shows a heading, guidance and an action", () => {
    renderWithProviders(<WithAction />);
    expect(screen.getByRole("heading", { level: 2, name: "No requests yet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New request" })).toBeInTheDocument();
  });

  it("takes a heading level for use inside a card", () => {
    renderWithProviders(<WithAction headingLevel={3} />);
    expect(screen.getByRole("heading", { level: 3, name: "No requests yet" })).toBeInTheDocument();
  });
});
