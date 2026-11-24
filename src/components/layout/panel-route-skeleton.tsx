import { Card, CardContent } from "@/components/ui/card";
import { LoadingFeedback } from "@/components/ui/loading-feedback";
import { Skeleton } from "@/components/ui/skeleton";

type PanelRouteSkeletonVariant = "dashboard" | "products" | "sale" | "content";

export function PanelRouteSkeleton({
  variant = "content",
}: {
  variant?: PanelRouteSkeletonVariant;
}) {
  return (
    <div
      aria-label="Carregando conteúdo do painel"
      aria-busy="true"
      className="mx-auto w-full max-w-7xl space-y-6"
    >
      <LoadingFeedback />
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {variant === "dashboard" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Card key={index} aria-hidden="true">
                <CardContent className="space-y-4 p-5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-36" />
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
            <Card aria-hidden="true" className="space-y-5 p-5">
              <Skeleton className="h-6 w-44" />
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-12 w-full" />
              ))}
            </Card>
            <Card aria-hidden="true" className="space-y-4 p-5">
              <Skeleton className="h-6 w-36" />
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-16 w-full rounded-xl" />
              ))}
            </Card>
          </div>
        </>
      )}

      {variant === "products" && (
        <>
          <Card aria-hidden="true" className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Card key={index} aria-hidden="true">
                <CardContent className="space-y-4 p-5">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {variant === "sale" && (
        <Card aria-hidden="true" className="max-w-3xl">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
            <Skeleton className="h-10 w-full" />
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-16 w-full rounded-xl" />
            ))}
            <Skeleton className="h-16 w-full rounded-xl" />
          </CardContent>
        </Card>
      )}

      {variant === "content" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <Card key={item} aria-hidden="true">
              <CardContent className="space-y-4 p-5">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
