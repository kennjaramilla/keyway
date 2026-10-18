import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MessageSquare } from "lucide-react";
import { Button } from "../button";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "UI/EmptyState",
  component: EmptyState,
  args: {
    title: "No requests yet",
    description:
      "When something in your unit needs fixing, submit a request and we'll take it from there.",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithAction: Story = { args: { action: <Button>New request</Button> } };
export const CustomIcon: Story = {
  args: {
    title: "No messages",
    description: "Messages about a request appear here.",
    icon: <MessageSquare />,
  },
};
