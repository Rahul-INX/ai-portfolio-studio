"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      redirect: false
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid credentials or missing seeded admin user.");
      return;
    }
    router.push("/admin");
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          required
          className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 outline-none focus:border-cobalt-500"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 outline-none focus:border-cobalt-500"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-md bg-ink-900 px-4 text-sm font-medium text-white transition hover:bg-cobalt-600 disabled:opacity-60 dark:bg-ink-50 dark:text-ink-950"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
