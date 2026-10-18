import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ErrorState } from "./ErrorState";

const meta = {
  title: "UI/ErrorState",
  component: ErrorState,
  args: { onRetry: () => {} },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithRetry: Story = {};
export const Retrying: Story = { args: { retrying: true } };
export const WithoutRetry: Story = {
  args: {
    onRetry: undefined,
    title: "Request not found",
    description: "It may have been removed, or it isn't in your building.",
  },
};
