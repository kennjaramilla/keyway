"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { useCurrentSession } from "@/features/session/hooks";
import { billingKeys, createDamageCharge, fetchRequestCharges, fetchUnitBalances } from "../api";
import { formatMoney, type DamageChargeInput } from "../schema";

/** Every resident's balance in the active building. */
export function useUnitBalances() {
  const { user } = useCurrentSession();
  return useQuery({
    queryKey: billingKeys.units(user.activeBuildingId),
    queryFn: ({ signal }) => fetchUnitBalances(user.activeBuildingId, signal),
  });
}

export function useRequestCharges(requestId: string, enabled = true) {
  return useQuery({
    queryKey: billingKeys.requestCharges(requestId),
    queryFn: ({ signal }) => fetchRequestCharges(requestId, signal),
    enabled,
  });
}

export function useCreateDamageCharge(requestId: string, number: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DamageChargeInput) => createDamageCharge(requestId, input),
    onSuccess: async (charge) => {
      await queryClient.invalidateQueries({ queryKey: billingKeys.all });
      toast({
        title: `Charged ${formatMoney(charge.amountCents)}`,
        description: `${number}: ${charge.description}`,
        tone: "success",
      });
    },
  });
}
