import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Plus } from "lucide-react";
import { Button } from "./Button";

const meta = {
  title: "UI/Button",
  component: Button,
  args: { children: "Submit request" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary", "ghost", "danger", "link"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary", children: "Cancel" } };
export const Ghost: Story = { args: { variant: "ghost", children: "Clear filters" } };
export const Danger: Story = { args: { variant: "danger", children: "Reset demo data" } };
export const Link: Story = { args: { variant: "link", children: "View timeline" } };
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Plus aria-hidden /> New request
      </>
    ),
  },
};
export const Loading: Story = { args: { loading: true, children: "Saving" } };
export const Disabled: Story = { args: { disabled: true } };
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};
