import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Avatar } from "./Avatar";

const meta = {
  title: "UI/Avatar",
  component: Avatar,
  args: { name: "Grace Adeyemi" },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};
export const Small: Story = { args: { size: "sm", name: "Theo Marchetti" } };
export const SingleName: Story = { args: { name: "Helena" } };
