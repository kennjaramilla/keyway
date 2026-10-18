import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./RadioGroup.stories";

const { Default, WithValue } = composeStories(stories);

describe("RadioGroup", () => {
  it("selects an option by label", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(<Default onValueChange={onValueChange} />);
    await user.click(screen.getByText("High"));
    expect(screen.getByRole("radio", { name: "High" })).toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith("high");
  });

  it("moves focus between options with arrow keys", async () => {
    const { user } = renderWithProviders(<WithValue />);
    await user.tab();
    expect(screen.getByRole("radio", { name: "Normal" })).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("radio", { name: "High" })).toHaveFocus();
  });

  it("disables individual options", () => {
    renderWithProviders(<Default />);
    expect(screen.getByRole("radio", { name: "Low" })).toBeDisabled();
  });
});
