import { composeStories } from "@storybook/nextjs-vite";
import { act, renderWithProviders, screen } from "@/test/render";
import * as stories from "./Toast.stories";
import { useToastStore } from "./toast-store";

const { Success, WithUndo } = composeStories(stories);

afterEach(() => act(() => useToastStore.setState({ toasts: [] })));

describe("Toast", () => {
  it("shows a toast with title and description", async () => {
    const { user } = renderWithProviders(<Success />);
    await user.click(screen.getByRole("button", { name: "Show success" }));
    expect(await screen.findByText("Request submitted")).toBeInTheDocument();
    expect(screen.getByText("KW-1031 is now New.")).toBeInTheDocument();
  });

  it("runs the undo action and dismisses the toast", async () => {
    const { user } = renderWithProviders(<WithUndo />);
    await user.click(screen.getByRole("button", { name: "Archive filter" }));
    await user.click(await screen.findByRole("button", { name: "Undo" }));
    expect(await screen.findByText("Filter restored")).toBeInTheDocument();
    expect(screen.queryByText("Filter cleared")).not.toBeInTheDocument();
  });

  it("can be dismissed", async () => {
    const { user } = renderWithProviders(<Success />);
    await user.click(screen.getByRole("button", { name: "Show success" }));
    await user.click(await screen.findByRole("button", { name: "Dismiss notification" }));
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
