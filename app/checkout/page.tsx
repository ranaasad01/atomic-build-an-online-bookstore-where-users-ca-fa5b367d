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
import { CartItem, FREE_SHIPPING_THRESHOLD, TAX_RATE } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";

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
          error
            ? "border-red-400 focus:ring-red-300/40"
            : "border-[var(--border)]"
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
  options,
  error,
  className,
  ...props
}: {
  label: string;
  id: string;
  options: string[];
  error?: string;
  className?: string;
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
          error
            ? "border-red-400 focus:ring-red-300/40"
            : "border-[var(--border)]"
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <FieldError msg={error} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const t = useTranslations();
  const router = useRouter();

  const [step, setStep] = useState<Step>("shipping");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  const [shipping, setShipping] = useState<ShippingAddress>({
    fullName: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "AL",
    postalCode: "",
    country: "United States",
    shippingMethod: "free",
  });

  const [payment, setPayment] = useState<PaymentDetails>({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  const [shippingErrors, setShippingErrors] = useState<Partial<ShippingAddress>>({});
  const [paymentErrors, setPaymentErrors] = useState<Partial<PaymentDetails>>({});

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("pageturner_cart");
      if (raw) setCartItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // ignore
    }
  }, []);

  // ─── Derived totals ───────────────────────────────────────────────────────

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const selectedRate = SHIPPING_RATES.find((r) => r.id === shipping.shippingMethod) ?? SHIPPING_RATES[0];
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : selectedRate.price;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shippingCost + tax;

  // ─── Validation ───────────────────────────────────────────────────────────

  const validateShipping = useCallback((): boolean => {
    const errs: Partial<ShippingAddress> = {};
    if (!shipping.fullName.trim()) errs.fullName = "Full name is required";
    if (!shipping.email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(shipping.email))
      errs.email = "A valid email is required";
    if (!shipping.addressLine1.trim()) errs.addressLine1 = "Address is required";
    if (!shipping.city.trim()) errs.city = "City is required";
    if (!shipping.postalCode.trim()) errs.postalCode = "Postal code is required";
    setShippingErrors(errs);
    return Object.keys(errs).length === 0;
  }, [shipping]);

  const validatePayment = useCallback((): boolean => {
    const errs: Partial<PaymentDetails> = {};
    const digits = payment.cardNumber.replace(/\s/g, "");
    if (digits.length < 16) errs.cardNumber = "Enter a valid 16-digit card number";
    if (!payment.cardName.trim()) errs.cardName = "Name on card is required";
    if (!/^\d{2}\/\d{2}$/.test(payment.expiry)) errs.expiry = "Enter expiry as MM/YY";
    if (payment.cvv.length < 3) errs.cvv = "CVV must be 3–4 digits";
    setPaymentErrors(errs);
    return Object.keys(errs).length === 0;
  }, [payment]);

  // ─── Step navigation ──────────────────────────────────────────────────────

  const handleShippingNext = () => {
    if (validateShipping()) setStep("payment");
  };

  const handlePaymentNext = () => {
    if (validatePayment()) setStep("review");
  };

  // ─── Place order ──────────────────────────────────────────────────────────

  const handlePlaceOrder = async () => {
    if (!validateShipping() || !validatePayment()) {
      setStep("shipping");
      return;
    }

    setIsPlacing(true);
    setPlaceError(null);

    try {
      const orderNumber = generateOrderNumber();

      // Get current user (null for guest checkout)
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Persist order to Supabase
      const { error: insertError } = await supabase.from("orders").insert({
        order_number: orderNumber,
        items: cartItems,
        subtotal,
        tax,
        shipping_cost: shippingCost,
        total,
        shipping_name: shipping.fullName,
        shipping_email: shipping.email,
        shipping_address_line1: shipping.addressLine1,
        shipping_city: shipping.city,
        shipping_state: shipping.state,
        shipping_postal_code: shipping.postalCode,
        shipping_country: shipping.country,
        shipping_method: shipping.shippingMethod,
        user_id: user?.id ?? null,
      });

      if (insertError) {
        // Non-fatal: log but continue so the user still gets a confirmation
        console.error("Failed to persist order to Supabase:", insertError.message);
      }

      // Write to localStorage for the order-confirmation page
      const orderData = {
        orderNumber,
        items: cartItems,
        shipping,
        subtotal,
        tax,
        shippingCost,
        total,
        placedAt: new Date().toISOString(),
      };
      localStorage.setItem("pageturner_last_order", JSON.stringify(orderData));

      // Clear cart
      localStorage.removeItem("pageturner_cart");

      router.push("/order-confirmation");
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setPlaceError(message);
      setIsPlacing(false);
    }
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
          <h1 className="font-display text-2xl font-bold text-[var(--foreground)] mb-2">Your cart is empty</h1>
          <p className="text-[var(--muted-foreground)] mb-6">Add some books before checking out.</p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--accent-hover)]"
          >
            Browse Catalog
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] pb-24">
      {/* Header */}
      <Reveal>
        <section className="bg-[var(--primary)] py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-6">
              <Link
                href="/cart"
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Cart
              </Link>
              <ChevronRight className="h-4 w-4 text-white/40" />
              <span className="text-white text-sm font-medium">Checkout</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-white">Checkout</h1>

            {/* Step indicator */}
            <div className="mt-8 flex items-center gap-0">
              {STEPS.map((s, idx) => (
                <div key={s.id} className="flex items-center">
                  <button
                    onClick={() => {
                      if (idx < stepIndex) setStep(s.id);
                    }}
                    disabled={idx > stepIndex}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                      s.id === step
                        ? "bg-[var(--accent)] text-[var(--primary)]"
                        : idx < stepIndex
                        ? "text-white/80 hover:text-white cursor-pointer"
                        : "text-white/40 cursor-not-allowed"
                    )}
                  >
                    {s.icon}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 mx-1",
                        idx < stepIndex ? "text-white/60" : "text-white/20"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: form */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Shipping step ── */}
            {step === "shipping" && (
              <motion.div
                key="shipping"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]"
              >
                <h2 className="font-display text-xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[var(--accent)]" />
                  Shipping Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Full Name"
                    id="fullName"
                    value={shipping.fullName}
                    onChange={(e) => setShipping((p) => ({ ...p, fullName: e.target.value }))}
                    error={shippingErrors.fullName}
                    className="sm:col-span-2"
                    autoComplete="name"
                  />
                  <InputField
                    label="Email Address"
                    id="email"
                    type="email"
                    value={shipping.email}
                    onChange={(e) => setShipping((p) => ({ ...p, email: e.target.value }))}
                    error={shippingErrors.email}
                    className="sm:col-span-2"
                    autoComplete="email"
                  />
                  <InputField
                    label="Address Line 1"
                    id="addressLine1"
                    value={shipping.addressLine1}
                    onChange={(e) => setShipping((p) => ({ ...p, addressLine1: e.target.value }))}
                    error={shippingErrors.addressLine1}
                    className="sm:col-span-2"
                    autoComplete="address-line1"
                  />
                  <InputField
                    label="Address Line 2 (optional)"
                    id="addressLine2"
                    value={shipping.addressLine2}
                    onChange={(e) => setShipping((p) => ({ ...p, addressLine2: e.target.value }))}
                    className="sm:col-span-2"
                    autoComplete="address-line2"
                  />
                  <InputField
                    label="City"
                    id="city"
                    value={shipping.city}
                    onChange={(e) => setShipping((p) => ({ ...p, city: e.target.value }))}
                    error={shippingErrors.city}
                    autoComplete="address-level2"
                  />
                  <SelectField
                    label="State"
                    id="state"
                    options={US_STATES}
                    value={shipping.state}
                    onChange={(e) => setShipping((p) => ({ ...p, state: e.target.value }))}
                    autoComplete="address-level1"
                  />
                  <InputField
                    label="Postal Code"
                    id="postalCode"
                    value={shipping.postalCode}
                    onChange={(e) => setShipping((p) => ({ ...p, postalCode: e.target.value }))}
                    error={shippingErrors.postalCode}
                    autoComplete="postal-code"
                  />
                  <SelectField
                    label="Country"
                    id="country"
                    options={COUNTRIES}
                    value={shipping.country}
                    onChange={(e) => setShipping((p) => ({ ...p, country: e.target.value }))}
                    autoComplete="country-name"
                  />
                </div>

                {/* Shipping method */}
                <div className="mt-6">
                  <p className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-[var(--accent)]" />
                    Shipping Method
                  </p>
                  <div className="space-y-2">
                    {SHIPPING_RATES.map((rate) => {
                      const effectivePrice =
                        rate.id === "free" || subtotal >= FREE_SHIPPING_THRESHOLD
                          ? 0
                          : rate.price;
                      return (
                        <label
                          key={rate.id}
                          className={cn(
                            "flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all duration-200",
                            shipping.shippingMethod === rate.id
                              ? "border-[var(--accent)] bg-[var(--accent-light)]"
                              : "border-[var(--border)] hover:border-[var(--accent)]/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shippingMethod"
                              value={rate.id}
                              checked={shipping.shippingMethod === rate.id}
                              onChange={() =>
                                setShipping((p) => ({ ...p, shippingMethod: rate.id }))
                              }
                              className="accent-[var(--accent)]"
                            />
                            <div>
                              <p className="text-sm font-medium text-[var(--foreground)]">
                                {rate.label}
                              </p>
                              <p className="text-xs text-[var(--muted-foreground)]">
                                {rate.description}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-[var(--foreground)]">
                            {effectivePrice === 0 ? "Free" : `$${effectivePrice.toFixed(2)}`}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleShippingNext}
                  className="mt-6 w-full rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  Continue to Payment
                </button>
              </motion.div>
            )}

            {/* ── Payment step ── */}
            {step === "payment" && (
              <motion.div
                key="payment"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]"
              >
                <h2 className="font-display text-xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[var(--accent)]" />
                  Payment Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Card Number"
                    id="cardNumber"
                    value={payment.cardNumber}
                    onChange={(e) =>
                      setPayment((p) => ({ ...p, cardNumber: formatCard(e.target.value) }))
                    }
                    error={paymentErrors.cardNumber}
                    placeholder="1234 5678 9012 3456"
                    className="sm:col-span-2"
                    autoComplete="cc-number"
                    inputMode="numeric"
                  />
                  <InputField
                    label="Name on Card"
                    id="cardName"
                    value={payment.cardName}
                    onChange={(e) => setPayment((p) => ({ ...p, cardName: e.target.value }))}
                    error={paymentErrors.cardName}
                    className="sm:col-span-2"
                    autoComplete="cc-name"
                  />
                  <InputField
                    label="Expiry (MM/YY)"
                    id="expiry"
                    value={payment.expiry}
                    onChange={(e) =>
                      setPayment((p) => ({ ...p, expiry: formatExpiry(e.target.value) }))
                    }
                    error={paymentErrors.expiry}
                    placeholder="MM/YY"
                    autoComplete="cc-exp"
                    inputMode="numeric"
                  />
                  <InputField
                    label="CVV"
                    id="cvv"
                    value={payment.cvv}
                    onChange={(e) =>
                      setPayment((p) => ({
                        ...p,
                        cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                      }))
                    }
                    error={paymentErrors.cvv}
                    placeholder="123"
                    autoComplete="cc-csc"
                    inputMode="numeric"
                  />
                </div>

                <p className="mt-4 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                  <Lock className="h-3.5 w-3.5" />
                  Your payment information is encrypted and secure.
                </p>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setStep("shipping")}
                    className="flex-1 rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePaymentNext}
                    className="flex-1 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    Review Order
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Review step ── */}
            {step === "review" && (
              <motion.div
                key="review"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {/* Shipping summary */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[var(--accent)]" />
                      Shipping
                    </h2>
                    <button
                      onClick={() => setStep("shipping")}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-sm text-[var(--foreground)]">{shipping.fullName}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{shipping.email}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {shipping.addressLine1}
                    {shipping.addressLine2 ? `, ${shipping.addressLine2}` : ""}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {shipping.city}, {shipping.state} {shipping.postalCode}, {shipping.country}
                  </p>
                  <p className="mt-2 text-sm text-[var(--foreground)] font-medium">
                    {SHIPPING_RATES.find((r) => r.id === shipping.shippingMethod)?.label ?? "Standard"}
                  </p>
                </div>

                {/* Payment summary */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[var(--accent)]" />
                      Payment
                    </h2>
                    <button
                      onClick={() => setStep("payment")}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-sm text-[var(--foreground)]">{payment.cardName}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Card ending in {payment.cardNumber.replace(/\s/g, "").slice(-4)}
                  </p>
                </div>

                {/* Items summary */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
                  <h2 className="font-display text-lg font-bold text-[var(--foreground)] flex items-center gap-2 mb-4">
                    <ShoppingBag className="h-4 w-4 text-[var(--accent)]" />
                    Order Items
                  </h2>
                  <ul className="space-y-3">
                    {cartItems.map((item) => (
                      <li key={`${item.bookId}-${item.format}`} className="flex items-center gap-3">
                        <div className="h-12 w-9 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--accent-light)] flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
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
                          <p className="text-xs text-[var(--muted-foreground)]">{item.author} &middot; Qty {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-[var(--foreground)] flex-shrink-0">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                {placeError && (
                  <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {placeError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("payment")}
                    className="flex-1 rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacing}
                    className="flex-1 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] flex items-center justify-center gap-2"
                  >
                    {isPlacing ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Place Order
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right: order summary */}
          <div className="lg:col-span-1">
            <Reveal>
              <div className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
                <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-4">Order Summary</h2>

                <ul className="space-y-2 mb-4">
                  {cartItems.map((item) => (
                    <li
                      key={`${item.bookId}-${item.format}`}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-[var(--muted-foreground)] truncate max-w-[70%]">
                        {item.title} &times; {item.quantity}
                      </span>
                      <span className="font-medium text-[var(--foreground)]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-[var(--border)] pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Subtotal</span>
                    <span className="text-[var(--foreground)]">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Shipping</span>
                    <span className="text-[var(--foreground)]">
                      {shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Tax (8%)</span>
                    <span className="text-[var(--foreground)]">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-[var(--border)] pt-3 mt-2">
                    <span className="text-[var(--foreground)]">Total</span>
                    <span className="text-[var(--foreground)]">${total.toFixed(2)}</span>
                  </div>
                </div>

                {subtotal >= FREE_SHIPPING_THRESHOLD && (
                  <p className="mt-4 rounded-lg bg-[var(--accent-light)] px-3 py-2 text-xs text-[var(--foreground)] font-medium flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-[var(--accent)]" />
                    You qualify for free shipping!
                  </p>
                )}

                <p className="mt-4 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                  <Lock className="h-3.5 w-3.5" />
                  Secure, encrypted checkout
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </main>
  );
}
