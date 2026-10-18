"use client";

import { Gauge, LayoutList, MessageSquare, ScrollText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentSession } from "@/features/session/hooks";
import { roleCan } from "@/lib/auth/permissions";
import { NAV_ITEMS } from "@/lib/auth/routes";
import { cn } from "@/lib/cn";

const ICONS: Record<string, typeof Gauge> = {
  "/dashboard": Gauge,
  "/requests": LayoutList,
  "/messages": MessageSquare,
  "/house-rules": ScrollText,
};

export function SideNav() {
  const { user } = useCurrentSession();
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => roleCan(user.role, item.action));

  return (
    <nav
      aria-label="Main"
      className="border-b border-border bg-surface md:w-56 md:shrink-0 md:border-r md:border-b-0"
    >
      <ul className="flex gap-1 overflow-x-auto p-2 md:flex-col md:p-3">
        {items.map((item) => {
          const Icon = ICONS[item.href] ?? LayoutList;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-fg-muted hover:bg-surface-muted hover:text-fg",
                  active && "bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
