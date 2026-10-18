import { createSeed } from "@/mocks/seed";
import {
  answerQuestion,
  bestSentence,
  FALLBACK_ANSWER,
  highlight,
  scorePassages,
  selectPassages,
  stem,
  tokenize,
} from "./retrieval";

const { rulePassages, ruleDocuments } = createSeed();
const ask = (buildingId: string, question: string) =>
  answerQuestion(
    question,
    rulePassages.filter((passage) => passage.buildingId === buildingId),
    ruleDocuments,
  );
const cited = (buildingId: string, question: string) =>
  ask(buildingId, question).citations.map((citation) => citation.passageId);

describe("tokenize", () => {
  it("lowercases, drops stopwords and strips plurals from longer words", () => {
    expect(tokenize("How many Dogs or cats can I keep?")).toEqual(["dog", "cat", "keep"]);
    expect(tokenize("Wi-Fi")).toEqual(["wi", "fi"]);
    expect(stem("charging")).toBe("charg");
    expect(stem("gas")).toBe("gas");
    expect(stem("boxes")).toBe("box");
  });
});

// The sample questions and expected citations from docs/spec/house-rules.md.
describe("sample questions", () => {
  it.each([
    ["bld_harbor", "How many dogs or cats can I keep?", "hvl-pets", []],
    ["bld_maple", "How many dogs or cats can I keep?", "mpc-pets", []],
    ["bld_linden", "How many dogs or cats can I keep?", "lin-pets", []],
    ["bld_harbor", "What are the quiet hours?", "hvl-quiet-hours", ["hvl-laundry", "hvl-moving"]],
    ["bld_maple", "Can I install a washing machine in my apartment?", "mpc-laundry", []],
    ["bld_linden", "How do I let a vendor in when I'm not home?", "lin-smart-locks", []],
    ["bld_harbor", "Can I paint the brick wall?", "hvl-painting", []],
    ["bld_maple", "Who do I call if there is no heat?", "mpc-emergencies", ["mpc-heating"]],
    ["bld_linden", "Where are the EV charging stations?", "lin-parking", []],
    ["bld_harbor", "Can I use a charcoal grill on my balcony?", "hvl-balconies", []],
    ["bld_maple", "How long can overnight guests stay?", "mpc-guests", []],
    ["bld_linden", "How long are packages kept in the package room?", "lin-packages", []],
  ])("%s: %s cites %s first", (buildingId, question, first, mayAlso) => {
    const ids = cited(buildingId, question);
    expect(ids[0]).toBe(first);
    expect(ids.slice(1).every((id) => (mayAlso as string[]).includes(id))).toBe(true);
  });

  it("composes an extractive answer with numbered markers matching the citations", () => {
    const answer = ask("bld_harbor", "What are the quiet hours?");
    expect(answer).toMatchObject({ mode: "retrieval", answered: true });
    expect(answer.answer).toMatch(/^Quiet hours are 9:00 PM to 8:00 AM every day\. \[1\]/);
    expect(answer.citations.map((c) => c.n)).toEqual([1, 2, 3]);
    expect(answer.answer).toContain("[3]");
    expect(answer.citations[0]).toMatchObject({
      section: "2.1",
      title: "Quiet hours",
      documentTitle: "Harbor View Lofts House Rules & Lease Addendum",
    });
  });

  it("gives a different answer per building for the same question", () => {
    const question = "How many dogs or cats can I keep?";
    expect(ask("bld_harbor", question).answer).toContain("up to two dogs or cats");
    expect(ask("bld_maple", question).answer).toContain("under 25 lb");
    expect(ask("bld_linden", question).answer).toContain("under 50 lb");
  });
});

describe("I don't know", () => {
  it.each([
    "What is the Wi-Fi password?",
    "Is there a swimming pool or gym?",
    "How do I pay my rent online?",
  ])("%s has no answer in any building", (question) => {
    for (const buildingId of ["bld_harbor", "bld_maple", "bld_linden"]) {
      expect(ask(buildingId, question)).toEqual({
        mode: "retrieval",
        answer: FALLBACK_ANSWER,
        citations: [],
        answered: false,
      });
    }
  });

  it("needs a minimum score and half the top score to cite", () => {
    const passages = rulePassages.filter((p) => p.buildingId === "bld_harbor");
    const scored = scorePassages("What are the quiet hours?", passages);
    const chosen = selectPassages(scored);
    const top = scored[0]?.score ?? 0;
    expect(chosen.every(({ score }) => score >= 1.5 && score >= top / 2)).toBe(true);
    expect(selectPassages([{ passage: passages[0]!, score: 1.4, coverage: 1 }])).toEqual([]);
    expect(selectPassages([{ passage: passages[0]!, score: 3, coverage: 0.4 }])).toEqual([]);
    expect(selectPassages([])).toEqual([]);
  });
});

describe("helpers", () => {
  it("picks the sentence that shares the most terms with the question", () => {
    const pets = rulePassages.find((p) => p.id === "hvl-pets")!;
    expect(bestSentence(pets, "Is there a monthly pet fee?")).toMatch(/^A one-time fee of \$300/);
  });

  it("marks words that match the question's terms", () => {
    const parts = highlight("Dogs must be leashed.", "dog leash");
    expect(parts.filter((part) => part.match).map((part) => part.text)).toEqual(["Dogs"]);
    expect(parts.map((part) => part.text).join("")).toBe("Dogs must be leashed.");
  });
});
