import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { PageShell } from "@/components/app/page-shell";
import { requireProfile } from "@/lib/auth";
import { getSubjects, getUserSubjects } from "@/lib/data/subjects";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Fanlar" };

export default async function SubjectsPage() {
  const profile = await requireProfile();
  const [subjects, mine] = await Promise.all([getSubjects(), getUserSubjects(await createClient(), profile.id)]);
  const mineIds = new Set(mine.map((s) => s.id));
  const sorted = [...subjects].sort((a, b) => Number(mineIds.has(b.id)) - Number(mineIds.has(a.id)));

  return (
    <PageShell title="Fanlar 📚" description="Fanni tanlang — mavzular, mashqlar va testlar bilan o‘rganing.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((s) => (
          <Link
            key={s.id}
            href={`/subjects/${s.slug}`}
            className="group flex flex-col rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-soft text-2xl" aria-hidden>
                {s.icon}
              </span>
              {mineIds.has(s.id) && (
                <span className="rounded-full bg-sun-soft px-2 py-0.5 text-xs font-medium">Mening fanim</span>
              )}
            </div>
            <h2 className="mt-4 text-lg font-semibold">{s.name}</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{s.description}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Boshlash <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
