import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildingHealth, vendors } from "./dashboard.fixtures";
import { BuildingHealthList, VendorStatusList } from "./PortfolioLists";

const meta = {
  title: "Dashboard/Portfolio lists",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Buildings: Story = {
  render: () => <BuildingHealthList className="max-w-2xl" rows={buildingHealth} />,
};

export const BuildingWithoutData: Story = {
  render: () => (
    <BuildingHealthList
      className="max-w-2xl"
      rows={[{ ...buildingHealth[2]!, open: 0, onTimePct: null }]}
    />
  ),
};

/** One vendor in each state: on site, scheduled, assigned, available. */
export const Vendors: Story = {
  render: () => <VendorStatusList className="max-w-sm" rows={vendors} />,
};
