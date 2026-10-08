import { ERRORS } from "@/lib/errors";

/** Maps Supabase auth error codes/messages to friendly Uzbek text. */
export function authErrorMessage(error: { code?: string; message?: string; status?: number } | null) {
  if (!error) return ERRORS.generic;
  const code = error.code ?? "";
  const msg = (error.message ?? "").toLowerCase();

  if (code === "invalid_credentials" || msg.includes("invalid login")) return "Email yoki parol noto‘g‘ri.";
  if (code === "email_not_confirmed" || msg.includes("not confirmed"))
    return "Emailingiz hali tasdiqlanmagan. Pochtangizdagi havolani bosing.";
  if (code === "user_already_exists" || msg.includes("already registered"))
    return "Bu email bilan allaqachon ro‘yxatdan o‘tilgan. Kirish sahifasidan foydalaning.";
  if (code === "weak_password" || msg.includes("password should"))
    return "Parol juda oddiy. Kamida 8 ta belgi, harf va raqam ishlating.";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || error.status === 429)
    return ERRORS.tooFast;
  if (msg.includes("fetch") || msg.includes("network")) return ERRORS.offline;
  return ERRORS.generic;
}

/** Only allow same-site relative redirects after login. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
