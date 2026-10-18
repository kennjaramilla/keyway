"use client";

import { Building, ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentSession, useSwitchBuilding } from "@/features/session/hooks";
import { roleCan } from "@/lib/auth/permissions";
import { isPortfolioPath, pathAfterBuildingSwitch } from "@/lib/auth/routes";

/**
 * Active building: a menu for coordinators/managers with >1 building, static text otherwise.
 * Portfolio pages (the dashboard) cover every building, so they show "All buildings".
 */
export function BuildingSwitcher() {
  const { user, buildings, activeBuilding, unit } = useCurrentSession();
  const switchBuilding = useSwitchBuilding();
  const pathname = usePathname();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState("");
  const canSwitch = roleCan(user.role, "building:switch") && buildings.length > 1;

  if (isPortfolioPath(pathname)) {
    return (
      <p className="flex min-w-0 items-center gap-2 text-sm text-fg">
        <Building aria-hidden className="size-4 shrink-0 text-fg-muted" />
        <span className="truncate font-medium">All buildings</span>
      </p>
    );
  }

  const label = (
    <>
      <Building aria-hidden className="size-4 shrink-0 text-fg-muted" />
      <span className="truncate font-medium">{activeBuilding.name}</span>
      {unit && <span className="shrink-0 text-fg-muted">· Unit {unit.label}</span>}
    </>
  );

  return (
    <>
      {canSwitch ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="min-w-0 shrink"
              aria-label={`Building: ${activeBuilding.name}. Switch building`}
            >
              {label}
              <ChevronsUpDown aria-hidden className="text-fg-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuLabel>Switch building</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={activeBuilding.id}
              onValueChange={(buildingId) => {
                const target = buildings.find((building) => building.id === buildingId);
                if (!target || buildingId === activeBuilding.id) return;
                switchBuilding.mutate(buildingId, {
                  onSuccess: () => {
                    setAnnouncement(`Switched to ${target.name}`);
                    const next = pathAfterBuildingSwitch(pathname);
                    if (next) router.push(next);
                  },
                });
              }}
            >
              {buildings.map((building) => (
                <DropdownMenuRadioItem
                  key={building.id}
                  value={building.id}
                  className="flex-col items-start gap-0"
                >
                  <span>{building.name}</span>
                  <span className="text-xs text-fg-muted">{building.address}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <p className="flex min-w-0 items-center gap-2 text-sm text-fg">{label}</p>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
