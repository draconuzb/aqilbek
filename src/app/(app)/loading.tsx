import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10" aria-busy="true" aria-label="Yuklanmoqda">
      <Skeleton className="h-9 w-56 rounded-lg" />
      <Skeleton className="mt-3 h-5 w-80 max-w-full rounded-lg" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
