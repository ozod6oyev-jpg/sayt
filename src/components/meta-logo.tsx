import { cn } from "@/lib/utils";

/** Meta brend belgisi — Meta ko'k gradientidagi cheksizlik shakli */
export function MetaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-4", className)}>
      <defs>
        <linearGradient
          id="meta-logo-gradient"
          x1="2"
          y1="15"
          x2="22"
          y2="9"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0064E0" />
          <stop offset="0.5" stopColor="#0866FF" />
          <stop offset="1" stopColor="#0080FB" />
        </linearGradient>
      </defs>
      <path
        d="M12 12c-1.9-3.1-3.3-4.6-5.2-4.6C4.4 7.4 2.6 9.5 2.6 12s1.8 4.6 4.2 4.6c1.9 0 3.3-1.5 5.2-4.6 1.9-3.1 3.3-4.6 5.2-4.6 2.4 0 4.2 2.1 4.2 4.6s-1.8 4.6-4.2 4.6c-1.9 0-3.3-1.5-5.2-4.6Z"
        fill="none"
        stroke="url(#meta-logo-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
