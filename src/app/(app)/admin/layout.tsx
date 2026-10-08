import { Suspense } from "react";
import { AdminTabs } from "@/components/admin/admin-tabs";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b bg-card/60">
        <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">🛡️ Admin panel</p>
          <Suspense fallback={<div className="h-11" />}>
            <AdminTabs />
          </Suspense>
        </div>
      </div>
      {children}
    </div>
  );
}
