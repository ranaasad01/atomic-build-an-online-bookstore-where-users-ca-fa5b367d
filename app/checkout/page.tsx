"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, CreditCard, MapPin, ChevronRight, Lock, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, TAX_RATE } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/hooks/useCart";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "shipping" | "payment" | "review";

interface ShippingAddress {
  fullName: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingMethod: string;
}

interface PaymentDetails {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
}

interface ShippingRate {
  id: string;
  label: string;
  description: string;
  price: number;
}

const SHIPPING_RATES: ShippingRate[] = [
  { id: "free", label: "Free Standard", description: "5–7 business days", price: 0 },
  { id: "standard", label: "Standard", description: "3–5 business days", price: 4.99 },
  { id: "express", label: "Express", description: "1–2 business days", price: 12.99 },
];

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "shipping", label: "Shipping", icon: <MapPin className="h-4 w-4" /> },
  { id: "payment", label: "Payment", icon: <CreditCard className="h-4 w-4" /> },
  { id: "review", label: "Review", icon: <CheckCircle className="h-4 w-4" /> },
];

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Other",
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateOrderNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "PT-";
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function formatCard(raw: string): string {
  return raw
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
      <AlertCircle className="h-3 w-3" />
      {msg}
    </p>
  );
}

function InputField({
  label,
  id,
  error,
  className,
  ...props
}: {
  label: string;
  id: string;
  error?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="text-sm font-medium text-[var(--foreground)]">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "rounded-xl border bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none transition-all duration-200",
          "placeholder:text-[var(--muted-foreground)]",
          "focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]",
          error ? "border-red-400" : "border-[var(--border)]"
        )}
        {...props}
      />
      <FieldError msg={error} />
    </div>
  );
}

function SelectField({
  label,
  id,
  error,
  className,
  children,
  ...props
}: {
  label: string;
  id: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="text-sm font-medium text-[var(--foreground)]">
        {label}
      </label>
      <select
        id={id}
        className={cn(
          "rounded-xl border bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none transition-all duration-200",
          "focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]",
          error ? "border-red-400" : "border-[var(--border)]"
        )}
        {...props}
      >
        {children}
      </select>
      <FieldError msg={error} />
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                active
                  ? "bg-[var(--accent)] text-[var(--primary)]"
                  : done
                  ? "bg-[var(--accent-light)] text-[var(--accent)]"
                  : "bg-[var(--border)] text-[var(--muted-foreground)]"
              )}
            >
              {step.icon}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 mx-1 text-[var(--border)]" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Order summary sidebar ────────────────────────────────────────────────────

function OrderSummary({
  subtotal,
  shippingCost,
  tax,
  total,
  itemCount,
}: {
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  itemCount: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] sticky top-24">
      <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-4">
        Order Summary
      </h2>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-[var(--muted-foreground)]">
          <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[var(--muted-foreground)]">
          <span>Shipping</span>
          <span>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
        </div>
        <div className="flex justify-between text-[var(--muted-foreground)]">
          <span>Tax (8%)</span>
          <span>{formatPrice(tax)}</span>
        </div>
        <div className="border-t border-[var(--border)] pt-3 flex justify-between font-semibold text-[var(--foreground)]">
          <span>Total</span>
          <span className="text-[var(--accent)]">{formatPrice(total)}</span>
        </div>
      </div>
      {subtotal < FREE_SHIPPING_THRESHOLD && (
        <p className="mt-4 text-xs text-[var(--muted-foreground)] bg-[var(--accent-light)] rounded-lg px-3 py-2">
          Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping.
        </p>
      )}
      <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
        <Lock className="h-3.5 w-3.5 text-[var(--accent)]" />
        Secure, encrypted checkout
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const t = useTranslations();
  const router = useRouter();
  const { items, totalItems, subtotal, clearCart, mounted } = useCart();

  const [step, setStep] = useState<Step>("shipping");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [shipping, setShipping] = useState<ShippingAddress>({
    fullName: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
    shippingMethod: "standard",
  });

  const [payment, setPayment] = useState<PaymentDetails>({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  const [shippingErrors, setShippingErrors] = useState<Partial<ShippingAddress>>({});
  const [paymentErrors, setPaymentErrors] = useState<Partial<PaymentDetails>>({});

  // Redirect to cart if empty (after mount)
  useEffect(() => {
    if (mounted && items.length === 0) {
      router.replace("/cart");
    }
  }, [mounted, items.length, router]);

  const selectedRate = SHIPPING_RATES.find((r) => r.id === shipping.shippingMethod) ?? SHIPPING_RATES[1];
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : selectedRate.price;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shippingCost + tax;

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validateShipping = useCallback((): boolean => {
    const errs: Partial<ShippingAddress> = {};
    if (!shipping.fullName.trim()) errs.fullName = "Full name is required.";
    if (!shipping.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) errs.email = "Enter a valid email.";
    if (!shipping.addressLine1.trim()) errs.addressLine1 = "Address is required.";
    if (!shipping.city.trim()) errs.city = "City is required.";
    if (!shipping.state.trim()) errs.state = "State is required.";
    if (!shipping.postalCode.trim()) errs.postalCode = "Postal code is required.";
    if (!shipping.country) errs.country = "Country is required.";
    setShippingErrors(errs);
    return Object.keys(errs).length === 0;
  }, [shipping]);

  const validatePayment = useCallback((): boolean => {
    const errs: Partial<PaymentDetails> = {};
    const digits = payment.cardNumber.replace(/\D/g, "");
    if (digits.length < 16) errs.cardNumber = "Enter a valid 16-digit card number.";
    if (!payment.cardName.trim()) errs.cardName = "Name on card is required.";
    if (!/^\d{2}\/\d{2}$/.test(payment.expiry)) errs.expiry = "Enter expiry as MM/YY.";
    if (payment.cvv.replace(/\D/g, "").length < 3) errs.cvv = "Enter a valid CVV.";
    setPaymentErrors(errs);
    return Object.keys(errs).length === 0;
  }, [payment]);

  // ─── Navigation ─────────────────────────────────────────────────────────────

  const handleShippingNext = useCallback(() => {
    if (validateShipping()) setStep("payment");
  }, [validateShipping]);

  const handlePaymentNext = useCallback(() => {
    if (validatePayment()) setStep("review");
  }, [validatePayment]);

  // ─── Place order (Supabase) ──────────────────────────────────────────────────

  const handlePlaceOrder = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const supabase = createClient();

      // 1) Get current session (nullable — guest checkout is allowed)
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id ?? null;

      // 2) Generate order number
      const orderNumber = generateOrderNumber();

      // 3) Insert into orders table
      const { data: orderRow, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: userId,
          subtotal,
          tax,
          shipping_cost: shippingCost,
          total,
          shipping_name: shipping.fullName,
          shipping_email: shipping.email,
          shipping_address: shipping.addressLine1 + (shipping.addressLine2 ? `, ${shipping.addressLine2}` : ""),
          shipping_city: shipping.city,
          shipping_state: shipping.state,
          shipping_postal_code: shipping.postalCode,
          shipping_country: shipping.country,
          shipping_method: shipping.shippingMethod,
        })
        .select("id")
        .single();

      if (orderError || !orderRow) {
        throw new Error(orderError?.message ?? "Failed to create order.");
      }

      const orderId = orderRow.id;

      // 4) Insert order items
      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((item) => ({
          order_id: orderId,
          book_id: item.bookId,
          title: item.title,
          author: item.author,
          price: item.price,
          quantity: item.quantity,
          format: item.format,
          cover_image: item.coverImage,
        }))
      );

      if (itemsError) {
        throw new Error(itemsError.message ?? "Failed to save order items.");
      }

      // 5) Persist order number for the confirmation page
      try {
        localStorage.setItem("pageturner_last_order", orderNumber);
      } catch {
        // ignore storage errors
      }

      // 6) Clear cart and navigate
      clearCart();
      router.push("/order-confirmation");
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }, [
    items,
    subtotal,
    tax,
    shippingCost,
    total,
    shipping,
    clearCart,
    router,
  ]);

  // ─── Render guards ───────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <ShoppingBag className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-4" />
          <p className="text-[var(--muted-foreground)] mb-4">Your cart is empty.</p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors duration-200"
          >
            Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Reveal>
          <div className="mb-8 text-center">
            <h1
              className="font-display text-3xl md:text-4xl font-bold text-[var(--foreground)] tracking-tight mb-2"
            >
              {t("checkout.heading")}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              <Link href="/cart" className="hover:text-[var(--accent)] transition-colors duration-200">
                ← Back to cart
              </Link>
            </p>
          </div>
        </Reveal>

        {/* Step indicator */}
        <StepIndicator current={step} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main form area */}
          <div className="lg:col-span-2">
            {/* ── SHIPPING STEP ── */}
            {step === "shipping" && (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
              >
                <motion.h2
                  variants={fadeInUp}
                  className="font-display text-xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2"
                >
                  <MapPin className="h-5 w-5 text-[var(--accent)]" />
                  Shipping Information
                </motion.h2>

                <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Full Name"
                    id="fullName"
                    placeholder="Jane Smith"
                    value={shipping.fullName}
                    onChange={(e) => setShipping((p) => ({ ...p, fullName: e.target.value }))}
                    error={shippingErrors.fullName}
                    className="sm:col-span-2"
                  />
                  <InputField
                    label="Email Address"
                    id="email"
                    type="email"
                    placeholder="jane@example.com"
                    value={shipping.email}
                    onChange={(e) => setShipping((p) => ({ ...p, email: e.target.value }))}
                    error={shippingErrors.email}
                    className="sm:col-span-2"
                  />
                  <InputField
                    label="Address Line 1"
                    id="addressLine1"
                    placeholder="123 Main St"
                    value={shipping.addressLine1}
                    onChange={(e) => setShipping((p) => ({ ...p, addressLine1: e.target.value }))}
                    error={shippingErrors.addressLine1}
                    className="sm:col-span-2"
                  />
                  <InputField
                    label="Address Line 2 (optional)"
                    id="addressLine2"
                    placeholder="Apt 4B"
                    value={shipping.addressLine2}
                    onChange={(e) => setShipping((p) => ({ ...p, addressLine2: e.target.value }))}
                    className="sm:col-span-2"
                  />
                  <InputField
                    label="City"
                    id="city"
                    placeholder="New York"
                    value={shipping.city}
                    onChange={(e) => setShipping((p) => ({ ...p, city: e.target.value }))}
                    error={shippingErrors.city}
                  />
                  <SelectField
                    label="State"
                    id="state"
                    value={shipping.state}
                    onChange={(e) => setShipping((p) => ({ ...p, state: e.target.value }))}
                    error={shippingErrors.state}
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </SelectField>
                  <InputField
                    label="Postal Code"
                    id="postalCode"
                    placeholder="10001"
                    value={shipping.postalCode}
                    onChange={(e) => setShipping((p) => ({ ...p, postalCode: e.target.value }))}
                    error={shippingErrors.postalCode}
                  />
                  <SelectField
                    label="Country"
                    id="country"
                    value={shipping.country}
                    onChange={(e) => setShipping((p) => ({ ...p, country: e.target.value }))}
                    error={shippingErrors.country}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </SelectField>
                </motion.div>

                {/* Shipping method */}
                <motion.div variants={fadeInUp} className="mt-6">
                  <p className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-[var(--accent)]" />
                    Shipping Method
                  </p>
                  <div className="space-y-2">
                    {SHIPPING_RATES.map((rate) => {
                      const effectivePrice = subtotal >= FREE_SHIPPING_THRESHOLD && rate.id === "free" ? 0 : rate.price;
                      const isDisabled = rate.id === "free" && subtotal < FREE_SHIPPING_THRESHOLD;
                      return (
                        <label
                          key={rate.id}
                          className={cn(
                            "flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all duration-200",
                            shipping.shippingMethod === rate.id
                              ? "border-[var(--accent)] bg-[var(--accent-light)]"
                              : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)]/50",
                            isDisabled && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shippingMethod"
                              value={rate.id}
                              checked={shipping.shippingMethod === rate.id}
                              onChange={() =>
                                !isDisabled &&
                                setShipping((p) => ({ ...p, shippingMethod: rate.id }))
                              }
                              disabled={isDisabled}
                              className="accent-[var(--accent)]"
                            />
                            <div>
                              <p className="text-sm font-medium text-[var(--foreground)]">{rate.label}</p>
                              <p className="text-xs text-[var(--muted-foreground)]">{rate.description}</p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-[var(--foreground)]">
                            {effectivePrice === 0 ? "Free" : formatPrice(effectivePrice)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="mt-8 flex justify-end">
                  <button
                    onClick={handleShippingNext}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors duration-200"
                  >
                    Continue to Payment
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* ── PAYMENT STEP ── */}
            {step === "payment" && (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
              >
                <motion.h2
                  variants={fadeInUp}
                  className="font-display text-xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2"
                >
                  <CreditCard className="h-5 w-5 text-[var(--accent)]" />
                  Payment Details
                </motion.h2>

                <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Card Number"
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={payment.cardNumber}
                    onChange={(e) =>
                      setPayment((p) => ({ ...p, cardNumber: formatCard(e.target.value) }))
                    }
                    error={paymentErrors.cardNumber}
                    className="sm:col-span-2"
                    inputMode="numeric"
                    maxLength={19}
                  />
                  <InputField
                    label="Name on Card"
                    id="cardName"
                    placeholder="Jane Smith"
                    value={payment.cardName}
                    onChange={(e) => setPayment((p) => ({ ...p, cardName: e.target.value }))}
                    error={paymentErrors.cardName}
                    className="sm:col-span-2"
                  />
                  <InputField
                    label="Expiry (MM/YY)"
                    id="expiry"
                    placeholder="08/27"
                    value={payment.expiry}
                    onChange={(e) =>
                      setPayment((p) => ({ ...p, expiry: formatExpiry(e.target.value) }))
                    }
                    error={paymentErrors.expiry}
                    inputMode="numeric"
                    maxLength={5}
                  />
                  <InputField
                    label="CVV"
                    id="cvv"
                    placeholder="123"
                    value={payment.cvv}
                    onChange={(e) =>
                      setPayment((p) => ({
                        ...p,
                        cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                      }))
                    }
                    error={paymentErrors.cvv}
                    inputMode="numeric"
                    maxLength={4}
                  />
                </motion.div>

                <motion.div
                  variants={fadeInUp}
                  className="mt-4 flex items-center gap-2 text-xs text-[var(--muted-foreground)] bg-[var(--accent-light)] rounded-xl px-4 py-3"
                >
                  <Lock className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
                  Your payment information is encrypted and never stored on our servers.
                </motion.div>

                <motion.div variants={fadeInUp} className="mt-8 flex justify-between">
                  <button
                    onClick={() => setStep("shipping")}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent-light)] transition-colors duration-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePaymentNext}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors duration-200"
                  >
                    Review Order
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* ── REVIEW STEP ── */}
            {step === "review" && (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {/* Shipping summary */}
                <motion.div
                  variants={fadeInUp}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[var(--accent)]" />
                      Shipping
                    </h3>
                    <button
                      onClick={() => setStep("shipping")}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] space-y-0.5">
                    <p className="font-medium text-[var(--foreground)]">{shipping.fullName}</p>
                    <p>{shipping.email}</p>
                    <p>{shipping.addressLine1}{shipping.addressLine2 ? `, ${shipping.addressLine2}` : ""}</p>
                    <p>{shipping.city}, {shipping.state} {shipping.postalCode}</p>
                    <p>{shipping.country}</p>
                    <p className="mt-1 text-[var(--accent)] font-medium">
                      {SHIPPING_RATES.find((r) => r.id === shipping.shippingMethod)?.label} shipping
                    </p>
                  </div>
                </motion.div>

                {/* Payment summary */}
                <motion.div
                  variants={fadeInUp}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[var(--accent)]" />
                      Payment
                    </h3>
                    <button
                      onClick={() => setStep("payment")}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Card ending in{" "}
                    <span className="font-medium text-[var(--foreground)]">
                      {payment.cardNumber.replace(/\s/g, "").slice(-4)}
                    </span>
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">{payment.cardName}</p>
                </motion.div>

                {/* Items summary */}
                <motion.div
                  variants={fadeInUp}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
                >
                  <h3 className="font-display text-base font-bold text-[var(--foreground)] flex items-center gap-2 mb-4">
                    <ShoppingBag className="h-4 w-4 text-[var(--accent)]" />
                    Items ({totalItems})
                  </h3>
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li key={`${item.bookId}-${item.format}`} className="flex items-center gap-3">
                        <div className="h-14 w-10 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--accent-light)] shrink-0">
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.title}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{item.author} · {item.format} · Qty {item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold text-[var(--foreground)] shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Submit error */}
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                    role="alert"
                  >
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700 leading-snug">{submitError}</p>
                  </motion.div>
                )}

                <motion.div variants={fadeInUp} className="flex justify-between">
                  <button
                    onClick={() => setStep("payment")}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent-light)] transition-colors duration-200 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-3 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_2px_12px_rgba(200,169,110,0.35)]"
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                        {t("checkout.processing")}
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        {t("checkout.placeOrder")}
                      </>
                    )}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Reveal>
              <OrderSummary
                subtotal={subtotal}
                shippingCost={shippingCost}
                tax={tax}
                total={total}
                itemCount={totalItems}
              />
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
