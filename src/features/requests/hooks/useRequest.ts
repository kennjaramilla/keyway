"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import {
  createRequest,
  fetchRequest,
  fetchVendors,
  requestKeys,
  runWorkflowAction,
  vendorKeys,
  type WorkflowInput,
} from "../api";
import type { RequestDetail, RequestListItem } from "../schema";

export function useRequest(id: string) {
  return useQuery({
    queryKey: requestKeys.detail(id),
    queryFn: ({ signal }) => fetchRequest(id, signal),
  });
}

export function useVendors(buildingId: string, enabled = true) {
  return useQuery({
    queryKey: vendorKeys.list(buildingId),
    queryFn: ({ signal }) => fetchVendors(buildingId, signal),
    enabled,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: createRequest,
    onSuccess: async (created) => {
      queryClient.setQueryData(requestKeys.detail(created.id), created);
      await queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      toast({
        title: "Request submitted",
        description: `${created.number}: ${created.title}`,
        tone: "success",
      });
      router.push(`/requests/${created.id}`);
    },
  });
}

const DONE: Record<WorkflowInput["action"], string> = {
  triage: "triaged",
  assign: "assigned to a vendor",
  schedule: "scheduled",
  start: "marked in progress",
  resolve: "resolved",
};

/** Predicted state for an action, shown until the API answers. */
function optimistic(request: RequestDetail, input: WorkflowInput): RequestDetail {
  switch (input.action) {
    case "triage":
      return { ...request, status: "triaged" };
    case "assign":
      return { ...request, vendorId: input.body.vendorId };
    case "schedule":
      return { ...request, status: "scheduled", visitWindow: input.body };
    case "start":
      return { ...request, status: "in_progress" };
    case "resolve":
      return { ...request, status: "resolved", resolvedAt: new Date().toISOString() };
  }
}

/**
 * Run a workflow step. The detail and every cached list update immediately;
 * on failure both roll back, a toast explains, and a 409 refetches the truth.
 */
export function useWorkflowAction(request: RequestDetail) {
  const queryClient = useQueryClient();
  const detailKey = requestKeys.detail(request.id);

  // Copy only what a workflow step can change, so detail-only fields never leak into lists.
  const patchLists = (next: RequestDetail) => {
    const changes: Partial<RequestListItem> = {
      status: next.status,
      urgency: next.urgency,
      category: next.category,
      vendorId: next.vendorId,
      vendorName: next.vendorName,
      visitWindow: next.visitWindow,
      resolvedAt: next.resolvedAt,
      updatedAt: next.updatedAt,
    };
    queryClient.setQueriesData<RequestListItem[]>({ queryKey: requestKeys.lists() }, (list) =>
      list?.map((item) => (item.id === request.id ? { ...item, ...changes } : item)),
    );
  };

  return useMutation({
    mutationFn: (input: WorkflowInput) => runWorkflowAction(request.id, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: requestKeys.all });
      const previousDetail = queryClient.getQueryData<RequestDetail>(detailKey);
      const previousLists = queryClient.getQueriesData<RequestListItem[]>({
        queryKey: requestKeys.lists(),
      });
      const predicted = optimistic(previousDetail ?? request, input);
      queryClient.setQueryData(detailKey, predicted);
      patchLists(predicted);
      return { previousDetail, previousLists };
    },
    onError: (error, input, context) => {
      if (context?.previousDetail) queryClient.setQueryData(detailKey, context.previousDetail);
      for (const [key, data] of context?.previousLists ?? []) queryClient.setQueryData(key, data);
      const conflict = error instanceof ApiError && error.status === 409;
      toast({
        title: `Couldn't update ${request.number}`,
        description: conflict
          ? "It changed since you opened it. We've refreshed it."
          : error.message || "Please try again.",
        tone: "danger",
      });
      if (conflict) void queryClient.invalidateQueries({ queryKey: requestKeys.all });
    },
    onSuccess: (updated, input) => {
      queryClient.setQueryData(detailKey, updated);
      patchLists(updated);
      toast({ title: `${updated.number} ${DONE[input.action]}`, tone: "success" });
    },
  });
}
