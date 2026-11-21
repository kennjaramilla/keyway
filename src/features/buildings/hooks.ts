"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { buildingKeys, fetchCoverage, reassignCoordinator } from "./api";

/** Which coordinator covers which building (manager only). */
export function useCoverage() {
  return useQuery({
    queryKey: buildingKeys.coverage,
    queryFn: ({ signal }) => fetchCoverage(signal),
  });
}

export function useReassignCoordinator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reassignCoordinator,
    onSuccess: async (coverage, { buildingId, toId }) => {
      queryClient.setQueryData(buildingKeys.coverage, coverage);
      // Workload and open counts per coordinator change with the building.
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      const building = coverage.buildings.find((item) => item.id === buildingId)?.name;
      const person = coverage.coordinators.find((item) => item.id === toId)?.name;
      toast({
        title: "Coordinator changed",
        description: `${person} now covers ${building}.`,
        tone: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Couldn't change the coordinator",
        description: error instanceof ApiError ? error.message : "Try again.",
        tone: "danger",
      });
    },
  });
}
