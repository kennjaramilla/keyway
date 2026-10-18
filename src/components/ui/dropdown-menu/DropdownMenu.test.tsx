import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./DropdownMenu.stories";

const { UserMenu } = composeStories(stories);

describe("DropdownMenu", () => {
  it("opens with the keyboard and lists its items", async () => {
    const { user } = renderWithProviders(<UserMenu />);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: "System" })).toBeChecked();
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const { user } = renderWithProviders(<UserMenu />);
    await user.tab();
    await user.keyboard("{Enter}");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
