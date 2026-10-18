import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./Card.stories";

const { Default } = composeStories(stories);

describe("Card", () => {
  it("is a region named by its title", () => {
    renderWithProviders(<Default />);
    expect(screen.getByRole("region", { name: "Average time to resolve" })).toHaveTextContent(
      "2.1 days",
    );
  });
});
