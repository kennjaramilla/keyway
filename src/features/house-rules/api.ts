import { z } from "zod";
import { api } from "@/lib/api-client";
import { assistantAnswerSchema } from "./schema";

export const assistantModeSchema = z.object({ mode: assistantAnswerSchema.shape.mode });

export const assistantKeys = { mode: ["assistant", "mode"] as const };

/** Served by the Next route handler (src/app/api/assistant), not the mock API. */
export const fetchAssistantMode = () => api.get("/assistant", assistantModeSchema);

export const askHouseRules = (input: { buildingId: string; question: string }) =>
  api.post("/assistant", assistantAnswerSchema, input);
