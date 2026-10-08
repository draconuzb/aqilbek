import Link from "next/link";
import { cn } from "@/lib/utils";

/** Aqilbek mark: a lightbulb-shaped "A" — understanding that switches on. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="40" height="40" rx="12" className="fill-primary" />
      <path
        d="M20 8.5c-5.8 0-10 4.3-10 9.6 0 3.4 1.7 5.9 4 7.6.8.6 1.3 1.5 1.3 2.5v1.3h9.4v-1.3c0-1 .5-1.9 1.3-2.5 2.3-1.7 4-4.2 4-7.6 0-5.3-4.2-9.6-10-9.6Z"
        className="fill-primary-foreground/15"
      />
      <path
        d="m14.6 26 5.4-14 5.4 14M16.6 21h6.8"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      />
      <path d="M17 32.2h6" strokeWidth="2.4" strokeLinecap="round" className="stroke-sun" />
      <circle cx="29.5" cy="10.5" r="2.4" className="fill-sun" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 font-heading", className)} aria-label="Aqilbek.uz bosh sahifa">
      <LogoMark />
      <span className="text-lg font-bold tracking-tight">
        Aqilbek<span className="text-primary">.uz</span>
      </span>
    </Link>
  );
}
