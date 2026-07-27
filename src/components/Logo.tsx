import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "color" | "white" | "mono";
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({
  variant = "color",
  className,
  showTagline = false,
  size = "md",
}: LogoProps) {
  const isOnDark = variant === "white";
  const isMono = variant === "mono";

  // Badge (background) / insignia (foreground) / accent
  const badge = isMono ? "#111111" : "#c1121f";
  const insignia = "#faf7f2";
  const wordMediaColor = isOnDark ? "#faf7f2" : "#111111";
  const wordChiefColor = isOnDark ? "#faf7f2" : "#c1121f";
  const taglineColor = isOnDark ? "#e5c892" : "#64748b";

  const badgeSize = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const wordSize =
    size === "lg" ? "text-[28px]" : size === "sm" ? "text-[18px]" : "text-[22px]";

  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-3", className)}
      aria-label="Media Chief — home"
    >
      {/* Chief insignia badge: star over chevron stripes */}
      <svg
        viewBox="0 0 48 48"
        className={cn(
          badgeSize,
          "shrink-0 transition-transform duration-300 group-hover:-rotate-2 group-hover:scale-[1.04]",
        )}
        aria-hidden="true"
      >
        {/* Red shield base */}
        <path
          d="M24 2 L44 8 L44 26 C44 36 36 43 24 46 C12 43 4 36 4 26 L4 8 Z"
          fill={badge}
        />

        {/* Five-pointed star */}
        <path
          d="M24 8.5 L26.4 14.1 L32.5 14.6 L27.9 18.6 L29.3 24.5 L24 21.3 L18.7 24.5 L20.1 18.6 L15.5 14.6 L21.6 14.1 Z"
          fill={insignia}
        />

        {/* Chief chevron stripes */}
        <path
          d="M13 30 L24 25 L35 30"
          fill="none"
          stroke={insignia}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 36 L24 31 L35 36"
          fill="none"
          stroke={insignia}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        <path
          d="M15 41.5 L24 37.5 L33 41.5"
          fill="none"
          stroke={insignia}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
      </svg>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-0">
          <span
            className={cn(
              "font-headline font-bold uppercase tracking-[0.01em]",
              wordSize,
            )}
            style={{ color: wordMediaColor }}
          >
            Media
          </span>
          <span
            className={cn(
              "font-headline font-bold uppercase tracking-[0.01em]",
              wordSize,
            )}
            style={{ color: wordChiefColor }}
          >
            Chief
          </span>
        </div>
        {showTagline ? (
          <span
            className="mt-1 text-[9px] font-headline font-semibold uppercase tracking-[0.28em]"
            style={{ color: taglineColor }}
          >
            Press · Distribution · Impact
          </span>
        ) : null}
      </div>
    </Link>
  );
}
