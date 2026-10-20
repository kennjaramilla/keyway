"use client";

import { Gauge, LayoutList, MessageSquare, ScrollText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadTotal } from "@/features/messages/hooks/useThreads";
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
  const unread = useUnreadTotal();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:static md:border-0 md:bg-transparent md:pb-0"
    >
      <ul className="flex justify-around md:flex-col md:gap-1 md:px-3">
        {items.map((item) => {
          const Icon = ICONS[item.href] ?? LayoutList;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const badge = item.href === "/messages" ? unread : 0;
          return (
            <li key={item.href} className="flex-1 md:flex-none">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={badge > 0 ? `${item.label}, ${badge} unread` : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium text-fg-muted",
                  "md:flex-row md:gap-3 md:rounded-lg md:px-3 md:py-2.5 md:text-sm md:text-sidebar-muted md:hover:bg-white/5 md:hover:text-sidebar-fg md:focus-visible:outline-sidebar-fg",
                  active && "text-primary md:bg-sidebar-active md:text-sidebar-fg",
                )}
              >
                <Icon aria-hidden className="size-5 md:size-4" />
                {item.label}
                {badge > 0 && (
                  <span
                    aria-hidden
                    className="absolute top-1 left-1/2 ml-1.5 min-w-5 rounded-full bg-primary px-1.5 text-center text-[11px] leading-5 font-semibold text-primary-fg md:static md:ml-auto md:bg-sidebar-fg md:text-sidebar"
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
