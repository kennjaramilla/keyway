import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./Textarea.stories";

const { Default } = composeStories(stories);

describe("Textarea", () => {
  it("accepts multi-line text", async () => {
    const { user } = renderWithProviders(<Default />);
    await user.type(screen.getByRole("textbox", { name: "Description" }), "Line 1{enter}Line 2");
    expect(screen.getByRole("textbox")).toHaveValue("Line 1\nLine 2");
  });
});
