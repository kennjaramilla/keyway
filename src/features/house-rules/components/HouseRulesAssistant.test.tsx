import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { routeAssistantToHandler } from "@/test/assistant-route";
import { renderInWorkspace, screen, within } from "@/test/render";
import { HouseRulesAssistant } from "./HouseRulesAssistant";

vi.mock("next/server", () => ({ connection: () => Promise.resolve() }));

beforeEach(() => {
  vi.stubEnv("ANTHROPIC_API_KEY", "");
  routeAssistantToHandler();
});
afterEach(() => vi.unstubAllEnvs());

const answer = () => screen.findByRole("region", { name: "Answer" });

describe("HouseRulesAssistant", () => {
  it("shows the retrieval badge and the building's suggested questions", async () => {
    renderInWorkspace(<HouseRulesAssistant />, { as: "resident" });
    expect(await screen.findByText("Answer mode: Retrieval")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Can I use a charcoal grill on my balcony?" }),
    ).toBeInTheDocument();
  });

  it("answers with numbered citations linked to highlighted sources", async () => {
    const { user } = renderInWorkspace(<HouseRulesAssistant />, { as: "resident" });
    await user.type(
      await screen.findByLabelText("Your question"),
      "How many dogs or cats can I keep?",
    );
    await user.click(screen.getByRole("button", { name: "Ask" }));

    const region = await answer();
    const marker = await within(region).findByRole("link", {
      name: "Source 1: Harbor View Lofts House Rules & Lease Addendum §3.1 Pets",
    });
    const sources = within(region).getByRole("list", { name: "Sources" });
    const source = within(sources).getByRole("listitem");
    expect(marker.getAttribute("href")).toBe(`#${source.id}`);
    expect(source).toHaveTextContent("§3.1 Pets");
    expect(
      within(source)
        .getAllByText(/^(dogs|cats)$/)
        .every((el) => el.tagName === "MARK"),
    ).toBe(true);
    expect(region).toHaveTextContent("up to two dogs or cats");
    expect(
      within(source).getByRole("link", { name: "Read §3.1 in the full rules" }),
    ).toHaveAttribute("href", "#rule-hvl-pets");
  });

  it("cites the active building's rules for the same question", async () => {
    const { user } = renderInWorkspace(<HouseRulesAssistant />, {
      as: "coordinator",
      buildingId: "bld_maple",
    });
    await user.click(
      await screen.findByRole("button", { name: "How many dogs or cats can I keep?" }),
    );
    const region = await answer();
    expect(
      await within(region).findByText(/Maple Court Resident Handbook §2\.1 Pets/),
    ).toBeInTheDocument();
    expect(region).not.toHaveTextContent("Harbor View");
  });

  it("says it doesn't know, with a way to reach the coordinator", async () => {
    const { user } = renderInWorkspace(<HouseRulesAssistant />, { as: "resident" });
    await user.type(
      await screen.findByLabelText("Your question"),
      "What is the Wi-Fi password?{Enter}",
    );
    const region = await answer();
    expect(
      await within(region).findByText("I don't know. Please message your coordinator."),
    ).toBeInTheDocument();
    expect(within(region).queryByRole("list", { name: "Sources" })).not.toBeInTheDocument();
    // Amara's newest open request is KW-1030.
    expect(
      await within(region).findByRole("link", { name: "Message your coordinator" }),
    ).toHaveAttribute("href", "/messages/req_030");
  });

  it("offers coordinators their inbox and staff wording instead", async () => {
    const { user } = renderInWorkspace(<HouseRulesAssistant />, { as: "coordinator" });
    await user.type(
      await screen.findByLabelText("Your question"),
      "Is there a swimming pool or gym?{Enter}",
    );
    expect(
      await within(await answer()).findByText(
        "I don't know. Check with the resident or your property manager.",
      ),
    ).toBeInTheDocument();
    expect(
      await within(await answer()).findByRole("link", { name: "Go to messages" }),
    ).toHaveAttribute("href", "/messages");
  });

  it("rejects questions shorter than 3 characters inline", async () => {
    const { user } = renderInWorkspace(<HouseRulesAssistant />, { as: "resident" });
    const input = await screen.findByLabelText("Your question");
    await user.type(input, "hi{Enter}");
    expect(await screen.findByText("Ask a slightly longer question.")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows an error with a working retry", async () => {
    server.use(
      http.post(
        "*/api/assistant",
        () => HttpResponse.json({ title: "Boom", status: 500 }, { status: 500 }),
        {
          once: true,
        },
      ),
    );
    const { user } = renderInWorkspace(<HouseRulesAssistant />, { as: "resident" });
    await user.click(await screen.findByRole("button", { name: "What are the quiet hours?" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't get an answer");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await within(await answer()).findByRole("list", { name: "Sources" }),
    ).toBeInTheDocument();
  });

  it("shows the Claude badge when the server has a key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    renderInWorkspace(<HouseRulesAssistant />, { as: "resident" });
    expect(await screen.findByText("Answer mode: Claude")).toBeInTheDocument();
  });
});
