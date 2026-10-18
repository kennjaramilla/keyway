import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen, within } from "@/test/render";
import * as stories from "./Table.stories";

const { Sortable } = composeStories(stories);

function firstColumn() {
  const [, ...bodyRows] = screen.getAllByRole("row");
  return bodyRows.map((row) => within(row).getAllByRole("cell")[0]?.textContent);
}

describe("Table", () => {
  it("toggles sort direction and reports it via aria-sort", async () => {
    const { user } = renderWithProviders(<Sortable />);
    const header = screen.getByRole("columnheader", { name: /age/i });
    expect(header).toHaveAttribute("aria-sort", "ascending");
    expect(firstColumn()[0]).toMatch("KW-1030");

    await user.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "descending");
    expect(firstColumn()[0]).toMatch("KW-1017");
  });
});
