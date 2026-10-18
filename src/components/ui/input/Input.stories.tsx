import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./Input";

const meta = {
  title: "UI/Input",
  component: Input,
  args: { "aria-label": "Title", placeholder: "e.g. Kitchen sink is leaking" },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Filled: Story = { args: { defaultValue: "Bathroom fan is noisy" } };
export const Invalid: Story = { args: { "aria-invalid": true, defaultValue: "Fan" } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "KW-1001" } };
