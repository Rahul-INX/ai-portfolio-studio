import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false }
};

export default function LoginPage() {
  const googleEnabled = Boolean(
    (process.env.GOOGLE_AUTH_CLIENT_ID ?? process.env.GOOGLE_DRIVE_CLIENT_ID) &&
      (process.env.GOOGLE_AUTH_CLIENT_SECRET ?? process.env.GOOGLE_DRIVE_CLIENT_SECRET)
  );
  const credentialsEnabled = process.env.NODE_ENV !== "production" || process.env.ENABLE_CREDENTIALS_LOGIN === "true" || !googleEnabled;

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="surface w-full max-w-md rounded-lg p-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
          Secure CMS
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Admin Login</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Authenticated publishing for projects, reports, experiments, writing, dashboards, and timeline records.
        </p>
        <LoginForm googleEnabled={googleEnabled} credentialsEnabled={credentialsEnabled} />
      </section>
    </main>
  );
}
