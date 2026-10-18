import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./Tabs.stories";

const { Default } = composeStories(stories);

describe("Tabs", () => {
  it("switches panels with arrow keys", async () => {
    const { user } = renderWithProviders(<Default />);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Bar chart");
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Table" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("as a table");
  });
});
