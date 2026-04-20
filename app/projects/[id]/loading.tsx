import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-36" />
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="col-span-2 h-[380px] rounded-xl" />
        <Skeleton className="h-[380px] rounded-xl" />
      </div>
      <Skeleton className="h-[400px] rounded-xl" />
    </div>
  );
}
