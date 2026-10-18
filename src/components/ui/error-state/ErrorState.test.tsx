import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen } from "@/test/render";
import * as stories from "./ErrorState.stories";

const { WithRetry, WithoutRetry } = composeStories(stories);

describe("ErrorState", () => {
  it("announces the error and retries on demand", async () => {
    const onRetry = vi.fn();
    const { user } = renderWithProviders(<WithRetry onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("hides the retry button without a handler", () => {
    renderWithProviders(<WithoutRetry />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
