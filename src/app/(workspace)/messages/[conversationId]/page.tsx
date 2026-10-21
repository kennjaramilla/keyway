"use client";

import { use } from "react";
import { ConversationView } from "@/features/messages/components/ConversationView";

export default function ConversationPage({ params }: PageProps<"/messages/[conversationId]">) {
  const { conversationId } = use(params);
  return <ConversationView conversationId={conversationId} />;
}
