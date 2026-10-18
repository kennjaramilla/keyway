import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Info } from "lucide-react";
import { IconButton } from "../icon-button";
import { Tooltip, TooltipProvider } from "./Tooltip";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  decorators: [(Story) => <TooltipProvider delayDuration={0}>{Story()}</TooltipProvider>],
  args: {
    content: "Overdue: open longer than the target for its urgency.",
    children: <IconButton label="What does overdue mean?" icon={<Info />} />,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Bottom: Story = { args: { side: "bottom" } };
