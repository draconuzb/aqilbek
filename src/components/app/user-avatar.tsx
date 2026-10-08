import { cn } from "@/lib/utils";

const TONES = [
  "bg-[oklch(0.9_0.06_268)] text-[oklch(0.38_0.15_268)]",
  "bg-[oklch(0.92_0.07_80)] text-[oklch(0.45_0.11_65)]",
  "bg-[oklch(0.91_0.06_155)] text-[oklch(0.4_0.1_155)]",
  "bg-[oklch(0.91_0.06_15)] text-[oklch(0.45_0.15_15)]",
  "bg-[oklch(0.91_0.05_220)] text-[oklch(0.4_0.1_230)]",
];

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Generated-initials avatar (no photos are collected). */
export function UserAvatar({ name, className }: { name: string; className?: string }) {
  const tone = TONES[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TONES.length];
  return (
    <span
      aria-hidden
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", tone, className)}
    >
      {initials(name)}
    </span>
  );
}
