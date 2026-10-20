"use client";

import { Fragment, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SkeletonList } from "@/components/ui/skeleton";
import { useCurrentSession } from "@/features/session/hooks";
import { formatDate } from "@/lib/datetime";
import { useRules } from "../hooks/useAssistant";
import type { RulePassage } from "../schema";

/** Anchor for a passage, so answers can link straight to it. */
export const passageAnchor = (passageId: string) => `rule-${passageId}`;

const matches = (passage: RulePassage, query: string) =>
  `${passage.section} ${passage.title} ${passage.text}`.toLowerCase().includes(query);

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.split(new RegExp(`(${escaped})`, "i")).map((part, index) =>
    part.toLowerCase() === query ? (
      <mark key={index} className="rounded-sm bg-warning-soft px-0.5 text-fg">
        {part}
      </mark>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

/** The active building's full rules: contents, a filter, and every passage. */
export function RulesDocument() {
  const { activeBuilding } = useCurrentSession();
  const rules = useRules(activeBuilding.id);
  const [filter, setFilter] = useState("");
  const query = filter.trim().toLowerCase();

  // A citation link (#rule-…) must land on its passage, even if the filter hides it.
  useEffect(() => {
    const reveal = () => {
      const id = window.location.hash.slice(1);
      if (!id.startsWith("rule-")) return;
      setFilter("");
      requestAnimationFrame(() => document.getElementById(id)?.focus());
    };
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);

  if (rules.isPending) return <SkeletonList rows={4} label="Loading the house rules" />;
  if (rules.isError) {
    return (
      <ErrorState
        className="max-w-3xl"
        title="Couldn't load the house rules"
        onRetry={() => rules.refetch()}
        retrying={rules.isRefetching}
      />
    );
  }

  const { document: rulesDoc, passages } = rules.data;
  const visible = query ? passages.filter((passage) => matches(passage, query)) : passages;

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Full house rules</CardTitle>
        <CardDescription>
          {/* A plain date: format it in UTC so it never shifts a day. */}
          {rulesDoc.title} · effective {formatDate(rulesDoc.effectiveDate, "UTC")}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <FormField label="Find a rule" hint="Filters the sections below, e.g. “bike” or “noise”.">
          {(control) => (
            <Input
              {...control}
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          )}
        </FormField>
        <p aria-live="polite" className="text-sm text-fg-muted">
          {query
            ? `${visible.length} of ${passages.length} sections match`
            : `${passages.length} sections`}
        </p>
        {visible.length > 0 && (
          <nav aria-label="Rules contents">
            <ul className="flex flex-wrap gap-2">
              {visible.map((passage) => (
                <li key={passage.id}>
                  <a
                    href={`#${passageAnchor(passage.id)}`}
                    className="inline-flex rounded-full border border-border px-3 py-1 text-sm text-fg hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    §{passage.section} {passage.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {visible.length === 0 ? (
          <p className="text-sm text-fg">
            No section mentions &ldquo;{filter.trim()}&rdquo;. Try another word, or ask the
            assistant above.
          </p>
        ) : (
          <div className="grid gap-4">
            {visible.map((passage) => (
              <section
                key={passage.id}
                id={passageAnchor(passage.id)}
                tabIndex={-1}
                aria-labelledby={`${passageAnchor(passage.id)}-title`}
                className="scroll-mt-24 rounded-md border border-border p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <h3
                  id={`${passageAnchor(passage.id)}-title`}
                  className="text-sm font-semibold text-fg"
                >
                  §{passage.section} {passage.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-fg">
                  <Highlighted text={passage.text} query={query} />
                </p>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
