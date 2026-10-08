"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOutIcon, MenuIcon } from "lucide-react";
import { signOut } from "@/app/actions/profile";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ADMIN_ITEM, BOTTOM_NAV, NAV_ITEMS, isActive, type NavItem } from "./nav-items";
import { UserAvatar } from "./user-avatar";

export type NavUser = { name: string; grade: number | null; isAdmin: boolean };

function NavLinks({ user, onNavigate }: { user: NavUser | null; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items: NavItem[] = user?.isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;
  return (
    <nav className="grid gap-1" aria-label="Asosiy menyu">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-sidebar-foreground/75 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            <item.icon className={cn("size-[1.15rem]", active && "text-primary")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard({ user }: { user: NavUser }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
      <UserAvatar name={user.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.grade ? `${user.grade}-sinf o‘quvchisi` : "O‘quvchi"}</p>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="icon-sm" aria-label="Chiqish" title="Chiqish">
          <LogOutIcon />
        </Button>
      </form>
    </div>
  );
}

export function SidebarContent({ user }: { user: NavUser }) {
  return (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavLinks user={user} />
      </div>
      <div className="flex items-center gap-2 px-3 pb-2">
        <ThemeToggle />
        <span className="text-xs text-muted-foreground">Yorug‘ / qorong‘i rejim</span>
      </div>
      <div className="p-3 pt-1">
        <UserCard user={user} />
      </div>
    </>
  );
}

export function MobileHeader({ user }: { user: NavUser | null }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-3 backdrop-blur-lg lg:hidden">
      <Logo href="/dashboard" />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Menyuni ochish" />}>
            <MenuIcon className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-xs p-0">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle render={<div />}>
                <Logo href="/dashboard" />
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-3">
              <NavLinks user={user} onNavigate={() => setOpen(false)} />
            </div>
            {user && (
              <div className="border-t p-3 pb-safe">
                <UserCard user={user} />
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  // The chat screen uses the full height for messages and its own input bar.
  if (isActive(pathname, "/chat")) return null;
  const items = BOTTOM_NAV.map((href) => NAV_ITEMS.find((i) => i.href === href)!);
  return (
    <nav
      aria-label="Pastki menyu"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur-lg pb-safe lg:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const center = item.href === "/chat";
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground",
                active && "text-primary",
              )}
            >
              {center ? (
                <span className="-mt-5 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <item.icon className="size-5" />
                </span>
              ) : (
                <item.icon className="size-5" />
              )}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
