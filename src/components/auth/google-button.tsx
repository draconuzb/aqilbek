"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ERRORS } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

export function GoogleButton({ next = "/dashboard" }: { next?: string }) {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      toast.error(ERRORS.generic);
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" className="h-11 w-full text-[15px]" onClick={signIn} disabled={loading}>
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12Z" />
      </svg>
      Google orqali kirish
    </Button>
  );
}
