"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/data";
import { cn } from "@/lib/utils";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
      {msg}
    </p>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [emailSent, setEmailSent] = useState(false);

  const validate = useCallback((): boolean => {
    const next: typeof errors = {};
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Please enter a valid email address.";
    }
    if (!password) {
      next.password = "Password is required.";
    } else if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }
    if (!confirmPassword) {
      next.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [email, password, confirmPassword]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!validate()) return;

      setLoading(true);
      setErrors({});

      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrors({ general: error.message });
          return;
        }

        // If a session is returned immediately, the user is signed in.
        // If not, email confirmation is required.
        if (data.session) {
          router.push("/");
        } else {
          setEmailSent(true);
        }
      } catch (err) {
        setErrors({ general: "An unexpected error occurred. Please try again." });
        console.error("Signup error:", err);
      } finally {
        setLoading(false);
      }
    },
    [email, password, validate, supabase, router]
  );

  if (emailSent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-16"
        style={{ background: "var(--background)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md rounded-2xl border p-10 text-center shadow-[0_4px_24px_rgba(26,26,46,0.10)]"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "var(--accent-light)" }}
          >
            <CheckCircle
              className="h-8 w-8"
              style={{ color: "var(--accent)" }}
            />
          </div>
          <h1
            className="mb-3 text-2xl font-bold tracking-tight"
            style={{
              fontFamily: "Playfair Display, Georgia, serif",
              color: "var(--foreground)",
            }}
          >
            Check your email
          </h1>
          <p
            className="mb-6 text-sm leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            We sent a confirmation link to{" "}
            <span
              className="font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {email}
            </span>
            . Click the link in that email to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200"
            style={{
              background: "var(--accent)",
              color: "var(--primary)",
            }}
          >
            Back to sign in
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: "var(--background)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div
          className="rounded-2xl border shadow-[0_4px_24px_rgba(26,26,46,0.10)] overflow-hidden"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          {/* Header strip */}
          <div
            className="px-8 pt-8 pb-6 text-center"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            {/* Logo */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 mb-5 group"
              aria-label={`${APP_NAME} — Home`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{ background: "var(--primary)" }}
              >
                <BookOpen
                  className="w-4.5 h-4.5"
                  style={{ color: "var(--accent)" }}
                />
              </div>
              <span
                className="text-xl font-bold tracking-tight"
                style={{
                  fontFamily: "Playfair Display, Georgia, serif",
                  color: "var(--foreground)",
                }}
              >
                {APP_NAME}
              </span>
            </Link>

            <h1
              className="text-2xl font-bold tracking-tight"
              style={{
                fontFamily: "Playfair Display, Georgia, serif",
                color: "var(--foreground)",
              }}
            >
              Create your account
            </h1>
            <p
              className="mt-1.5 text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Join {APP_NAME} and start your reading journey.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="px-8 py-7 space-y-5">
            {/* General error */}
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{errors.general}</span>
              </motion.div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--foreground)" }}
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={cn(
                    "w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-all duration-200",
                    "placeholder:text-[var(--muted-foreground)]",
                    "focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]",
                    errors.email
                      ? "border-red-400 bg-red-50/40"
                      : "border-[var(--border)] bg-[var(--background)]"
                  )}
                  style={{ color: "var(--foreground)" }}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={!!errors.email}
                />
              </div>
              <FieldError msg={errors.email} />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--foreground)" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={cn(
                    "w-full rounded-xl border pl-10 pr-11 py-2.5 text-sm outline-none transition-all duration-200",
                    "placeholder:text-[var(--muted-foreground)]",
                    "focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]",
                    errors.password
                      ? "border-red-400 bg-red-50/40"
                      : "border-[var(--border)] bg-[var(--background)]"
                  )}
                  style={{ color: "var(--foreground)" }}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors hover:opacity-70"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <FieldError msg={errors.password} />
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--foreground)" }}
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={cn(
                    "w-full rounded-xl border pl-10 pr-11 py-2.5 text-sm outline-none transition-all duration-200",
                    "placeholder:text-[var(--muted-foreground)]",
                    "focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]",
                    errors.confirmPassword
                      ? "border-red-400 bg-red-50/40"
                      : "border-[var(--border)] bg-[var(--background)]"
                  )}
                  style={{ color: "var(--foreground)" }}
                  aria-invalid={!!errors.confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors hover:opacity-70"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <FieldError msg={errors.confirmPassword} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60",
                loading
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:opacity-90 active:scale-[0.98]"
              )}
              style={{
                background: "var(--accent)",
                color: "var(--primary)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
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
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            className="px-8 pb-7 text-center text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold transition-colors duration-200 hover:underline"
              style={{ color: "var(--accent)" }}
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Terms note */}
        <p
          className="mt-5 text-center text-xs leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}
        >
          By creating an account you agree to our{" "}
          <span className="underline cursor-default">Terms of Service</span> and{" "}
          <span className="underline cursor-default">Privacy Policy</span>.
        </p>
      </motion.div>
    </div>
  );
}
