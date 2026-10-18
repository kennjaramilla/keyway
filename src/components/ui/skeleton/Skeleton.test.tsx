import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./Skeleton.stories";

const { List } = composeStories(stories);

describe("Skeleton", () => {
  it("announces loading once instead of reading every placeholder", () => {
    renderWithProviders(<List />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading requests");
  });
});
