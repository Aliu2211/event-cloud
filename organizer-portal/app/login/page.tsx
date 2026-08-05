"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthHeader } from "@/components/AuthHeader";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    try {
      const { isSignedIn } = await login(email, password);
      if (isSignedIn) {
        router.push("/dashboard");
      } else {
        setError("Additional verification is required for this account. Contact your administrator.");
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Check your credentials.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <AuthHeader />

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-primary mb-1">Sign in</h2>
          <p className="text-sm text-on-surface-variant mb-6">Access your event management dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Email Address</label>
              <input
                required
                name="email"
                type="email"
                placeholder="you@eventcloud.io"
                className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-on-surface-variant">Password</label>
                <Link href="/forgot-password" className="text-xs text-secondary font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                required
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-sm"
              />
            </div>

            {error && (
              <p className="text-xs text-error bg-error-container/40 border border-error/20 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-on-secondary py-2 rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-secondary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
