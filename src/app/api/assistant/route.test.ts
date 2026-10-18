import { SESSION_COOKIE, encodeSession } from "@/lib/auth/demo-users";
import { FALLBACK_ANSWER } from "@/features/house-rules/retrieval";
import { assistantAnswerSchema } from "@/features/house-rules/schema";
import { GET, POST } from "./route";

const create = vi.hoisted(() => vi.fn());
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create };
  },
}));
vi.mock("next/server", () => ({ connection: () => Promise.resolve() }));

const cookie = (role: string, userId: string, activeBuildingId: string) =>
  `${SESSION_COOKIE}=${encodeURIComponent(encodeSession({ role: role as "resident", userId, activeBuildingId }))}`;
const AMARA = cookie("resident", "usr_res_amara", "bld_harbor");
const GRACE_MAPLE = cookie("coordinator", "usr_coord_grace", "bld_maple");

function ask(body: unknown, sessionCookie: string | null = AMARA) {
  return POST(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(sessionCookie && { cookie: sessionCookie }),
      },
      body: JSON.stringify(body),
    }),
  );
}

const claudeReply = (text: string, stop_reason = "end_turn") =>
  create.mockResolvedValueOnce({ stop_reason, content: [{ type: "text", text }] });

const PETS = "How many dogs or cats can I keep?";

afterEach(() => vi.unstubAllEnvs());

describe("GET /api/assistant", () => {
  it("reports the answer mode from the server environment", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(await (await GET()).json()).toEqual({ mode: "retrieval" });
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    expect(await (await GET()).json()).toEqual({ mode: "claude" });
  });
});

describe("POST /api/assistant", () => {
  it("answers with retrieval and never calls Claude without a key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const response = await ask({ buildingId: "bld_harbor", question: PETS });
    const answer = assistantAnswerSchema.parse(await response.json());
    expect(answer.mode).toBe("retrieval");
    expect(answer.citations[0]?.passageId).toBe("hvl-pets");
    expect(create).not.toHaveBeenCalled();
  });

  it("uses Claude with the top passages when a key is set", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    claudeReply("You can keep up to two dogs or cats, with a one-time $300 fee per pet [1].");
    const answer = assistantAnswerSchema.parse(
      await (await ask({ buildingId: "bld_harbor", question: PETS })).json(),
    );
    expect(answer).toMatchObject({ mode: "claude", answered: true });
    expect(answer.citations.map((c) => c.passageId)).toEqual(["hvl-pets"]);

    const [params, options] = create.mock.calls[0] ?? [];
    expect(params).toMatchObject({ model: "claude-sonnet-5-5" });
    expect(params.system).toContain("ONLY from the numbered passages");
    expect(params.messages[0].content).toContain("[1] §3.1 Pets");
    expect(params.messages[0].content).not.toContain("mpc-");
    expect(options).toMatchObject({ timeout: 8000, maxRetries: 0 });
  });

  it("passes Claude's 'I don't know' through", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    claudeReply(FALLBACK_ANSWER);
    const answer = await (
      await ask({ buildingId: "bld_harbor", question: "Where is the pet relief area?" })
    ).json();
    expect(answer).toEqual({
      mode: "claude",
      answer: FALLBACK_ANSWER,
      citations: [],
      answered: false,
    });
  });

  it.each([
    ["an SDK error", () => create.mockRejectedValueOnce(new Error("timeout"))],
    ["a citation to a passage it wasn't given", () => claudeReply("Two pets [9].")],
    ["an answer without citations", () => claudeReply("Two pets.")],
    ["a refusal", () => claudeReply("", "refusal")],
  ])("falls back to retrieval on %s", async (_, arrange) => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    arrange();
    const answer = await (await ask({ buildingId: "bld_harbor", question: PETS })).json();
    expect(answer.mode).toBe("retrieval");
    expect(answer.citations[0].passageId).toBe("hvl-pets");
  });

  it("skips Claude when no passage matches at all", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    const answer = await (
      await ask({ buildingId: "bld_harbor", question: "What is the Wi-Fi password?" })
    ).json();
    expect(answer).toMatchObject({ mode: "retrieval", answered: false, answer: FALLBACK_ANSWER });
    expect(create).not.toHaveBeenCalled();
  });

  it("scopes the corpus to the coordinator's active building", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const answer = await (
      await ask({ buildingId: "bld_maple", question: PETS }, GRACE_MAPLE)
    ).json();
    expect(answer.citations[0].passageId).toBe("mpc-pets");
    // Covered but not active, or not covered at all: 404.
    expect((await ask({ buildingId: "bld_harbor", question: PETS }, GRACE_MAPLE)).status).toBe(404);
    expect((await ask({ buildingId: "bld_maple", question: PETS })).status).toBe(404);
  });

  it("rejects missing sessions (401), tampered sessions (401) and short questions (422)", async () => {
    expect((await ask({ buildingId: "bld_harbor", question: PETS }, null)).status).toBe(401);
    const forged = cookie("manager", "usr_res_amara", "bld_harbor");
    expect((await ask({ buildingId: "bld_harbor", question: PETS }, forged)).status).toBe(401);
    expect((await ask({ buildingId: "bld_harbor", question: "hi" })).status).toBe(422);
  });
});
