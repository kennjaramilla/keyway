import { Fragment, useId } from "react";
import { useCurrentSession } from "@/features/session/hooks";
import type { AssistantAnswer } from "../schema";
import { highlight } from "../retrieval";
import { MessageCoordinatorButton } from "./MessageCoordinatorButton";

type Citation = AssistantAnswer["citations"][number];

/** Staff can't "message your coordinator"; the API's fallback sentence is written for residents. */
const STAFF_FALLBACK = "I don't know. Check with the resident or your property manager.";

const sourceLabel = (citation: Citation) =>
  `${citation.documentTitle} §${citation.section} ${citation.title}`;

/** Answer text with each [n] linked to its numbered source, plus the source passages. */
export function AnswerView({ question, answer }: { question: string; answer: AssistantAnswer }) {
  const id = useId();
  const { user } = useCurrentSession();
  const sourceId = (n: number) => `${id}-source-${n}`;

  if (!answer.answered) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-base text-fg">
          {user.role === "resident" ? answer.answer : STAFF_FALLBACK}
        </p>
        <MessageCoordinatorButton />
      </div>
    );
  }

  const parts = answer.answer.split(/(\[\d+\])/);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-base leading-relaxed text-fg">
        {parts.map((part, index) => {
          const n = Number(/^\[(\d+)\]$/.exec(part)?.[1]);
          const citation = answer.citations.find((c) => c.n === n);
          if (!citation) return <Fragment key={index}>{part}</Fragment>;
          return (
            <a
              key={index}
              href={`#${sourceId(n)}`}
              aria-label={`Source ${n}: ${sourceLabel(citation)}`}
              className="rounded-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              [{n}]
            </a>
          );
        })}
      </p>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-fg">Sources</h3>
        <ol aria-label="Sources" className="flex flex-col gap-3">
          {answer.citations.map((citation) => (
            <li
              key={citation.n}
              id={sourceId(citation.n)}
              tabIndex={-1}
              className="rounded-md border border-border bg-surface-muted p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="text-sm font-medium text-fg">
                [{citation.n}] {sourceLabel(citation)}
              </p>
              <p className="mt-1 text-sm text-fg-muted">
                {highlight(citation.excerpt, question).map((part, index) =>
                  part.match ? (
                    <mark key={index} className="rounded-sm bg-warning-soft px-0.5 text-fg">
                      {part.text}
                    </mark>
                  ) : (
                    <Fragment key={index}>{part.text}</Fragment>
                  ),
                )}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
