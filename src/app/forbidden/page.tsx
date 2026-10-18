import type { Metadata } from "next";
import Link from "next/link";
import { ShieldX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "No access · Keyway" };

/** proxy.ts rewrites here when the role can't open a route. */
export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <ShieldX aria-hidden className="size-10 text-fg-subtle" />
      <h1 className="text-2xl font-semibold text-fg">You don&apos;t have access to this page</h1>
      <p className="text-fg-muted">
        Your role can&apos;t open this part of Keyway. If you think that&apos;s wrong, ask your
        property manager.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-2" })}>
        Go to your home page
      </Link>
    </main>
  );
}
