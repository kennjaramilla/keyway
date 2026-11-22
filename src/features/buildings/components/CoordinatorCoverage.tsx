"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Select } from "@/components/ui/select";
import { SkeletonList } from "@/components/ui/skeleton";
import { useCoverage, useReassignCoordinator } from "../hooks";

/** The manager hands a building to another coordinator (story 1.5). */
export function CoordinatorCoverage() {
  const coverage = useCoverage();
  const reassign = useReassignCoordinator();

  return (
    <Card aria-labelledby="coverage-title">
      <CardHeader>
        <CardTitle id="coverage-title">Coordinators</CardTitle>
        <CardDescription>
          Who covers each building. Open requests move with the building.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {coverage.isPending ? (
          <SkeletonList rows={3} label="Loading coordinators" />
        ) : coverage.isError ? (
          <ErrorState onRetry={() => coverage.refetch()} retrying={coverage.isRefetching} />
        ) : (
          <ul className="divide-y divide-border">
            {coverage.data.buildings.map((building) => {
              const current = building.coordinatorIds[0] ?? "";
              const busy = reassign.isPending && reassign.variables?.buildingId === building.id;
              return (
                <li key={building.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  <label
                    htmlFor={`coverage-${building.id}`}
                    className="min-w-0 flex-1 font-medium text-fg"
                  >
                    {building.name}
                  </label>
                  <div className="w-full sm:w-56">
                    <Select
                      id={`coverage-${building.id}`}
                      value={current}
                      disabled={busy}
                      aria-busy={busy}
                      options={coverage.data.coordinators.map((person) => ({
                        value: person.id,
                        label: person.name,
                      }))}
                      onChange={(event) =>
                        reassign.mutate({
                          buildingId: building.id,
                          fromId: current,
                          toId: event.target.value,
                        })
                      }
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
