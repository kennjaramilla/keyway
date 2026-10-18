import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bell, Menu, Trash2 } from "lucide-react";
import { IconButton } from "./IconButton";

const meta = {
  title: "UI/IconButton",
  component: IconButton,
  args: { label: "Open navigation", icon: <Menu /> },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ghost: Story = {};
export const Secondary: Story = {
  args: { variant: "secondary", label: "Notifications", icon: <Bell /> },
};
export const Danger: Story = {
  args: { variant: "danger", label: "Remove photo", icon: <Trash2 /> },
};
export const Small: Story = { args: { size: "sm" } };
