import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { dontKnow, FALLBACK_ANSWER, toCitation } from "./retrieval";
import type { AssistantAnswer, RuleDocument, RulePassage } from "./schema";

/** Claude mode for the assistant (used by /api/assistant when a key is set). */

export const CLAUDE_MODEL = "claude-sonnet-5-5";
export const CLAUDE_TIMEOUT_MS = 8_000;
/** Passages sent to Claude (the top retrieval results). */
export const CLAUDE_PASSAGES = 5;

export const SYSTEM_PROMPT = `You answer residents' questions about their apartment building's house rules.
Answer ONLY from the numbered passages provided. Do not use outside knowledge.
Cite every statement with the number of the passage it comes from, in square brackets, for example [1] or [2], matching the order the passages are given.
Use at most 3 sentences.
If the passages don't answer the question, reply with exactly this sentence and nothing else: ${FALLBACK_ANSWER}`;

/** Angle brackets are removed so a question can't close or open the prompt's XML-style tags. */
export function sanitizeQuestion(question: string) {
  return question.replace(/[<>]/g, "");
}

export function buildPrompt(question: string, passages: readonly RulePassage[]) {
  const sources = passages
    .map((passage, index) => `[${index + 1}] §${passage.section} ${passage.title}\n${passage.text}`)
    .join("\n\n");
  return `<passages>\n${sources}\n</passages>\n\n<question>\n${sanitizeQuestion(question)}\n</question>`;
}

/**
 * Validate Claude's reply: the exact fallback sentence, or text whose every
 * [n] maps to a provided passage. Throws on anything else.
 */
export function parseClaudeAnswer(
  text: string,
  passages: readonly RulePassage[],
  documents: readonly RuleDocument[],
): AssistantAnswer {
  const answer = text.trim();
  if (answer === FALLBACK_ANSWER) return dontKnow("claude");
  const numbers = [...answer.matchAll(/\[(\d+)\]/g)].map((match) => Number(match[1]));
  if (numbers.length === 0) throw new Error("Answer has no citations");
  const unique = [...new Set(numbers)].sort((a, b) => a - b);
  const citations = unique.map((n) => {
    const passage = passages[n - 1];
    if (!passage) throw new Error(`Citation [${n}] has no passage`);
    return toCitation(n, passage, documents);
  });
  return { mode: "claude", answer, citations, answered: true };
}

export async function askClaude(
  client: Anthropic,
  question: string,
  passages: readonly RulePassage[],
  documents: readonly RuleDocument[],
): Promise<AssistantAnswer> {
  const response = await client.messages.create(
    {
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: buildPrompt(question, passages) }],
    },
    { timeout: CLAUDE_TIMEOUT_MS, maxRetries: 0 },
  );
  if (response.stop_reason !== "end_turn") throw new Error(`Stopped: ${response.stop_reason}`);
  const text = response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("");
  return parseClaudeAnswer(text, passages, documents);
}
