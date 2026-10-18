import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./Input.stories";

const { Default, Disabled } = composeStories(stories);

describe("Input", () => {
  it("accepts typing", async () => {
    const { user } = renderWithProviders(<Default />);
    await user.type(screen.getByRole("textbox", { name: "Title" }), "Leak");
    expect(screen.getByRole("textbox")).toHaveValue("Leak");
  });

  it("can be disabled", () => {
    renderWithProviders(<Disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
