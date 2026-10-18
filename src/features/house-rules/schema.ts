import { z } from "zod";

export const ruleDocumentSchema = z.object({
  id: z.string(),
  buildingId: z.string(),
  title: z.string(),
  effectiveDate: z.iso.date(),
  version: z.number().int(),
});
export type RuleDocument = z.infer<typeof ruleDocumentSchema>;

export const rulePassageSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  buildingId: z.string(),
  section: z.string(),
  title: z.string(),
  text: z.string(),
});
export type RulePassage = z.infer<typeof rulePassageSchema>;

export const rulesQuestionSchema = z.object({
  buildingId: z.string(),
  question: z
    .string()
    .trim()
    .min(3, "Ask a slightly longer question.")
    .max(300, "Keep questions under 300 characters."),
});

export const assistantAnswerSchema = z.object({
  mode: z.enum(["retrieval", "claude"]),
  answer: z.string(),
  citations: z.array(
    z.object({
      n: z.number().int(),
      passageId: z.string(),
      section: z.string(),
      title: z.string(),
      excerpt: z.string(),
    }),
  ),
  answered: z.boolean(),
});
export type AssistantAnswer = z.infer<typeof assistantAnswerSchema>;
