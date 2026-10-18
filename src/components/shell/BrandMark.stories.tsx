import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BrandMark } from "./BrandMark";

const meta = {
  title: "Shell/BrandMark",
  component: BrandMark,
  args: { subtitle: "Maintenance portal" },
} satisfies Meta<typeof BrandMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnLight: Story = {};
export const OnSidebar: Story = {
  args: { onDark: true, subtitle: "Coordinator portal" },
  decorators: [
    (Story) => (
      <div className="rounded-lg bg-sidebar p-4">
        <Story />
      </div>
    ),
  ],
};
export const WordmarkOnly: Story = { args: { subtitle: undefined } };
