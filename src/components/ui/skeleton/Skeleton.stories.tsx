import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton, SkeletonList } from "./Skeleton";

const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: { layout: "padded" },
  args: { className: "h-6 w-64" },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {};
export const List: Story = { render: () => <SkeletonList rows={4} label="Loading requests" /> };
