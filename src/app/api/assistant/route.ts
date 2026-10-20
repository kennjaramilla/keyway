import Anthropic from "@anthropic-ai/sdk";
import { connection } from "next/server";
import { z } from "zod";
import { askClaude, CLAUDE_PASSAGES } from "@/features/house-rules/claude";
import { answerQuestion, scorePassages } from "@/features/house-rules/retrieval";
import {
  rulesQuestionSchema,
  ruleDocumentSchema,
  rulePassageSchema,
} from "@/features/house-rules/schema";
import { userSchema } from "@/features/session/schema";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth/demo-users";
import { authorize, type Subject } from "@/lib/auth/permissions";
import { createRateLimiter } from "@/lib/rate-limit";
import seed from "@/mocks/seed.json";

/**
 * House-rules assistant. Retrieval always runs; Claude is used only when
 * ANTHROPIC_API_KEY is set on the server, and any failure falls back to retrieval.
 * The rules corpus and people are static seed data, so this reads them directly.
 */

const users = z.array(userSchema).parse(seed.users);
const passages = z.array(rulePassageSchema).parse(seed.rulePassages);
const documents = z.array(ruleDocumentSchema).parse(seed.ruleDocuments);

const problem = (
  status: number,
  title: string,
  extra?: Record<string, unknown>,
  headers?: HeadersInit,
) => Response.json({ title, status, ...extra }, { status, headers });

/** Questions per person per minute: protects the Claude key from a runaway client. */
export const ASK_LIMIT = 10;
export const askLimiter = createRateLimiter({ limit: ASK_LIMIT, windowMs: 60_000 });

function readCookie(header: string | null, name: string) {
  const entry = header?.split(/;\s*/).find((part) => part.startsWith(`${name}=`));
  return entry?.slice(name.length + 1);
}

function subjectFrom(request: Request): Subject | null {
  const session = decodeSession(readCookie(request.headers.get("cookie"), SESSION_COOKIE));
  const user = session && users.find((candidate) => candidate.id === session.userId);
  if (!session || !user || user.role !== session.role) return null;
  const activeBuildingId = user.buildingIds.includes(session.activeBuildingId)
    ? session.activeBuildingId
    : user.buildingIds[0];
  return activeBuildingId ? { ...user, activeBuildingId } : null;
}

/** Which mode answers will use, for the UI badge. */
export async function GET() {
  await connection();
  return Response.json({ mode: process.env.ANTHROPIC_API_KEY ? "claude" : "retrieval" });
}

export async function POST(request: Request) {
  const subject = subjectFrom(request);
  if (!subject) return problem(401, "Not signed in");
  const allowed = askLimiter.take(subject.id);
  if (!allowed.ok) {
    return problem(
      429,
      "Too many questions",
      { detail: `You're asking quickly. Try again in ${allowed.retryAfter} seconds.` },
      { "Retry-After": String(allowed.retryAfter) },
    );
  }

  const parsed = rulesQuestionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return problem(422, "Validation failed", {
      errors: z.flattenError(parsed.error).fieldErrors,
    });
  }
  const { buildingId, question } = parsed.data;
  const decision = authorize(subject, "rules:ask", { buildingId });
  if (decision === "not_found") return problem(404, "Not found");
  if (decision === "forbidden") return problem(403, "Forbidden");

  const corpus = passages.filter((passage) => passage.buildingId === buildingId);
  const retrieval = answerQuestion(question, corpus, documents);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json(retrieval);

  const top = scorePassages(question, corpus)
    .filter(({ score }) => score > 0)
    .slice(0, CLAUDE_PASSAGES)
    .map(({ passage }) => passage);
  if (top.length === 0) return Response.json(retrieval);

  try {
    return Response.json(await askClaude(new Anthropic({ apiKey }), question, top, documents));
  } catch (error) {
    console.warn("Assistant: Claude answer unavailable, using retrieval.", (error as Error).name);
    return Response.json(retrieval);
  }
}
