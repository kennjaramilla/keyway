import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Keyway" };

// proxy.ts redirects "/" to sign-in or the role's home; this is only a fallback.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-2 p-6">
      <h1 className="text-2xl font-semibold">Keyway</h1>
      <Link href="/sign-in" className="text-primary underline">
        Sign in
      </Link>
    </main>
  );
}
