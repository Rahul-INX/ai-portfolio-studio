"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

export function AdminLogoutButton({ compact = false }: { compact?: boolean }) {
  const [signingOut, setSigningOut] = useState(false);

  return (
    <button
      type="button"
      disabled={signingOut}
      onClick={async () => {
        setSigningOut(true);
        await signOut({ callbackUrl: "/admin/login" });
      }}
      aria-label="Sign out of portfolio admin"
      title="Sign out"
      className={compact
        ? "grid h-9 w-9 place-items-center rounded-md text-[var(--muted)] transition hover:bg-[var(--panel)] hover:text-[var(--foreground)] disabled:opacity-60"
        : "inline-flex h-11 items-center justify-center gap-2 rounded-md border hairline bg-[var(--panel-strong)] px-4 text-sm font-medium transition hover:border-cobalt-500 disabled:opacity-60"}
    >
      <LogOut aria-hidden className="h-4 w-4" />
      {compact ? null : signingOut ? "Signing out..." : "Sign out"}
    </button>
  );
}
