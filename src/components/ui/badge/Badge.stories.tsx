import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge, StatusBadge } from "./Badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  args: { children: "Plumbing" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="neutral">Neutral</Badge>
      <Badge tone="info">Info</Badge>
      <Badge tone="primary">Primary</Badge>
      <Badge tone="success">Success</Badge>
      <Badge tone="warning">Warning</Badge>
      <Badge tone="danger">Danger</Badge>
    </div>
  ),
};
export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge tone="info">New</StatusBadge>
      <StatusBadge tone="primary">Triaged</StatusBadge>
      <StatusBadge tone="warning">Scheduled</StatusBadge>
      <StatusBadge tone="neutral">In progress</StatusBadge>
      <StatusBadge tone="success">Resolved</StatusBadge>
      <StatusBadge tone="danger">Overdue</StatusBadge>
    </div>
  ),
};
