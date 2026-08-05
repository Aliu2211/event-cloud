"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthHeader } from "@/components/AuthHeader";
import { confirmPasswordReset, requestPasswordReset } from "@/lib/auth";

type Step = "request" | "reset" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleRequestSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const submittedEmail = String(form.get("email") ?? "");
    setLoading(true);
    try {
      await requestPasswordReset(submittedEmail);
      setEmail(submittedEmail);
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code") ?? "");
    const password = String(form.get("newPassword") ?? "");
    const confirmPassword = form.get("confirmPassword");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(email, code, password);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <AuthHeader />

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
          {step === "request" && (
            <>
              <h2 className="text-xl font-semibold text-primary mb-1">Reset password</h2>
              <p className="text-sm text-on-surface-variant mb-6">
                Enter your email and we will send you a reset code.
              </p>

              <form onSubmit={handleRequestSubmit} className="space-y-4">
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-secondary text-on-secondary py-2 rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all"
                >
                  {loading ? "Sending..." : "Send Reset Code"}
                </button>
              </form>
            </>
          )}

          {step === "reset" && (
            <>
              <h2 className="text-xl font-semibold text-primary mb-1">Set a new password</h2>
              <p className="text-sm text-on-surface-variant mb-6">
                Enter the code sent to <span className="font-medium text-primary">{email}</span> and choose a new
                password.
              </p>

              <form onSubmit={handleResetSubmit} className="space-y-4">
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
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">New Password</label>
                  <input
                    required
                    name="newPassword"
                    type="password"
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">Confirm New Password</label>
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
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="w-full text-xs text-on-surface-variant hover:text-primary transition-colors"
                >
                  Use a different email
                </button>
              </form>
            </>
          )}

          {step === "done" && (
            <>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-green-700">check_circle</span>
              </div>
              <h2 className="text-xl font-semibold text-primary text-center mb-1">Password reset</h2>
              <p className="text-sm text-on-surface-variant text-center mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="block w-full text-center bg-secondary text-on-secondary py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-all"
              >
                Back to Sign In
              </Link>
            </>
          )}
        </div>

        {step !== "done" && (
          <p className="text-center text-xs text-on-surface-variant mt-6">
            Remembered your password?{" "}
            <Link href="/login" className="text-secondary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
