import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./Label.stories";

const { Required } = composeStories(stories);

describe("Label", () => {
  it("shows a decorative required marker that is not part of the name", () => {
    renderWithProviders(
      <>
        <Required htmlFor="title" />
        <input id="title" />
      </>,
    );
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden");
    expect(screen.getByRole("textbox")).toHaveAccessibleName("Describe the problem");
  });
});
