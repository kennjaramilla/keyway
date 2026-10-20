"use client";

import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  MessageSquare,
  Plus,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCurrentSession } from "@/features/session/hooks";
import { can, roleCan } from "@/lib/auth/permissions";
import { cn } from "@/lib/cn";
import { useRequests } from "../hooks/useRequests";
import { isOpenStatus } from "../schema";

function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <li className="flex flex-1 flex-col gap-1 rounded-lg bg-white/10 px-3 py-2.5">
      <span aria-hidden className="text-sidebar-muted [&_svg]:size-4">
        {icon}
      </span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-sidebar-muted">{label}</span>
    </li>
  );
}

const ACTION_TONES = {
  primary: "bg-primary-soft text-primary",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
} as const;

function QuickAction({
  href,
  icon,
  label,
  tone,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  tone: keyof typeof ACTION_TONES;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex h-full flex-col items-center gap-2 rounded-lg border border-border bg-surface p-3 text-center text-sm font-medium text-fg shadow-sm transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span
          aria-hidden
          className={cn(
            "flex size-10 items-center justify-center rounded-lg [&_svg]:size-5",
            ACTION_TONES[tone],
          )}
        >
          {icon}
        </span>
        {label}
      </Link>
    </li>
  );
}

/** Resident home: greeting with request counts, then shortcuts to the things residents do most. */
export function ResidentOverview() {
  const { user, activeBuilding, unit } = useCurrentSession();
  const requests = useRequests();
  const list = requests.data ?? [];
  const open = list.filter((request) => isOpenStatus(request.status)).length;
  const scheduled = list.filter((request) => request.status === "scheduled").length;
  const resolved = list.filter((request) => request.status === "resolved").length;
  const firstName = user.name.split(" ")[0];

  return (
    <div className="mb-6 grid gap-5">
      <section
        aria-labelledby="resident-greeting"
        className="rounded-xl bg-sidebar p-5 text-sidebar-fg shadow-md"
      >
        <h2 id="resident-greeting" className="text-lg font-semibold">
          Hi {firstName}
        </h2>
        <p className="text-sm text-sidebar-muted">
          {activeBuilding.name}
          {unit && ` · Unit ${unit.label}`}
        </p>
        {requests.data && (
          <ul aria-label="Your requests at a glance" className="mt-4 flex gap-2">
            <Stat icon={<CircleDot />} value={open} label="Open" />
            <Stat icon={<CalendarClock />} value={scheduled} label="Visit booked" />
            <Stat icon={<CheckCircle2 />} value={resolved} label="Resolved" />
          </ul>
        )}
      </section>
      <section aria-labelledby="quick-actions">
        <h2 id="quick-actions" className="mb-3 text-base font-semibold text-fg">
          Quick actions
        </h2>
        <ul className="grid grid-cols-3 gap-3 sm:max-w-lg">
          {can(user, "request:create") && (
            <QuickAction
              href="/requests/new"
              icon={<Plus />}
              label="Report a problem"
              tone="primary"
            />
          )}
          {roleCan(user.role, "thread:view") && (
            <QuickAction
              href="/messages"
              icon={<MessageSquare />}
              label="Messages"
              tone="warning"
            />
          )}
          {roleCan(user.role, "rules:ask") && (
            <QuickAction
              href="/house-rules"
              icon={<BookOpen />}
              label="House rules"
              tone="success"
            />
          )}
        </ul>
      </section>
    </div>
  );
}
