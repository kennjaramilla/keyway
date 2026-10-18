import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./IconButton.stories";

const { Ghost } = composeStories(stories);

describe("IconButton", () => {
  it("uses the label as its accessible name and hides the icon", async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<Ghost onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Open navigation" });
    expect(button.querySelector("svg")?.closest("[aria-hidden]")).not.toBeNull();
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
