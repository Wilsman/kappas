import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton component for the main content area while data is loading.
 * Mimics the checklist view layout with placeholder animations.
 */
export function ContentSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header area with search placeholder */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Simulated trader/quest group sections */}
      {[1, 2, 3].map((groupIndex) => (
        <div key={groupIndex} className="space-y-3">
          {/* Group header */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          {/* Quest items */}
          <div className="space-y-2 pl-2">
            {[1, 2, 3, 4].map((itemIndex) => (
              <div
                key={itemIndex}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
