"use client";

import { Building2, ChevronRight, Info } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { ROLE_LABELS, ROLES } from "@/lib/auth/demo-users";
import { useDemoPeople, useSignIn } from "../hooks";

const ROLE_HINTS = {
  resident: "Submit and track requests for your unit.",
  coordinator: "Work the request queue for the buildings you cover.",
  manager: "See the whole portfolio on the dashboard.",
} as const;

export function SignInScreen() {
  const people = useDemoPeople();
  const signIn = useSignIn();

  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Building2 aria-hidden className="size-5" /> Keyway
        </p>
        <h1 className="text-2xl font-semibold text-fg">Sign in to Keyway</h1>
        <p className="text-fg-muted">Choose a person to see the portal from their point of view.</p>
      </header>

      <p className="flex items-start gap-2 rounded-md border border-border bg-info-soft px-4 py-3 text-sm text-fg">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
        <span>
          <strong className="font-semibold">Demo only:</strong> no passwords. Data is fictional and
          stored in your browser.
        </span>
      </p>

      {people.isPending && <SkeletonList rows={4} label="Loading people" />}
      {people.isError && (
        <ErrorState onRetry={() => people.refetch()} retrying={people.isRefetching} />
      )}
      {signIn.isError && (
        <p role="alert" className="text-sm font-medium text-danger">
          Couldn&apos;t sign in. Please try again.
        </p>
      )}

      {people.data &&
        ROLES.map((role) => {
          const group = people.data.filter((person) => person.role === role);
          if (group.length === 0) return null;
          return (
            <section key={role} aria-labelledby={`role-${role}`} className="flex flex-col gap-2">
              <div>
                <h2 id={`role-${role}`} className="text-base font-semibold text-fg">
                  {ROLE_LABELS[role]}
                </h2>
                <p className="text-sm text-fg-muted">{ROLE_HINTS[role]}</p>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {group.map((person) => (
                  <li key={person.id}>
                    <button
                      type="button"
                      onClick={() => signIn.mutate(person.id)}
                      disabled={signIn.isPending}
                      aria-busy={
                        signIn.isPending && signIn.variables === person.id ? true : undefined
                      }
                      className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left shadow-sm transition-colors hover:border-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
                    >
                      <Avatar name={person.name} decorative />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-medium text-fg">{person.name}</span>
                        <span className="truncate text-sm text-fg-muted">{person.context}</span>
                      </span>
                      <ChevronRight aria-hidden className="size-4 text-fg-subtle" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </main>
  );
}
