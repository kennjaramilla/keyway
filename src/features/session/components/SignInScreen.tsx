"use client";

import { ChevronRight, ClipboardList, Gauge, Info, Wrench } from "lucide-react";
import { BrandMark } from "@/components/shell/BrandMark";
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
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside
        aria-label="About Keyway"
        className="relative overflow-hidden bg-surface px-6 py-10 sm:px-10 lg:flex lg:flex-col lg:justify-center lg:px-14"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-32 -bottom-40 hidden size-[28rem] rounded-full bg-primary-soft lg:block"
        />
        <div className="relative flex max-w-lg flex-col gap-6">
          <BrandMark subtitle="Maintenance portal" />
          <p className="text-4xl leading-tight font-bold tracking-tight text-fg sm:text-5xl">
            Property maintenance, <span className="text-primary">from report to resolved.</span>
          </p>
          <span aria-hidden className="h-0.5 w-14 rounded-full bg-primary" />
          <p className="text-lg text-fg-muted">
            Residents report problems, coordinators triage and schedule vendors, and managers see
            the whole portfolio.
          </p>
          <ul className="grid gap-3 text-sm text-fg">
            {[
              { icon: Wrench, text: "Requests with photos, urgency and visit windows" },
              { icon: ClipboardList, text: "A coordinator queue with a clear workflow" },
              { icon: Gauge, text: "A portfolio dashboard with on-time performance" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"
                >
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-10 sm:py-16 lg:justify-center">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-fg">Sign in to Keyway</h1>
          <p className="text-fg-muted">
            Choose a person to see the portal from their point of view.
          </p>
        </header>

        <p className="flex items-start gap-2 rounded-md border border-border bg-info-soft px-4 py-3 text-sm text-fg">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
          <span>
            <strong className="font-semibold">Demo only:</strong> no passwords. Data is fictional
            and stored in your browser.
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
    </div>
  );
}
