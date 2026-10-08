"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { titleSchema } from "@/lib/validation";
import { assertOk, withUser } from "./_shared";

const id = z.uuid();

export async function renameConversation(conversationId: string, title: string) {
  return withUser(async ({ profile, supabase }) => {
    const parsedId = id.safeParse(conversationId);
    const parsedTitle = titleSchema.safeParse(title);
    if (!parsedId.success || !parsedTitle.success) throw new AppError("invalidInput");
    assertOk(
      await supabase
        .from("conversations")
        .update({ title: parsedTitle.data })
        .eq("id", parsedId.data)
        .eq("user_id", profile.id),
    );
    refresh();
  });
}

export async function setConversationFavorite(conversationId: string, favorite: boolean) {
  return withUser(async ({ profile, supabase }) => {
    const parsedId = id.safeParse(conversationId);
    if (!parsedId.success) throw new AppError("invalidInput");
    assertOk(
      await supabase
        .from("conversations")
        .update({ is_favorite: Boolean(favorite) })
        .eq("id", parsedId.data)
        .eq("user_id", profile.id),
    );
    refresh();
  });
}

export async function deleteConversation(conversationId: string) {
  return withUser(async ({ profile, supabase }) => {
    const parsedId = id.safeParse(conversationId);
    if (!parsedId.success) throw new AppError("invalidInput");
    assertOk(await supabase.from("conversations").delete().eq("id", parsedId.data).eq("user_id", profile.id));
    refresh();
  });
}
