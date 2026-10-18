import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select } from "./Select";

const options = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "heating_cooling", label: "Heating & cooling" },
  { value: "pest", label: "Pests", disabled: true },
];

const meta = {
  title: "UI/Select",
  component: Select,
  args: { "aria-label": "Category", options, placeholder: "Choose a category" },
  decorators: [(Story) => <div className="w-72">{Story()}</div>],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { defaultValue: "electrical" } };
export const Invalid: Story = { args: { "aria-invalid": true } };
export const Disabled: Story = { args: { disabled: true } };
