"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentSession } from "@/features/session/hooks";
import { ApiError } from "@/lib/api-client";
import { useAskHouseRules, useAssistantMode } from "../hooks/useAssistant";
import { rulesQuestionSchema } from "../schema";
import { suggestionsFor } from "../suggestions";
import { AnswerView } from "./AnswerView";

const questionForm = rulesQuestionSchema.pick({ question: true });
type QuestionForm = { question: string };

const MODE_LABELS = { retrieval: "Retrieval", claude: "Claude" } as const;

/** "Ask the house rules": answers only from the active building's passages, with citations. */
export function HouseRulesAssistant() {
  const { activeBuilding } = useCurrentSession();
  const mode = useAssistantMode();
  const ask = useAskHouseRules();
  const [asked, setAsked] = useState<string | null>(null);
  const form = useForm<QuestionForm>({
    resolver: zodResolver(questionForm),
    defaultValues: { question: "" },
  });

  const submit = (question: string) => {
    setAsked(question);
    ask.mutate({ buildingId: activeBuilding.id, question });
  };
  const answerMode = ask.data?.mode ?? mode.data?.mode ?? "retrieval";

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Ask the house rules</CardTitle>
            <Badge tone="neutral">
              <Sparkles aria-hidden />
              Answer mode: {MODE_LABELS[answerMode]}
            </Badge>
          </div>
          <CardDescription>
            Ask about pets, noise, parking, moving and more. Every answer links to the passage it
            comes from.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            noValidate
            className="flex flex-col gap-3 sm:flex-row sm:items-start"
            onSubmit={form.handleSubmit(({ question }) => submit(question.trim()))}
          >
            <FormField
              label="Your question"
              error={form.formState.errors.question?.message}
              className="flex-1"
            >
              {(control) => (
                <Input
                  {...control}
                  {...form.register("question")}
                  placeholder="For example: Can I paint my walls?"
                  autoComplete="off"
                />
              )}
            </FormField>
            <Button type="submit" className="sm:mt-6" loading={ask.isPending}>
              Ask
            </Button>
          </form>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-fg-muted">Try asking:</p>
            <ul className="flex flex-wrap gap-2">
              {suggestionsFor(activeBuilding.id).map((question) => (
                <li key={question}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-auto py-1.5 whitespace-normal"
                    onClick={() => {
                      form.setValue("question", question, { shouldValidate: false });
                      form.clearErrors();
                      submit(question);
                    }}
                  >
                    {question}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <section aria-label="Answer" aria-live="polite" aria-busy={ask.isPending}>
        {ask.isPending && (
          <div className="flex flex-col gap-2">
            <span className="sr-only">Looking up the answer</span>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}
        {ask.isError && asked && (
          <ErrorState
            title="Couldn't get an answer"
            description={
              ask.error instanceof ApiError && ask.error.status === 429
                ? ask.error.message
                : undefined
            }
            onRetry={() => ask.mutate({ buildingId: activeBuilding.id, question: asked })}
          />
        )}
        {ask.isSuccess && asked && (
          <Card>
            <CardHeader>
              <p className="text-sm text-fg-muted">You asked</p>
              <CardTitle>{asked}</CardTitle>
            </CardHeader>
            <CardContent>
              <AnswerView question={asked} answer={ask.data} />
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
