"use client";

import Link from "next/link";
import { RotateCcwIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { ERRORS } from "@/lib/errors";

/** Friendly error boundary — never shows stack traces to students. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[70svh] flex-1 flex-col items-center justify-center px-6 text-center">
      <LogoMark className="size-14" />
      <h1 className="mt-5 text-2xl font-bold">Voy, nimadir xato ketdi 😕</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{ERRORS.generic}</p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>
          <RotateCcwIcon /> Qayta urinish
        </Button>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Bosh sahifa
        </Link>
      </div>
    </div>
  );
}
