import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChargeStatusBadge } from "./ChargeStatusBadge";

const meta = {
  title: "Billing/Charge status",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Each status has its own label and icon shape, not just a colour. */
export const All: Story = {
  render: () => (
    <div className="flex gap-2">
      <ChargeStatusBadge status="due" />
      <ChargeStatusBadge status="overdue" />
      <ChargeStatusBadge status="paid" />
    </div>
  ),
};
