import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./Select.stories";

const { Default } = composeStories(stories);

describe("Select", () => {
  it("renders the placeholder and options, and selects one", async () => {
    const { user } = renderWithProviders(<Default />);
    const select = screen.getByRole("combobox", { name: "Category" });
    expect(select).toHaveValue("");
    expect(screen.getByRole("option", { name: "Pests" })).toBeDisabled();
    await user.selectOptions(select, "heating_cooling");
    expect(select).toHaveValue("heating_cooling");
  });
});
