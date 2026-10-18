"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { SkeletonList } from "@/components/ui/skeleton";
import { RequestDetailView } from "@/features/requests/components/RequestDetailView";

function DetailFromParams() {
  const { id } = useParams<{ id: string }>();
  return <RequestDetailView id={id} />;
}

export default function RequestDetailPage() {
  return (
    <Suspense fallback={<SkeletonList rows={4} label="Loading request" />}>
      <DetailFromParams />
    </Suspense>
  );
}
