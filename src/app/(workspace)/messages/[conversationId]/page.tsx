"use client";

import { use } from "react";
import { ConversationView } from "@/features/messages/components/ConversationView";

export default function ConversationPage({ params }: PageProps<"/messages/[requestId]">) {
  const { requestId } = use(params);
  return <ConversationView requestId={requestId} />;
}
