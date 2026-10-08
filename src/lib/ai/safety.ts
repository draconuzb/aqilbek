import "server-only";
import { moderate } from "@/lib/ai/mistral";
import { ERRORS } from "@/lib/errors";

const SELF_HARM_REPLY = `Men senga g‘amxo‘rlik qilaman va sen yolg‘iz emassan. 💙

Iltimos, hozir ishonchli kattalardan biriga — ota-onangga, o‘qituvchingga yoki maktab psixologiga — nima his qilayotganingni ayt. Agar xavf ostida bo‘lsang, darhol **112** raqamiga qo‘ng‘iroq qil.

Agar xohlasang, o‘qish yoki boshqa savollar bo‘yicha yordam berishga doim tayyorman.`;

export type SafetyVerdict = { allowed: true } | { allowed: false; category: string; reply: string };

function verdict(category: string | null): SafetyVerdict {
  if (!category) return { allowed: true };
  return { allowed: false, category, reply: category === "selfharm" ? SELF_HARM_REPLY : ERRORS.blocked };
}

/** Moderates the student's input before it reaches the model. */
export async function checkInput(text: string, signal?: AbortSignal): Promise<SafetyVerdict> {
  const result = await moderate(text, signal);
  return verdict(result.flagged ? result.category : null);
}

/** Moderates generated output before it is stored or kept on screen. */
export async function checkOutput(text: string, signal?: AbortSignal): Promise<SafetyVerdict> {
  const result = await moderate(text, signal);
  if (!result.flagged) return { allowed: true };
  return {
    allowed: false,
    category: result.category ?? "unknown",
    reply: "Kechirasiz, bu javobni ko‘rsata olmayman. Keling, savolni boshqacha qilib beramiz yoki boshqa mavzuga o‘tamiz. 📚",
  };
}
