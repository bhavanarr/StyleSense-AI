import { GridSkeleton, Skeleton } from "@/components/Skeleton";

export default function ShopLoading() {
  return (
    <div className="container-page py-8">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-6 h-20" />
      <div className="mt-8"><GridSkeleton /></div>
    </div>
  );
}
