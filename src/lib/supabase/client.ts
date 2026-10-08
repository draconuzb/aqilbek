import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env.public";

/** Browser client — only uses the public anon key. Used for auth flows (sign in / sign up / OAuth). */
export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
