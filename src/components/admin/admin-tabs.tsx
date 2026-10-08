"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Statistika" },
  { href: "/admin/users", label: "Foydalanuvchilar" },
  { href: "/admin/subjects", label: "Fanlar" },
  { href: "/admin/quizzes", label: "Testlar" },
  { href: "/admin/reports", label: "Hisobotlar" },
  { href: "/admin/settings", label: "Sozlamalar" },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav className="-mb-px mt-2 flex gap-1 overflow-x-auto" aria-label="Admin bo‘limlari">
      {TABS.map((t) => {
        const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 border-transparent px-3 py-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition hover:text-foreground",
              active && "border-primary text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
