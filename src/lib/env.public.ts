// Public (browser-safe) environment. Next.js inlines NEXT_PUBLIC_* only when referenced literally.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getPublicEnv() {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase sozlanmagan: NEXT_PUBLIC_SUPABASE_URL va NEXT_PUBLIC_SUPABASE_ANON_KEY ni .env.local faylga yozing.",
    );
  }
  return { supabaseUrl: url, supabaseAnonKey: anonKey };
}

export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
