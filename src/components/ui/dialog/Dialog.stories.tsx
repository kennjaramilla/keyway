import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "./Dialog";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="secondary">Reset demo data</Button>
      </DialogTrigger>
      <DialogContent
        title="Reset demo data?"
        description="This restores the original requests, messages and buildings. Your changes will be lost."
        footer={
          <>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="danger">Reset data</Button>
            </DialogClose>
          </>
        }
      />
    </Dialog>
  ),
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirm: Story = {};
export const Open: Story = { args: { defaultOpen: true } };
