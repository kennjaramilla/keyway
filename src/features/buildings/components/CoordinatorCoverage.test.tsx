import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { signInAs } from "@/test/session";
import { renderWithProviders, screen } from "@/test/render";
import { CoordinatorCoverage } from "./CoordinatorCoverage";

describe("CoordinatorCoverage", () => {
  it("lets the manager hand Maple Court to Theo", async () => {
    signInAs("manager");
    const { user } = renderWithProviders(<CoordinatorCoverage />);
    const maple = await screen.findByRole("combobox", { name: "Maple Court" });
    expect(maple).toHaveDisplayValue("Grace Adeyemi");

    await user.selectOptions(maple, "usr_coord_theo");

    expect(await screen.findByText("Theo Marchetti now covers Maple Court.")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Maple Court" })).toHaveDisplayValue(
      "Theo Marchetti",
    );
  });

  it("explains a refused move and keeps the current coordinator", async () => {
    signInAs("manager");
    const { user } = renderWithProviders(<CoordinatorCoverage />);
    const linden = await screen.findByRole("combobox", { name: "The Linden" });

    await user.selectOptions(linden, "usr_coord_grace");

    expect(
      await screen.findByText("Theo Marchetti would have no buildings left."),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "The Linden" })).toHaveDisplayValue(
      "Theo Marchetti",
    );
  });

  it("offers a retry when coverage doesn't load", async () => {
    server.use(
      http.get("*/api/buildings/coverage", () => HttpResponse.json(null, { status: 500 })),
    );
    signInAs("manager");
    renderWithProviders(<CoordinatorCoverage />);
    expect(await screen.findByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
