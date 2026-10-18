import { z } from "zod";
import { api } from "@/lib/api-client";
import { demoPeopleSchema, sessionSchema } from "./schema";

export const sessionKeys = {
  current: ["session"] as const,
  people: ["session", "demo-people"] as const,
};

export const fetchSession = () => api.get("/session", sessionSchema);
export const fetchDemoPeople = () => api.get("/demo/people", demoPeopleSchema);
export const signIn = (userId: string) => api.post("/session", sessionSchema, { userId });
export const signOut = () => api.delete("/session", z.null());
export const switchBuilding = (buildingId: string) =>
  api.put("/session/building", sessionSchema, { buildingId });
export const resetDemoData = () => api.post("/demo/reset", z.null());
