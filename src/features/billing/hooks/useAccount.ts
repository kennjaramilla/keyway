"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { billingKeys, createPayment, fetchAccount } from "../api";
import { formatMoney, PAYMENT_METHODS } from "../schema";

export function useAccount() {
  return useQuery({
    queryKey: billingKeys.account(),
    queryFn: ({ signal }) => fetchAccount(signal),
  });
}

export function usePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayment,
    onSuccess: async (payment) => {
      await queryClient.invalidateQueries({ queryKey: billingKeys.all });
      toast({
        title: `Paid ${formatMoney(payment.amountCents)}`,
        description: `Reference ${payment.reference} · ${PAYMENT_METHODS[payment.method]}`,
        tone: "success",
      });
    },
  });
}
