import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "../input";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import { Select } from "../select";
import { Textarea } from "../textarea";
import { Fieldset, FormField } from "./FormField";

const meta = {
  title: "UI/FormField",
  component: FormField,
  args: { label: "Title", children: (props) => <Input {...props} /> },
  decorators: [(Story) => <div className="w-96">{Story()}</div>],
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHint: Story = {
  args: {
    label: "Entry notes",
    hint: "Don't include door codes.",
    children: (props) => <Textarea {...props} />,
  },
};
export const WithError: Story = {
  args: {
    label: "Title",
    required: true,
    error: "Use at least 5 characters.",
    children: (props) => <Input defaultValue="Leak" {...props} />,
  },
};
export const WithSelect: Story = {
  args: {
    label: "Category",
    required: true,
    children: (props) => (
      <Select
        placeholder="Choose a category"
        options={[
          { value: "plumbing", label: "Plumbing" },
          { value: "electrical", label: "Electrical" },
        ]}
        {...props}
      />
    ),
  },
};
export const RadioFieldset: Story = {
  render: () => (
    <Fieldset legend="Permission to enter" required error="Choose yes or no.">
      <RadioGroup aria-label="Permission to enter">
        <RadioGroupItem value="yes" label="Yes, staff may enter if I'm out" />
        <RadioGroupItem value="no" label="No, only when I'm home" />
      </RadioGroup>
    </Fieldset>
  ),
};
