import { Suspense } from "react";
import { BottomNav, MobileHeader, SidebarContent, type NavUser } from "@/components/app/app-nav";
import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { displayName, getCurrentProfile } from "@/lib/auth";

async function getNavUser(): Promise<NavUser | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  return { name: displayName(profile), grade: profile.grade, isAdmin: profile.role === "admin" };
}

async function Sidebar() {
  const user = await getNavUser();
  return user ? <SidebarContent user={user} /> : null;
}

async function MobileTop() {
  return <MobileHeader user={await getNavUser()} />;
}

function SidebarSkeleton() {
  return (
    <div className="grid gap-2 px-3 py-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-11 rounded-xl" />
      ))}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo href="/dashboard" />
        </div>
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Suspense fallback={<div className="h-14 border-b lg:hidden" />}>
          <MobileTop />
        </Suspense>
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>

      <Suspense>
        <BottomNav />
      </Suspense>
    </div>
  );
}
