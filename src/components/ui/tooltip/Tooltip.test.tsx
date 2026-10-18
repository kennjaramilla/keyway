import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./Tooltip.stories";

const { Default } = composeStories(stories);

describe("Tooltip", () => {
  it("shows on keyboard focus and hides on Escape", async () => {
    const { user } = renderWithProviders(<Default />);
    await user.tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent(/open longer than the target/);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
