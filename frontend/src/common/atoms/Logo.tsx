import Link from "next/link";
import { cn } from "@/common/lib/utils";
import { LogoMark } from "@/common/atoms/LogoMark";

type LogoProps = {
  className?: string;
  /** Omit or pass `null` to render without a link. */
  href?: string | null;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
};

export function Logo({
  className,
  href = "/dashboard",
  showWordmark = true,
  size = "md",
}: LogoProps) {
  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={size} />
      {showWordmark ? (
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold leading-tight text-foreground">
            Executive OS
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            AI Operating System
          </p>
        </div>
      ) : null}
    </div>
  );

  if (href == null) return content;

  return (
    <Link
      href={href}
      className="rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {content}
    </Link>
  );
}
