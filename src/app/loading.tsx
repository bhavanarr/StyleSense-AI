import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading page" className="container-page space-y-6 py-10">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-64" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
