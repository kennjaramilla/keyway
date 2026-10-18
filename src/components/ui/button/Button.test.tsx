import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./Button.stories";

const { Primary, Loading, Disabled } = composeStories(stories);

describe("Button", () => {
  it("calls onClick when pressed", async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<Primary onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Submit request" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("defaults to type=button so it never submits a form by accident", () => {
    renderWithProviders(<Primary />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("is busy and disabled while loading", () => {
    renderWithProviders(<Loading />);
    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("does not fire when disabled", async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<Disabled onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders its child with button styles when asChild is set", () => {
    renderWithProviders(
      <Primary asChild>
        <a href="/requests/new">New request</a>
      </Primary>,
    );
    expect(screen.getByRole("link", { name: "New request" })).toHaveClass("bg-primary");
  });
});
