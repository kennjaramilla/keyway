import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChartPanel } from "./ChartPanel";
import { weekPoints } from "./dashboard.fixtures";
import { DonutChart } from "./DonutChart";
import { TrendChart } from "./TrendChart";

const meta = {
  title: "Dashboard/Charts",
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const onTime = [
  { label: "Met or on track", value: 25, color: "var(--chart-2)" },
  { label: "At risk (past halfway)", value: 1, color: "var(--chart-3)" },
  { label: "Breached", value: 4, color: "var(--chart-4)" },
];

export const Trend: Story = { render: () => <TrendChart points={weekPoints} /> };

export const TrendQuietWeek: Story = {
  render: () => (
    <TrendChart points={weekPoints.map((point) => ({ ...point, opened: 0, resolved: 0 }))} />
  ),
};

export const Donut: Story = {
  render: () => <DonutChart slices={onTime} centerValue="87%" centerLabel="on time" />,
};

export const DonutNoData: Story = {
  render: () => (
    <DonutChart
      slices={onTime.map((slice) => ({ ...slice, value: 0 }))}
      centerValue="–"
      centerLabel="on time"
    />
  ),
};

/** A chart inside its panel, with the "Show table" alternative. */
export const TrendInPanel: Story = {
  render: () => (
    <ChartPanel
      title="Request volume, last 7 days"
      summary="20 requests opened and 2 resolved this week."
      chart={<TrendChart points={weekPoints} />}
      table={{
        columns: ["Day", "Opened", "Resolved"],
        rows: weekPoints.map((point) => ({
          key: point.label,
          cells: [point.label, point.opened, point.resolved],
        })),
      }}
    />
  ),
};

export const BarsInPanel: Story = {
  render: () => (
    <ChartPanel
      title="Overdue by urgency"
      tone="danger"
      summary="4 requests past target: High 2, Normal 1, Low 1."
      bars={[
        { label: "Emergency", value: 0, display: "0" },
        { label: "High", value: 2, display: "2" },
        { label: "Normal", value: 1, display: "1" },
        { label: "Low", value: 1, display: "1" },
      ]}
      table={{
        columns: ["Urgency", "Overdue"],
        rows: [
          { key: "emergency", cells: ["Emergency", 0] },
          { key: "high", cells: ["High", 2] },
          { key: "normal", cells: ["Normal", 1] },
          { key: "low", cells: ["Low", 1] },
        ],
      }}
    />
  ),
};
