"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/data";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/");
      router.refresh();
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
        {/* Card */}
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
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 shadow-sm" style={{ backgroundColor: "var(--accent)" }}>
              <BookOpen className="w-6 h-6" style={{ color: "var(--primary)" }} aria-hidden="true" />
            </div>

            <h1
              className="text-3xl font-bold tracking-tight mb-1"
              style={{
                fontFamily: "Playfair Display, Georgia, serif",
                color: "var(--foreground)",
              }}
            >
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Sign in to your {APP_NAME} account
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Error banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-sm text-red-700 leading-snug">{error}</p>
                </motion.div>
              )}

              {/* Email */}
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
                      "w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-all duration-200",
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

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium transition-colors duration-200 hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                    style={{ color: "var(--muted-foreground)" }}
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={cn(
                      "w-full rounded-xl border pl-10 pr-11 py-2.5 text-sm outline-none transition-all duration-200",
                      "placeholder:text-[var(--muted-foreground)]",
                      "focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]"
                    )}
                    style={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 transition-colors duration-200 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
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
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div
                  className="w-full border-t"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div className="relative flex justify-center">
                <span
                  className="px-3 text-xs"
                  style={{
                    backgroundColor: "var(--card)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  New to {APP_NAME}?
                </span>
              </div>
            </div>

            {/* Sign up link */}
            <Link
              href="/signup"
              className={cn(
                "flex w-full items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                "hover:bg-[var(--accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              )}
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              Create an account
            </Link>
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.p
          variants={fadeInUp}
          className="mt-6 text-center text-xs"
          style={{ color: "var(--muted-foreground)" }}
        >
          By signing in you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Privacy Policy
          </Link>
          .
        </motion.p>
      </motion.div>
    </div>
  );
}
