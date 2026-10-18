import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found · Keyway" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold text-fg">Page not found</h1>
      <p className="text-fg-muted">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-2" })}>
        Go to your home page
      </Link>
    </main>
  );
}
