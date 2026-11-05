import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CustomerDashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando seu dashboard"
      aria-busy="true"
      className="space-y-6"
    >
      <span className="sr-only">Carregando seus pontos e missões…</span>
      <Card aria-hidden="true" className="overflow-hidden">
        <div className="space-y-5 bg-primary-soft p-6">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-16 w-40" />
        </div>
        <div className="space-y-3 p-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-2.5 w-full" />
        </div>
      </Card>
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        {[0, 1].map((key) => (
          <Card key={key} aria-hidden="true" className="space-y-5 p-5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-12 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
