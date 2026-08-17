"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/data";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/motion";

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
        const supabase = createClient();
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
          router.refresh();
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
    [email, password, validate, router]
  );

  // ── Email confirmation screen ──────────────────────────────────────────────

  if (emailSent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-16"
        style={{ background: "var(--background)" }}
      >
        {/* Background glow */}
        <div
          className="pointer-events-none fixed inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200,169,110,0.15) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-md rounded-2xl border p-10 text-center shadow-[0_4px_24px_-8px_rgba(26,26,46,0.14),0_1px_2px_rgba(26,26,46,0.06)]"
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
            Check your inbox
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

          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Already confirmed?{" "}
            <Link
              href="/login"
              className="font-semibold transition-colors duration-200 hover:underline"
              style={{ color: "var(--accent)" }}
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Sign-up form ──────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Background glow */}
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
              Create an account
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Join {APP_NAME} and start your reading journey
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* General error banner */}
              {errors.general && (
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
                  <p className="text-sm text-red-700 leading-snug">
                    {errors.general}
                  </p>
                </motion.div>
              )}

              {/* Email */}
              <div className="flex flex-col gap-1">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={loading}
                    className={cn(
                      "w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-all duration-200",
                      "placeholder:text-[var(--muted-foreground)]",
                      "focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      errors.email
                        ? "border-red-400 bg-red-50"
                        : "border-[var(--border)] bg-[var(--background)]"
                    )}
                    style={{ color: "var(--foreground)" }}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                </div>
                {errors.email && (
                  <span id="email-error">
                    <FieldError msg={errors.email} />
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="password"
                  className="text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                    style={{ color: "var(--muted-foreground)" }}
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={loading}
                    className={cn(
                      "w-full rounded-xl border pl-10 pr-11 py-2.5 text-sm outline-none transition-all duration-200",
                      "placeholder:text-[var(--muted-foreground)]",
                      "focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      errors.password
                        ? "border-red-400 bg-red-50"
                        : "border-[var(--border)] bg-[var(--background)]"
                    )}
                    style={{ color: "var(--foreground)" }}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors duration-200 hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    style={{ color: "var(--muted-foreground)" }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span id="password-error">
                    <FieldError msg={errors.password} />
                  </span>
                )}
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  Confirm password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                    style={{ color: "var(--muted-foreground)" }}
                    aria-hidden="true"
                  />
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    disabled={loading}
                    className={cn(
                      "w-full rounded-xl border pl-10 pr-11 py-2.5 text-sm outline-none transition-all duration-200",
                      "placeholder:text-[var(--muted-foreground)]",
                      "focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      errors.confirmPassword
                        ? "border-red-400 bg-red-50"
                        : "border-[var(--border)] bg-[var(--background)]"
                    )}
                    style={{ color: "var(--foreground)" }}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={
                      errors.confirmPassword ? "confirm-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors duration-200 hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    style={{ color: "var(--muted-foreground)" }}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span id="confirm-error">
                    <FieldError msg={errors.confirmPassword} />
                  </span>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
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
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div
                className="flex-1 h-px"
                style={{ backgroundColor: "var(--border)" }}
              />
              <span
                className="text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                Already have an account?
              </span>
              <div
                className="flex-1 h-px"
                style={{ backgroundColor: "var(--border)" }}
              />
            </div>

            <Link
              href="/login"
              className={cn(
                "flex w-full items-center justify-center rounded-xl border py-2.5 text-sm font-medium transition-all duration-200",
                "hover:bg-[var(--accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              )}
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              Sign in instead
            </Link>
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.p
          variants={fadeInUp}
          className="mt-6 text-center text-xs leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}
        >
          By creating an account you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-2 transition-colors duration-200 hover:text-[var(--foreground)]"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 transition-colors duration-200 hover:text-[var(--foreground)]"
          >
            Privacy Policy
          </Link>
          .
        </motion.p>
      </motion.div>
    </div>
  );
}
