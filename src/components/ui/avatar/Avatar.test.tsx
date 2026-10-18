import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import { initials } from "./Avatar";
import * as stories from "./Avatar.stories";

const { Initials } = composeStories(stories);

describe("Avatar", () => {
  it("shows initials with the full name as its accessible name", () => {
    renderWithProviders(<Initials />);
    expect(screen.getByRole("img", { name: "Grace Adeyemi" })).toHaveTextContent("GA");
  });

  it.each([
    ["Mei-Lin Castellano", "MC"],
    ["Helena", "H"],
    ["  ", "?"],
  ])("initials(%j) is %s", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
