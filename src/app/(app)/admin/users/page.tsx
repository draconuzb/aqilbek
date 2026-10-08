import type { Metadata } from "next";
import { PageShell } from "@/components/app/page-shell";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { UserAvatar } from "@/components/app/user-avatar";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Foydalanuvchilar" };

type AdminUser = {
  id: string;
  first_name: string;
  email: string | null;
  grade: number | null;
  role: "student" | "admin";
  is_blocked: boolean;
  created_at: string;
  conversations: number;
  ai_requests: number;
  last_active: string | null;
};

const dateFmt = new Intl.DateTimeFormat("uz-UZ", { dateStyle: "medium", timeZone: "Asia/Tashkent" });

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const [me, query] = await Promise.all([requireAdmin(), searchParams]);
  const search = (Array.isArray(query.q) ? query.q[0] : query.q)?.slice(0, 80) ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_users", { search: search || null, max_rows: 100 });
  const users = (data ?? []) as AdminUser[];

  return (
    <PageShell title="Foydalanuvchilar" description="Rollar va kirish huquqlarini boshqarish.">
      <form className="mb-4 max-w-md">
        <Input name="q" defaultValue={search} placeholder="Ism yoki email bo‘yicha qidirish" className="h-11" aria-label="Qidirish" />
      </form>
      {error && <p className="text-sm text-destructive">Ma’lumotni yuklab bo‘lmadi.</p>}
      <div className="overflow-x-auto rounded-3xl border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Foydalanuvchi</th>
              <th className="px-4 py-3 font-medium">Sinf</th>
              <th className="px-4 py-3 text-right font-medium">Suhbatlar</th>
              <th className="px-4 py-3 text-right font-medium">AI so‘rovlar</th>
              <th className="px-4 py-3 font-medium">Ro‘yxatdan o‘tgan</th>
              <th className="px-4 py-3 font-medium">Holat</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={u.first_name || u.email || "?"} className="size-8 text-xs" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{u.first_name || "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{u.grade ? `${u.grade}-sinf` : "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{u.conversations}</td>
                <td className="px-4 py-3 text-right tabular-nums">{u.ai_requests}</td>
                <td className="px-4 py-3 whitespace-nowrap">{dateFmt.format(new Date(u.created_at))}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.role === "admin" && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-primary">Admin</span>}
                    {u.is_blocked ? (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">Bloklangan</span>
                    ) : (
                      <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">Faol</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== me.id && <UserRowActions userId={u.id} role={u.role} blocked={u.is_blocked} />}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Foydalanuvchi topilmadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
