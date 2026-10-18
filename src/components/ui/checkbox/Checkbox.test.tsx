import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./Checkbox.stories";

const { Unchecked, WithDescription } = composeStories(stories);

describe("Checkbox", () => {
  it("toggles by clicking its label", async () => {
    const onCheckedChange = vi.fn();
    const { user } = renderWithProviders(<Unchecked onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByText("Show resolved requests"));
    expect(screen.getByRole("checkbox", { name: "Show resolved requests" })).toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("toggles with the keyboard", async () => {
    const { user } = renderWithProviders(<Unchecked />);
    await user.tab();
    await user.keyboard(" ");
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("is described by its description", () => {
    renderWithProviders(<WithDescription />);
    expect(screen.getByRole("checkbox")).toHaveAccessibleDescription(
      "We'll email you when the status changes.",
    );
  });
});
