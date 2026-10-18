import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./Badge.stories";

const { Neutral, StatusBadges } = composeStories(stories);

describe("Badge", () => {
  it("renders its label", () => {
    renderWithProviders(<Neutral />);
    expect(screen.getByText("Plumbing")).toBeInTheDocument();
  });

  it("status badges always carry a text label and a decorative icon", () => {
    renderWithProviders(<StatusBadges />);
    const resolved = screen.getByText("Resolved");
    expect(resolved.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
