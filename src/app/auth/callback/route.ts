import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";

/** Completes OAuth (Google) and email-confirmation flows by exchanging the code for a session. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
