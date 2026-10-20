import { z } from "zod";
import { api } from "@/lib/api-client";
import { assistantAnswerSchema, rulesSchema } from "./schema";

const assistantModeSchema = z.object({ mode: assistantAnswerSchema.shape.mode });

export const assistantKeys = { mode: ["assistant", "mode"] as const };

export const rulesKeys = {
  document: (buildingId: string) => ["rules", "document", buildingId] as const,
};

/** Served by the mock API, like the rest of the app's data. */
export const fetchRules = (buildingId: string, signal?: AbortSignal) =>
  api.get("/rules", rulesSchema, { query: { buildingId }, signal });

/** Served by the Next route handler (src/app/api/assistant), not the mock API. */
export const fetchAssistantMode = () => api.get("/assistant", assistantModeSchema);

export const askHouseRules = (input: { buildingId: string; question: string }) =>
  api.post("/assistant", assistantAnswerSchema, input);
