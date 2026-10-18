import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./FormField.stories";

const { Default, WithHint, WithError, RadioFieldset } = composeStories(stories);

describe("FormField", () => {
  it("labels the control", () => {
    renderWithProviders(<Default />);
    expect(screen.getByRole("textbox", { name: "Title" })).not.toHaveAttribute("aria-invalid");
  });

  it("describes the control with the hint", () => {
    renderWithProviders(<WithHint />);
    expect(screen.getByRole("textbox", { name: "Entry notes" })).toHaveAccessibleDescription(
      "Don't include door codes.",
    );
  });

  it("marks the control invalid and describes it with the error", () => {
    renderWithProviders(<WithError />);
    const input = screen.getByRole("textbox", { name: "Title" });
    expect(input).toBeInvalid();
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription("Use at least 5 characters.");
  });

  it("groups radios under a legend with the error", () => {
    renderWithProviders(<RadioFieldset />);
    expect(screen.getByRole("group", { name: "Permission to enter" })).toHaveAccessibleDescription(
      "Choose yes or no.",
    );
  });
});
