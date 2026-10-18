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

/** Main nav: a column in the dark sidebar on desktop, a fixed bottom tab bar on phones. */
export function SideNav() {
  const { user } = useCurrentSession();
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => roleCan(user.role, item.action));

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:static md:border-0 md:bg-transparent md:pb-0"
    >
      <ul className="flex justify-around md:flex-col md:gap-1 md:px-3">
        {items.map((item) => {
          const Icon = ICONS[item.href] ?? LayoutList;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1 md:flex-none">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium text-fg-muted",
                  "md:flex-row md:gap-3 md:rounded-lg md:px-3 md:py-2.5 md:text-sm md:text-sidebar-muted md:hover:bg-white/5 md:hover:text-sidebar-fg md:focus-visible:outline-sidebar-fg",
                  active && "text-primary md:bg-sidebar-active md:text-sidebar-fg",
                )}
              >
                <Icon aria-hidden className="size-5 md:size-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
