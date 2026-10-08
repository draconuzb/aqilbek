"use client";

import { useTransition } from "react";
import { BanIcon, CheckCircleIcon, MoreHorizontalIcon, ShieldIcon, ShieldOffIcon } from "lucide-react";
import { toast } from "sonner";
import { adminUpdateUser } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function UserRowActions({ userId, role, blocked }: { userId: string; role: "student" | "admin"; blocked: boolean }) {
  const [pending, startTransition] = useTransition();

  const run = (changes: { role?: "student" | "admin"; blocked?: boolean }, message: string) =>
    startTransition(async () => {
      const result = await adminUpdateUser(userId, changes);
      if (result.ok) toast.success(message);
      else toast.error(result.error);
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Amallar" disabled={pending} />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {blocked ? (
          <DropdownMenuItem onClick={() => run({ blocked: false }, "Blok olib tashlandi")}>
            <CheckCircleIcon /> Blokdan chiqarish
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" onClick={() => run({ blocked: true }, "Foydalanuvchi bloklandi")}>
            <BanIcon /> Bloklash
          </DropdownMenuItem>
        )}
        {role === "admin" ? (
          <DropdownMenuItem onClick={() => run({ role: "student" }, "Admin huquqi olindi")}>
            <ShieldOffIcon /> Adminlikdan olish
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => run({ role: "admin" }, "Admin qilib tayinlandi")}>
            <ShieldIcon /> Admin qilish
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
