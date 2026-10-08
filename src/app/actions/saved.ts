"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { savedItemSchema } from "@/lib/validation";
import { assertOk, withUser } from "./_shared";

export async function saveItem(input: { type: string; title: string; content: string; conversationId?: string }) {
  return withUser(async ({ profile, supabase }) => {
    const parsed = savedItemSchema.safeParse(input);
    if (!parsed.success) throw new AppError("invalidInput");
    const { type, title, content, conversationId } = parsed.data;
    const { data, error } = await supabase
      .from("saved_items")
      .insert({ user_id: profile.id, type, title, content, conversation_id: conversationId ?? null })
      .select("id")
      .single<{ id: string }>();
    if (error || !data) throw new AppError("generic", 500);
    return { id: data.id };
  });
}

export async function deleteSavedItem(itemId: string) {
  return withUser(async ({ profile, supabase }) => {
    const parsed = z.uuid().safeParse(itemId);
    if (!parsed.success) throw new AppError("invalidInput");
    assertOk(await supabase.from("saved_items").delete().eq("id", parsed.data).eq("user_id", profile.id));
    refresh();
  });
}
