import { Skeleton } from "@/common/atoms/ui/skeleton";
import { cn } from "@/common/lib/utils";

type LoadingBlockProps = {
  rows?: number;
  className?: string;
  label?: string;
};

export function LoadingBlock({
  rows = 3,
  className,
  label = "Loading",
}: LoadingBlockProps) {
  return (
    <div
      className={cn("space-y-3", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-10 w-full", i === 0 && "h-14")}
        />
      ))}
    </div>
  );
}
