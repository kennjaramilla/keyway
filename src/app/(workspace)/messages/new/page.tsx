"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { NewChatForm } from "@/features/messages/components/NewChatForm";

export default function NewChatPage() {
  return (
    <>
      <PageHeader
        title="New chat"
        description="Ask your coordinator anything that isn't a repair. For something broken, submit a request instead."
      />
      <NewChatForm />
    </>
  );
}
