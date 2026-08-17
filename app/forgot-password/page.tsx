"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/data";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: window.location.origin + "/login" }
      );

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Subtle background texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200,169,110,0.15) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md"
      >
        <motion.div
          variants={fadeInUp}
          className="rounded-2xl border shadow-[0_4px_24px_-8px_rgba(26,26,46,0.14),0_1px_2px_rgba(26,26,46,0.06)] overflow-hidden"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          {/* Header */}
          <div
            className="px-8 pt-10 pb-6 text-center border-b"
            style={{ borderColor: "var(--border)" }}
          >
            {/* Logo mark */}
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 shadow-sm"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <BookOpen
                className="w-6 h-6"
                style={{ color: "var(--primary)" }}
                aria-hidden="true"
              />
            </div>

            <h1
              className="text-3xl font-bold tracking-tight mb-1"
              style={{
                fontFamily: "Playfair Display, Georgia, serif",
                color: "var(--foreground)",
              }}
            >
              Reset Your Password
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Enter your {APP_NAME} account email and we&apos;ll send you a reset link.
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col items-center gap-4 text-center py-4"
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: "var(--accent-light)" }}
                >
                  <CheckCircle
                    className="h-7 w-7"
                    style={{ color: "var(--accent)" }}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p
                    className="text-base font-semibold mb-1"
                    style={{ color: "var(--foreground)" }}
                  >
                    Check your email for a reset link
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    We sent a password reset link to{" "}
                    <span
                      className="font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      {email}
                    </span>.
                    Check your inbox and follow the instructions.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="mt-2 text-sm font-medium transition-colors duration-200"
                  style={{ color: "var(--accent)" }}
                >
                  Back to Login
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Error banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                    role="alert"
                  >
                    <AlertCircle
                      className="h-4 w-4 text-red-500 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <p className="text-sm text-red-700 leading-snug">{error}</p>
                  </motion.div>
                )}

                {/* Email field */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                      style={{ color: "var(--muted-foreground)" }}
                      aria-hidden="true"
                    />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={cn(
                        "w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200",
                        "placeholder:text-[var(--muted-foreground)]",
                        "focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]"
                      )}
                      style={{
                        backgroundColor: "var(--background)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    loading
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:opacity-90 active:scale-[0.98]"
                  )}
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--primary)",
                  }}
                >
                  {loading ? "Sending reset link..." : "Send Reset Link"}
                </button>

                {/* Back to login */}
                <p
                  className="text-center text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Remember your password?{" "}
                  <Link
                    href="/login"
                    className="font-medium transition-colors duration-200 hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    Back to Login
                  </Link>
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
