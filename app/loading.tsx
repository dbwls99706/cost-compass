import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-12 w-[480px] rounded-lg" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="col-span-2 h-[380px] rounded-xl" />
        <Skeleton className="h-[380px] rounded-xl" />
      </div>

      <Skeleton className="h-[420px] rounded-xl" />
      <Skeleton className="h-[420px] rounded-xl" />
      <Skeleton className="h-[320px] rounded-xl" />
    </div>
  );
}
