import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RangePicker } from "./RangePicker";

describe("RangePicker", () => {
  it("offers 7, 14 and 30 days as a radio group and reports the choice", async () => {
    const onChange = vi.fn();
    render(<RangePicker value={7} onChange={onChange} />);
    const group = screen.getByRole("radiogroup", { name: "Date range" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "7 days" })).toBeChecked();
    await userEvent.click(screen.getByRole("radio", { name: "14 days" }));
    expect(onChange).toHaveBeenCalledWith(14);
  });
});
