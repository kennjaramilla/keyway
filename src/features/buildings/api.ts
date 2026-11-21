import { api } from "@/lib/api-client";
import { coverageSchema, type ReassignCoordinatorInput } from "./schema";

export const buildingKeys = {
  coverage: ["buildings", "coverage"] as const,
};

export const fetchCoverage = (signal?: AbortSignal) =>
  api.get("/buildings/coverage", coverageSchema, { signal });

export const reassignCoordinator = ({
  buildingId,
  ...body
}: ReassignCoordinatorInput & { buildingId: string }) =>
  api.post(`/buildings/${buildingId}/coordinator`, coverageSchema, body);
