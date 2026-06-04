import { cn } from "@/common/lib/utils";

type LogoMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export function LogoMark({ className, size = "md" }: LogoMarkProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-[10px] shadow-[0_0_24px_rgba(79,140,255,0.25)]",
        sizes[size],
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" rx="10" fill="url(#eo-mark-gradient)" />
        <path
          d="M12 26V14h4.2l3.1 7.2L22.4 14H26.5v12h-3.4v-7.1l-3.3 7.1h-2.1l-3.3-7.1V26H12z"
          fill="#F8FAFC"
        />
        <circle cx="30" cy="12" r="3" fill="var(--accent-ai)" />
        <defs>
          <linearGradient
            id="eo-mark-gradient"
            x1="8"
            y1="4"
            x2="34"
            y2="36"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--accent-blue)" />
            <stop offset="1" stopColor="var(--accent-ai)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
