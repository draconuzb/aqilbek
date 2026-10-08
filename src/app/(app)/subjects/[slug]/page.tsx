import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, BotMessageSquareIcon, ClipboardListIcon, DumbbellIcon, MessageCircleQuestionIcon } from "lucide-react";
import { PageShell } from "@/components/app/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { getSubjectBySlug } from "@/lib/data/subjects";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/subjects/[slug]">): Promise<Metadata> {
  const subject = await getSubjectBySlug((await params).slug);
  return { title: subject?.name ?? "Fan" };
}

function chatHref(subject: string, prompt?: string, send = false) {
  const params = new URLSearchParams({ subject });
  if (prompt) params.set("q", prompt);
  if (send) params.set("send", "1");
  return `/chat?${params.toString()}`;
}

export default async function SubjectPage({ params }: PageProps<"/subjects/[slug]">) {
  const [{ slug }, profile] = await Promise.all([params, requireProfile()]);
  const subject = await getSubjectBySlug(slug);
  if (!subject) notFound();
  const grade = profile.grade ? `${profile.grade}-sinf` : "";

  return (
    <PageShell>
      <Link href="/subjects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Fanlar
      </Link>

      <section className="rounded-3xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-4xl" aria-hidden>
            {subject.icon}
          </span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold sm:text-3xl">{subject.name}</h1>
            <p className="mt-1 text-muted-foreground">{subject.description}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link href={chatHref(subject.slug)} className={cn(buttonVariants(), "h-12 justify-start gap-2.5 px-4 text-[15px]")}>
            <BotMessageSquareIcon className="size-5" /> Aqilbekdan so‘rash
          </Link>
          <Link
            href={`/practice?subject=${subject.slug}`}
            className={cn(buttonVariants({ variant: "outline" }), "h-12 justify-start gap-2.5 px-4 text-[15px]")}
          >
            <DumbbellIcon className="size-5" /> Mashq qilish
          </Link>
          <Link
            href={`/quizzes/new?subject=${subject.slug}`}
            className={cn(buttonVariants({ variant: "outline" }), "h-12 justify-start gap-2.5 px-4 text-[15px]")}
          >
            <ClipboardListIcon className="size-5" /> Test tuzish
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Mavzular</h2>
        <p className="mt-1 text-sm text-muted-foreground">Mavzuni tanlang — Aqilbek uni {grade ? `${grade}ga mos` : "sodda"} qilib tushuntiradi.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subject.topics.map((topic) => (
            <div key={topic} className="flex flex-col rounded-2xl border bg-card p-4">
              <p className="font-medium">{topic}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={chatHref(subject.slug, `"${topic}" mavzusini ${grade ? `${grade} o‘quvchisiga mos` : "sodda"} qilib tushuntirib ber`, true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-soft px-3 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <MessageCircleQuestionIcon className="size-3.5" /> Tushuntir
                </Link>
                <Link
                  href={`/practice?subject=${subject.slug}&topic=${encodeURIComponent(topic)}`}
                  className="inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium hover:bg-muted"
                >
                  Mashq
                </Link>
                <Link
                  href={`/quizzes/new?subject=${subject.slug}&topic=${encodeURIComponent(topic)}`}
                  className="inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium hover:bg-muted"
                >
                  Test
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
