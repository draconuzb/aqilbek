"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { SUBJECTS_TAG } from "@/lib/data/subjects";
import { AppError } from "@/lib/errors";
import { assertOk, withUser } from "./_shared";

const subjectSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(200),
  icon: z.string().trim().min(1).max(8),
  topics: z.array(z.string().trim().min(1).max(100)).max(40),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  isActive: z.boolean(),
});

export async function saveSubject(id: number | null, input: z.input<typeof subjectSchema>) {
  return withUser(
    async ({ supabase }) => {
      const parsed = subjectSchema.safeParse(input);
      if (!parsed.success) throw new AppError("invalidInput");
      const s = parsed.data;
      const row = {
        name: s.name,
        slug: s.slug,
        description: s.description,
        icon: s.icon,
        topics: s.topics,
        sort_order: s.sortOrder,
        is_active: s.isActive,
      };
      assertOk(id ? await supabase.from("subjects").update(row).eq("id", id) : await supabase.from("subjects").insert(row));
      updateTag(SUBJECTS_TAG);
      refresh();
    },
    { admin: true },
  );
}

export async function adminUpdateUser(userId: string, changes: { role?: "student" | "admin"; blocked?: boolean }) {
  return withUser(
    async ({ supabase }) => {
      if (!z.uuid().safeParse(userId).success) throw new AppError("invalidInput");
      assertOk(
        await supabase.rpc("admin_update_user", {
          target: userId,
          new_role: changes.role ?? null,
          blocked: changes.blocked ?? null,
        }),
      );
      refresh();
    },
    { admin: true },
  );
}

export async function adminDeleteQuiz(quizId: string) {
  return withUser(
    async ({ supabase }) => {
      if (!z.uuid().safeParse(quizId).success) throw new AppError("invalidInput");
      assertOk(await supabase.from("quizzes").delete().eq("id", quizId));
      refresh();
    },
    { admin: true },
  );
}

const settingsSchema = z.object({
  aiEnabled: z.boolean(),
  dailyChatLimit: z.number().int().min(0).max(10000).nullable(),
  dailyGenerationLimit: z.number().int().min(0).max(10000).nullable(),
  announcement: z.string().trim().max(300).nullable(),
});

export async function saveSettings(input: z.input<typeof settingsSchema>) {
  return withUser(
    async ({ supabase }) => {
      const parsed = settingsSchema.safeParse(input);
      if (!parsed.success) throw new AppError("invalidInput");
      const s = parsed.data;
      assertOk(
        await supabase
          .from("app_settings")
          .update({
            ai_enabled: s.aiEnabled,
            daily_chat_limit: s.dailyChatLimit,
            daily_generation_limit: s.dailyGenerationLimit,
            announcement: s.announcement || null,
          })
          .eq("id", 1),
      );
      refresh();
    },
    { admin: true },
  );
}
