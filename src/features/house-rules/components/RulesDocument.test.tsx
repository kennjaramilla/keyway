import { renderInWorkspace, screen, within } from "@/test/render";
import { compareSections } from "../schema";
import { RulesDocument } from "./RulesDocument";

const sections = () => screen.getAllByRole("region").filter((el) => el.id.startsWith("rule-"));

describe("RulesDocument", () => {
  it("lists every section of the active building's rules with contents links", async () => {
    renderInWorkspace(<RulesDocument />, { as: "resident" });
    expect(await screen.findByRole("heading", { name: "Full house rules" })).toBeInTheDocument();
    expect(
      screen.getByText(/Harbor View Lofts House Rules & Lease Addendum · effective/),
    ).toHaveTextContent("Jan 1, 2026");
    expect(sections()).toHaveLength(12);
    const contents = screen.getByRole("navigation", { name: "Rules contents" });
    expect(within(contents).getByRole("link", { name: "§3.1 Pets" })).toHaveAttribute(
      "href",
      "#rule-hvl-pets",
    );
    expect(screen.getByRole("region", { name: "§3.1 Pets" })).toHaveAttribute(
      "id",
      "rule-hvl-pets",
    );
  });

  it("filters sections and highlights the match", async () => {
    const { user } = renderInWorkspace(<RulesDocument />, { as: "resident" });
    await user.type(await screen.findByRole("searchbox", { name: "Find a rule" }), "bike");
    expect(screen.getByText("1 of 12 sections match")).toBeInTheDocument();
    const [only] = sections();
    expect(only).toHaveAccessibleName("§5.1 Parking and bicycles");
    expect(
      within(only!)
        .getAllByText(/bike/i)
        .every((el) => el.tagName === "MARK"),
    ).toBe(true);

    await user.clear(screen.getByRole("searchbox", { name: "Find a rule" }));
    await user.type(screen.getByRole("searchbox", { name: "Find a rule" }), "trampoline");
    expect(screen.getByText(/No section mentions “trampoline”/)).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Rules contents" })).not.toBeInTheDocument();
  });

  it("orders section numbers numerically", () => {
    expect(["10.1", "2.1", "3.2", "3.10"].sort(compareSections)).toEqual([
      "2.1",
      "3.2",
      "3.10",
      "10.1",
    ]);
  });
});
