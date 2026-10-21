"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { createChat, messageKeys } from "../api";

/** Start a general chat, then open it. */
export function useCreateChat() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: createChat,
    onSuccess: async (thread) => {
      await queryClient.invalidateQueries({ queryKey: [...messageKeys.all, "threads"] });
      toast({ title: "Chat started", description: thread.subject ?? undefined, tone: "success" });
      router.push(`/messages/${encodeURIComponent(thread.id)}`);
    },
  });
}
