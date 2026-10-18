"use client";

import { ChevronDown, LogOut, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentSession, useResetDemoData, useSignOut } from "@/features/session/hooks";
import { ROLE_LABELS } from "@/lib/auth/demo-users";
import { useWorkspaceStore, type ThemePreference } from "@/stores/workspace-store";

export function UserMenu() {
  const { user } = useCurrentSession();
  const signOut = useSignOut();
  const resetDemo = useResetDemoData();
  const theme = useWorkspaceStore((state) => state.theme);
  const setTheme = useWorkspaceStore((state) => state.setTheme);
  const [confirmReset, setConfirmReset] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={triggerRef} variant="ghost" size="sm" className="h-10 gap-2 px-2">
            <Avatar name={user.name} size="sm" decorative />
            <span className="flex flex-col items-start leading-tight">
              <span className="sr-only text-sm font-medium sm:not-sr-only">{user.name}</span>
              <span className="hidden text-xs text-fg-muted sm:block">
                {ROLE_LABELS[user.role]}
              </span>
            </span>
            <ChevronDown aria-hidden className="text-fg-muted" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          <DropdownMenuLabel className="text-sm text-fg">
            {user.name}
            <span className="block text-xs font-normal text-fg-muted">
              {ROLE_LABELS[user.role]} · {user.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value) => setTheme(value as ThemePreference)}
          >
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setConfirmReset(true)}>
            <RotateCcw aria-hidden /> Reset demo data
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => signOut.mutate()}>
            <LogOut aria-hidden /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent
          title="Reset demo data?"
          description="This restores the original requests, messages and buildings. Changes you made in this browser will be lost."
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
          footer={
            <>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                variant="danger"
                loading={resetDemo.isPending}
                onClick={() =>
                  resetDemo.mutate(undefined, { onSettled: () => setConfirmReset(false) })
                }
              >
                Reset data
              </Button>
            </>
          }
        />
      </Dialog>
    </>
  );
}
