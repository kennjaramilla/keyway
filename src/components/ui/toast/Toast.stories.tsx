import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../button";
import { Toaster } from "./Toaster";
import { toast } from "./toast-store";

const meta = {
  title: "UI/Toast",
  component: Toaster,
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

function Trigger({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="secondary" onClick={onClick}>
      {label}
    </Button>
  );
}

export const Success: Story = {
  render: () => (
    <>
      <Trigger
        label="Show success"
        onClick={() =>
          toast({ title: "Request submitted", description: "KW-1031 is now New.", tone: "success" })
        }
      />
      <Toaster />
    </>
  ),
};

export const WithUndo: Story = {
  render: () => (
    <>
      <Trigger
        label="Archive filter"
        onClick={() =>
          toast({
            title: "Filter cleared",
            action: { label: "Undo", onAction: () => toast({ title: "Filter restored" }) },
          })
        }
      />
      <Toaster />
    </>
  ),
};

export const Danger: Story = {
  render: () => (
    <>
      <Trigger
        label="Show error"
        onClick={() =>
          toast({
            title: "Message not sent",
            description: "Check your connection.",
            tone: "danger",
          })
        }
      />
      <Toaster />
    </>
  ),
};
