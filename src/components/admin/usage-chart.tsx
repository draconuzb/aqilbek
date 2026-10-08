"use client";

import { useState } from "react";
import type { DailyUsage } from "@/lib/data/admin";

const dayLabel = new Intl.DateTimeFormat("uz-UZ", { day: "numeric", month: "short", timeZone: "UTC" });

function niceMax(value: number) {
  if (value <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow * 4 >= value)! * pow;
  return step * 4;
}

/** Single-series bar chart of successful AI requests per day, with a per-bar hover tooltip. */
export function UsageChart({ data }: { data: DailyUsage[] }) {
  const [active, setActive] = useState<number | null>(null);
  const totals = data.map((d) => d.chat + d.quiz + d.practice);
  const max = niceMax(Math.max(0, ...totals));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  const current = active !== null ? data[active] : null;

  return (
    <figure className="relative">
      <div className="relative h-56 pl-9" onMouseLeave={() => setActive(null)}>
        {/* Recessive grid + y-axis labels */}
        {ticks.map((t) => (
          <div key={t} className="pointer-events-none absolute right-0 left-9 border-t border-border/70" style={{ bottom: `${(t / max) * 100}%` }}>
            <span className="absolute -top-2 -left-9 w-7 text-right text-[11px] text-muted-foreground tabular-nums">{t}</span>
          </div>
        ))}
        <div className="relative flex h-full items-end gap-[2px]">
          {data.map((d, i) => {
            const total = totals[i];
            return (
              <button
                key={d.day}
                type="button"
                className="group relative flex h-full flex-1 items-end focus:outline-none"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${dayLabel.format(new Date(d.day))}: ${total} ta so‘rov`}
              >
                <span
                  className="block w-full rounded-t-[4px] bg-chart-1 transition-opacity group-hover:opacity-85 group-focus-visible:ring-2 group-focus-visible:ring-ring"
                  style={{ height: total ? `max(${(total / max) * 100}%, 2px)` : "0px" }}
                />
              </button>
            );
          })}
        </div>
        {current && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute -top-2 z-10 min-w-40 -translate-x-1/2 -translate-y-full rounded-xl border bg-popover px-3 py-2 text-xs shadow-lg"
            style={{ left: `calc(2.25rem + (100% - 2.25rem) * ${(active + 0.5) / data.length})` }}
          >
            <p className="font-semibold text-foreground">{dayLabel.format(new Date(current.day))}</p>
            <dl className="mt-1 grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 text-muted-foreground">
              <dt>Chat</dt><dd className="text-right tabular-nums text-foreground">{current.chat}</dd>
              <dt>Testlar</dt><dd className="text-right tabular-nums text-foreground">{current.quiz}</dd>
              <dt>Mashqlar</dt><dd className="text-right tabular-nums text-foreground">{current.practice}</dd>
              <dt>Bloklangan</dt><dd className="text-right tabular-nums text-foreground">{current.blocked}</dd>
              <dt>Faol o‘quvchilar</dt><dd className="text-right tabular-nums text-foreground">{current.users}</dd>
            </dl>
          </div>
        )}
      </div>
      <div className="mt-2 flex gap-[2px] pl-9 text-[11px] text-muted-foreground">
        {data.map((d, i) => (
          <span key={d.day} className="flex-1 truncate text-center tabular-nums">
            {i % 2 === data.length % 2 ? dayLabel.format(new Date(d.day)) : ""}
          </span>
        ))}
      </div>
      <figcaption className="sr-only">Kunlik muvaffaqiyatli AI so‘rovlar soni</figcaption>
    </figure>
  );
}
