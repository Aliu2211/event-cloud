"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthHeader } from "@/components/AuthHeader";
import { confirmRegistration, register } from "@/lib/auth";

type Step = "details" | "verify";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleDetailsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = form.get("confirmPassword");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const fullName = String(form.get("fullName") ?? "");
    const submittedEmail = String(form.get("email") ?? "");
    setLoading(true);
    try {
      await register(submittedEmail, password, fullName);
      setEmail(submittedEmail);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code") ?? "");
    try {
      await confirmRegistration(email, code);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid verification code.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <AuthHeader />

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
          {step === "details" ? (
            <>
              <h2 className="text-xl font-semibold text-primary mb-1">Create organizer account</h2>
              <p className="text-sm text-on-surface-variant mb-6">Set up access to the event management console.</p>

              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">Full Name</label>
                  <input
                    required
                    name="fullName"
                    type="text"
                    placeholder="Jane Doe"
                    className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-sm"
                  />
                </div>
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
                  <label className="block text-xs text-on-surface-variant mb-1">Password</label>
                  <input
                    required
                    name="password"
                    type="password"
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">Confirm Password</label>
                  <input
                    required
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
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
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-primary mb-1">Verify your email</h2>
              <p className="text-sm text-on-surface-variant mb-6">
                Enter the 6-digit code sent to <span className="font-medium text-primary">{email}</span>.
              </p>

              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">Verification Code</label>
                  <input
                    required
                    name="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-sm tracking-[0.3em] font-mono"
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
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="w-full text-xs text-on-surface-variant hover:text-primary transition-colors"
                >
                  Back to details
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-secondary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
