import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  args: { defaultValue: "chart" },
  render: (args) => (
    <Tabs {...args} className="w-96">
      <TabsList aria-label="Open requests view">
        <TabsTrigger value="chart">Chart</TabsTrigger>
        <TabsTrigger value="table">Table</TabsTrigger>
      </TabsList>
      <TabsContent value="chart">Bar chart of open requests by building.</TabsContent>
      <TabsContent value="table">The same numbers as a table.</TabsContent>
    </Tabs>
  ),
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SecondSelected: Story = { args: { defaultValue: "table" } };
