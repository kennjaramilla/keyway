import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./Dialog.stories";

const { Confirm } = composeStories(stories);

describe("Dialog", () => {
  it("opens from its trigger with a name and description", async () => {
    const { user } = renderWithProviders(<Confirm />);
    await user.click(screen.getByRole("button", { name: "Reset demo data" }));
    const dialog = screen.getByRole("dialog", { name: "Reset demo data?" });
    expect(dialog).toHaveAccessibleDescription(/restores the original requests/);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const { user } = renderWithProviders(<Confirm />);
    const trigger = screen.getByRole("button", { name: "Reset demo data" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes from the Cancel button", async () => {
    const { user } = renderWithProviders(<Confirm />);
    await user.click(screen.getByRole("button", { name: "Reset demo data" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
