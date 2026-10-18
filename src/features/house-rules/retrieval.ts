import type { AssistantAnswer, RuleDocument, RulePassage } from "./schema";

/**
 * Deterministic retrieval over one building's passages (docs/spec/house-rules.md):
 * BM25 over title + text, naive plural stemming, a stopword list, a score
 * threshold and top-k. Pure, so the browser, the route handler and tests share it.
 */

export const FALLBACK_ANSWER = "I don't know. Please message your coordinator.";

export const RETRIEVAL = {
  k1: 1.2,
  b: 0.75,
  minScore: 1.5,
  relativeToTop: 0.5,
  topK: 3,
  // Extra guard: the top passage must match at least half the question's terms,
  // so one incidental word ("pay" in the laundry rule) can't answer "pay my rent online".
  minCoverage: 0.5,
} as const;

export const STOPWORDS: ReadonlySet<string> = new Set(
  `a about after all also am an and any are as at be been before being both but by can could
  d did do does doing for from had has have having he her here hers him his how i if in into is
  it its just ll m me might more most must my no nor not of off on once only or other our ours
  out over own re s same shall she should so some such t than that the their them then there
  these they this those through to too under until up us ve very was we were what when where
  which while who whom why will with would you your yours many much let get`
    .split(/\s+/)
    .filter(Boolean),
);

/** Strip "ing", "es" or "s" from words longer than 3 letters. */
export function stem(word: string) {
  if (word.length <= 3) return word;
  for (const suffix of ["ing", "es", "s"]) {
    if (word.endsWith(suffix)) return word.slice(0, -suffix.length);
  }
  return word;
}

/** Lowercase alphanumeric tokens, stopwords removed, stemmed. */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((word) => !STOPWORDS.has(word))
    .map(stem);
}

/** `coverage`: share of the question's distinct terms found in the passage. */
export type ScoredPassage = { passage: RulePassage; score: number; coverage: number };

/** BM25 score for every passage, best first (ties keep corpus order). */
export function scorePassages(question: string, passages: readonly RulePassage[]): ScoredPassage[] {
  const terms = [...new Set(tokenize(question))];
  const docs = passages.map((passage) => tokenize(`${passage.title} ${passage.text}`));
  const avgLength = docs.reduce((sum, doc) => sum + doc.length, 0) / (docs.length || 1);
  const { k1, b } = RETRIEVAL;

  const idf = new Map(
    terms.map((term) => {
      const df = docs.filter((doc) => doc.includes(term)).length;
      return [term, Math.log(1 + (docs.length - df + 0.5) / (df + 0.5))];
    }),
  );

  return passages
    .map((passage, index) => {
      const doc = docs[index] ?? [];
      const matched = terms.filter((term) => doc.includes(term)).length;
      const coverage = terms.length ? matched / terms.length : 0;
      const score = terms.reduce((sum, term) => {
        const tf = doc.filter((token) => token === term).length;
        if (tf === 0) return sum;
        const norm = tf + k1 * (1 - b + (b * doc.length) / avgLength);
        return sum + (idf.get(term) ?? 0) * ((tf * (k1 + 1)) / norm);
      }, 0);
      return { passage, score, coverage };
    })
    .sort((x, y) => y.score - x.score);
}

/** Passages to cite: score ≥ minScore and ≥ half the top score, at most topK. */
export function selectPassages(scored: readonly ScoredPassage[]): ScoredPassage[] {
  const top = scored[0];
  if (!top || top.score < RETRIEVAL.minScore || top.coverage < RETRIEVAL.minCoverage) return [];
  return scored
    .filter(
      ({ score }) => score >= RETRIEVAL.minScore && score >= top.score * RETRIEVAL.relativeToTop,
    )
    .slice(0, RETRIEVAL.topK);
}

const splitSentences = (text: string) => text.split(/(?<=[.!?])\s+(?=[A-Z0-9$(])/);

/** The sentence of a passage that shares the most terms with the question (earliest on ties). */
export function bestSentence(passage: RulePassage, question: string) {
  const terms = new Set(tokenize(question));
  let best = { sentence: passage.text, hits: -1 };
  for (const sentence of splitSentences(passage.text)) {
    const hits = new Set(tokenize(sentence).filter((token) => terms.has(token))).size;
    if (hits > best.hits) best = { sentence, hits };
  }
  return best.sentence.trim();
}

export type Citation = AssistantAnswer["citations"][number];

export function toCitation(n: number, passage: RulePassage, documents: readonly RuleDocument[]) {
  return {
    n,
    passageId: passage.id,
    section: passage.section,
    title: passage.title,
    documentTitle: documents.find((doc) => doc.id === passage.documentId)?.title ?? "House rules",
    excerpt: passage.text,
  } satisfies Citation;
}

export const dontKnow = (mode: AssistantAnswer["mode"] = "retrieval"): AssistantAnswer => ({
  mode,
  answer: FALLBACK_ANSWER,
  citations: [],
  answered: false,
});

/** Extractive answer: the best sentence of each cited passage, each followed by its [n]. */
export function answerQuestion(
  question: string,
  passages: readonly RulePassage[],
  documents: readonly RuleDocument[],
): AssistantAnswer {
  const cited = selectPassages(scorePassages(question, passages));
  if (cited.length === 0) return dontKnow();
  return {
    mode: "retrieval",
    answer: cited
      .map(({ passage }, index) => `${bestSentence(passage, question)} [${index + 1}]`)
      .join(" "),
    citations: cited.map(({ passage }, index) => toCitation(index + 1, passage, documents)),
    answered: true,
  };
}

/** Split text into plain and highlighted parts, marking words that match the question's terms. */
export function highlight(text: string, question: string) {
  const terms = new Set(tokenize(question));
  return text
    .split(/([A-Za-z0-9]+)/)
    .filter(Boolean)
    .map((part) => {
      const word = part.toLowerCase();
      const match = /^[a-z0-9]+$/.test(word) && !STOPWORDS.has(word) && terms.has(stem(word));
      return { text: part, match };
    });
}
