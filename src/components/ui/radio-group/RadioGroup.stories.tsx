import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RadioGroup, RadioGroupItem } from "./RadioGroup";

const meta = {
  title: "UI/RadioGroup",
  component: RadioGroup,
  args: { "aria-label": "Urgency" },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioGroupItem value="emergency" label="Emergency" />
      <RadioGroupItem value="high" label="High" />
      <RadioGroupItem value="normal" label="Normal" />
      <RadioGroupItem value="low" label="Low" disabled />
    </RadioGroup>
  ),
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithValue: Story = { args: { defaultValue: "normal" } };
export const Horizontal: Story = { args: { orientation: "horizontal", className: "flex gap-4" } };
