import { composeStories } from "@storybook/nextjs-vite";
import { renderWithProviders, screen, within } from "@/test/render";
import * as brand from "@/components/shell/BrandMark.stories";
import * as charts from "./Charts.stories";
import * as lists from "./PortfolioLists.stories";

const { Trend, Donut, DonutNoData, TrendInPanel } = composeStories(charts);
const { Buildings, BuildingWithoutData, Vendors } = composeStories(lists);
const { OnSidebar } = composeStories(brand);

describe("dashboard parts", () => {
  it("labels the trend series in a legend", () => {
    renderWithProviders(<Trend />);
    expect(screen.getByText("Opened")).toBeInTheDocument();
    expect(screen.getByText("Resolved")).toBeInTheDocument();
  });

  it("gives every donut slice a count and share as text", () => {
    renderWithProviders(<Donut />);
    expect(screen.getByText("87%")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(items).toEqual([
      "Met or on track25(83%)",
      "At risk (past halfway)1(3%)",
      "Breached4(13%)",
    ]);
  });

  it("shows 0% shares when there is nothing to chart", () => {
    renderWithProviders(<DonutNoData />);
    expect(screen.getAllByText("(0%)")).toHaveLength(3);
  });

  it("switches the trend panel to a 7-row table", async () => {
    const { user } = renderWithProviders(<TrendInPanel />);
    await user.click(screen.getByRole("button", { name: "Show table" }));
    const table = screen.getByRole("table", { name: "Request volume, last 7 days" });
    expect(within(table).getAllByRole("row")).toHaveLength(8);
  });

  it("lists buildings with open, overdue and on-time text", () => {
    renderWithProviders(<Buildings />);
    const harbor = screen.getByText("Harbor View Lofts").closest("li")!;
    expect(harbor).toHaveTextContent("7 open · 2 overdue");
    expect(harbor).toHaveTextContent("80% on time");
  });

  it("says No data when a building has nothing tracked", () => {
    renderWithProviders(<BuildingWithoutData />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("labels each vendor state in words", () => {
    renderWithProviders(<Vendors />);
    for (const label of ["On site", "Scheduled", "Assigned", "Available"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("Plumbing · 2 active jobs")).toBeInTheDocument();
  });

  it("renders the brand mark on the dark sidebar", () => {
    renderWithProviders(<OnSidebar />);
    expect(screen.getByText("Keyway")).toBeInTheDocument();
    expect(screen.getByText("Coordinator portal")).toBeInTheDocument();
  });
});
