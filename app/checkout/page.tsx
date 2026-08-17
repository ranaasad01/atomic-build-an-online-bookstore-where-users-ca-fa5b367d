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
          error
            ? "border-red-400 focus:ring-red-300/40"
            : "border-[var(--border)]"
        )}
        {...props}
      >
        {children}
      </select>
      <FieldError msg={error} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const t = useTranslations();
  const router = useRouter();
  const { items, clearCart } = useCart();

  const [step, setStep] = useState<Step>("shipping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
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

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  const [shippingErrors, setShippingErrors] = useState<Partial<ShippingAddress>>({});
  const [paymentErrors, setPaymentErrors] = useState<Partial<PaymentDetails>>({});

  // ─── Derived totals ──────────────────────────────────────────────────────

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const selectedRate = SHIPPING_RATES.find((r) => r.id === shippingAddress.shippingMethod) ?? SHIPPING_RATES[1];
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : selectedRate.price;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shippingCost + tax;

  // ─── Validation ──────────────────────────────────────────────────────────

  function validateShipping(): boolean {
    const errs: Partial<ShippingAddress> = {};
    if (!shippingAddress.fullName.trim()) errs.fullName = "Full name is required";
    if (!shippingAddress.email.trim()) errs.email = "Email is required";
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(shippingAddress.email)) errs.email = "Enter a valid email";
    if (!shippingAddress.addressLine1.trim()) errs.addressLine1 = "Address is required";
    if (!shippingAddress.city.trim()) errs.city = "City is required";
    if (!shippingAddress.postalCode.trim()) errs.postalCode = "Postal code is required";
    setShippingErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validatePayment(): boolean {
    const errs: Partial<PaymentDetails> = {};
    const digits = paymentDetails.cardNumber.replace(/\s/g, "");
    if (digits.length < 16) errs.cardNumber = "Enter a valid 16-digit card number";
    if (!paymentDetails.cardName.trim()) errs.cardName = "Name on card is required";
    if (!/^\d{2}\/\d{2}$/.test(paymentDetails.expiry)) errs.expiry = "Enter expiry as MM/YY";
    if (paymentDetails.cvv.length < 3) errs.cvv = "Enter a valid CVV";
    setPaymentErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ─── Step navigation ─────────────────────────────────────────────────────

  function handleShippingNext() {
    if (validateShipping()) setStep("payment");
  }

  function handlePaymentNext() {
    if (validatePayment()) setStep("review");
  }

  // ─── Order submission ─────────────────────────────────────────────────────

  const handlePlaceOrder = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const supabase = createClient();

      // Get current user (guest checkout allowed)
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? null;

      const orderId = crypto.randomUUID();
      const orderNumber = generateOrderNumber();
      const now = new Date().toISOString();

      // Insert order row
      const { error: orderError } = await supabase.from("orders").insert({
        id: orderId,
        order_number: orderNumber,
        user_id: userId,
        status: "confirmed",
        subtotal,
        shipping_cost: shippingCost,
        tax,
        total,
        shipping_name: shippingAddress.fullName,
        shipping_email: shippingAddress.email,
        shipping_address_line1: shippingAddress.addressLine1,
        shipping_address_line2: shippingAddress.addressLine2 || null,
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.state || null,
        shipping_postal_code: shippingAddress.postalCode,
        shipping_country: shippingAddress.country,
        shipping_method: shippingAddress.shippingMethod,
        created_at: now,
      });

      if (orderError) {
        throw new Error(orderError.message);
      }

      // Insert order_items rows
      const orderItems = items.map((item) => ({
        order_id: orderId,
        book_id: item.bookId,
        title: item.title,
        author: item.author,
        price: item.price,
        quantity: item.quantity,
        format: item.format,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

      if (itemsError) {
        throw new Error(itemsError.message);
      }

      // Save order to localStorage for confirmation page
      const storedOrder = {
        orderNumber,
        items,
        shipping: {
          fullName: shippingAddress.fullName,
          email: shippingAddress.email,
          addressLine1: shippingAddress.addressLine1,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          shippingMethod: shippingAddress.shippingMethod,
        },
        subtotal,
        tax,
        shippingCost,
        total,
        placedAt: now,
      };

      try {
        localStorage.setItem("pageturner_last_order", JSON.stringify(storedOrder));
      } catch {
        // ignore storage errors
      }

      // Clear cart
      clearCart();

      // Navigate to confirmation
      router.push("/order-confirmation");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    items,
    subtotal,
    shippingCost,
    tax,
    total,
    shippingAddress,
    clearCart,
    router,
  ]);

  // ─── Step index helper ────────────────────────────────────────────────────

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[var(--background)] pb-24">
      {/* Header */}
      <Reveal>
        <section className="bg-[var(--primary)] py-12">
          <div className="mx-auto max-w-4xl px-6">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-4">
              <Link href="/cart" className="hover:text-white transition-colors">
                Cart
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-white">Checkout</span>
            </div>
            <h1
              className="font-display text-3xl md:text-4xl font-bold text-white"
              style={{ fontFamily: "Playfair Display, Georgia, serif" }}
            >
              {t("checkout.heading")}
            </h1>

            {/* Step indicator */}
            <div className="mt-8 flex items-center gap-0">
              {STEPS.map((s, idx) => {
                const isCompleted = idx < stepIndex;
                const isCurrent = idx === stepIndex;
                return (
                  <div key={s.id} className="flex items-center">
                    <button
                      onClick={() => {
                        if (isCompleted) setStep(s.id);
                      }}
                      disabled={!isCompleted}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                        isCurrent
                          ? "bg-[var(--accent)] text-[var(--primary)]"
                          : isCompleted
                          ? "bg-white/20 text-white hover:bg-white/30 cursor-pointer"
                          : "bg-white/10 text-white/40 cursor-default"
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
                );
              })}
            </div>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto max-w-4xl px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Form steps ── */}
          <div className="lg:col-span-2">
            {/* SHIPPING STEP */}
            {step === "shipping" && (
              <motion.div
                key="shipping"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]"
              >
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="h-5 w-5 text-[var(--accent)]" />
                  <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
                    Shipping Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label={t("checkout.fullName")}
                    id="fullName"
                    value={shippingAddress.fullName}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    error={shippingErrors.fullName}
                    placeholder="Jane Smith"
                    className="sm:col-span-2"
                  />
                  <InputField
                    label={t("checkout.email")}
                    id="email"
                    type="email"
                    value={shippingAddress.email}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, email: e.target.value }))
                    }
                    error={shippingErrors.email}
                    placeholder="jane@example.com"
                    className="sm:col-span-2"
                  />
                  <InputField
                    label={t("checkout.address")}
                    id="addressLine1"
                    value={shippingAddress.addressLine1}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, addressLine1: e.target.value }))
                    }
                    error={shippingErrors.addressLine1}
                    placeholder="123 Main St"
                    className="sm:col-span-2"
                  />
                  <InputField
                    label="Apt, suite, etc. (optional)"
                    id="addressLine2"
                    value={shippingAddress.addressLine2}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, addressLine2: e.target.value }))
                    }
                    placeholder="Apt 4B"
                    className="sm:col-span-2"
                  />
                  <InputField
                    label={t("checkout.city")}
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, city: e.target.value }))
                    }
                    error={shippingErrors.city}
                    placeholder="New York"
                  />
                  <SelectField
                    label={t("checkout.country")}
                    id="country"
                    value={shippingAddress.country}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, country: e.target.value }))
                    }
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </SelectField>
                  {shippingAddress.country === "United States" ? (
                    <SelectField
                      label={t("checkout.state")}
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({ ...prev, state: e.target.value }))
                      }
                    >
                      <option value="">Select state</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </SelectField>
                  ) : (
                    <InputField
                      label={t("checkout.state")}
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({ ...prev, state: e.target.value }))
                      }
                      placeholder="Province / Region"
                    />
                  )}
                  <InputField
                    label={t("checkout.postalCode")}
                    id="postalCode"
                    value={shippingAddress.postalCode}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, postalCode: e.target.value }))
                    }
                    error={shippingErrors.postalCode}
                    placeholder="10001"
                  />
                </div>

                {/* Shipping method */}
                <div className="mt-6">
                  <p className="text-sm font-medium text-[var(--foreground)] mb-3">
                    Shipping Method
                  </p>
                  <div className="flex flex-col gap-2">
                    {SHIPPING_RATES.map((rate) => {
                      const effectivePrice =
                        rate.id === "free" || subtotal >= FREE_SHIPPING_THRESHOLD
                          ? 0
                          : rate.price;
                      const isSelected = shippingAddress.shippingMethod === rate.id;
                      return (
                        <label
                          key={rate.id}
                          className={cn(
                            "flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer transition-all duration-200",
                            isSelected
                              ? "border-[var(--accent)] bg-[var(--accent-light)]"
                              : "border-[var(--border)] hover:border-[var(--accent)]/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shippingMethod"
                              value={rate.id}
                              checked={isSelected}
                              onChange={() =>
                                setShippingAddress((prev) => ({
                                  ...prev,
                                  shippingMethod: rate.id,
                                }))
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
                  className="mt-6 w-full rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  Continue to Payment
                </button>
              </motion.div>
            )}

            {/* PAYMENT STEP */}
            {step === "payment" && (
              <motion.div
                key="payment"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]"
              >
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="h-5 w-5 text-[var(--accent)]" />
                  <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
                    Payment Details
                  </h2>
                  <span className="ml-auto flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                    <Lock className="h-3 w-3" /> Secure
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label={t("checkout.cardNumber")}
                    id="cardNumber"
                    value={paymentDetails.cardNumber}
                    onChange={(e) =>
                      setPaymentDetails((prev) => ({
                        ...prev,
                        cardNumber: formatCard(e.target.value),
                      }))
                    }
                    error={paymentErrors.cardNumber}
                    placeholder="1234 5678 9012 3456"
                    inputMode="numeric"
                    className="sm:col-span-2"
                  />
                  <InputField
                    label={t("checkout.cardName")}
                    id="cardName"
                    value={paymentDetails.cardName}
                    onChange={(e) =>
                      setPaymentDetails((prev) => ({ ...prev, cardName: e.target.value }))
                    }
                    error={paymentErrors.cardName}
                    placeholder="Jane Smith"
                    className="sm:col-span-2"
                  />
                  <InputField
                    label={t("checkout.expiry")}
                    id="expiry"
                    value={paymentDetails.expiry}
                    onChange={(e) =>
                      setPaymentDetails((prev) => ({
                        ...prev,
                        expiry: formatExpiry(e.target.value),
                      }))
                    }
                    error={paymentErrors.expiry}
                    placeholder="MM/YY"
                    inputMode="numeric"
                  />
                  <InputField
                    label={t("checkout.cvv")}
                    id="cvv"
                    value={paymentDetails.cvv}
                    onChange={(e) =>
                      setPaymentDetails((prev) => ({
                        ...prev,
                        cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                      }))
                    }
                    error={paymentErrors.cvv}
                    placeholder="123"
                    inputMode="numeric"
                    type="password"
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setStep("shipping")}
                    className="flex-1 rounded-xl border border-[var(--border)] bg-transparent px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-all duration-200 hover:bg-[var(--accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePaymentNext}
                    className="flex-[2] rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    Review Order
                  </button>
                </div>
              </motion.div>
            )}

            {/* REVIEW STEP */}
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
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[var(--accent)]" />
                      <h3 className="font-semibold text-[var(--foreground)]">Shipping</h3>
                    </div>
                    <button
                      onClick={() => setStep("shipping")}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-sm text-[var(--foreground)]">{shippingAddress.fullName}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{shippingAddress.email}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {shippingAddress.addressLine1}
                    {shippingAddress.addressLine2 && `, ${shippingAddress.addressLine2}`}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {shippingAddress.city}
                    {shippingAddress.state && `, ${shippingAddress.state}`}{" "}
                    {shippingAddress.postalCode}, {shippingAddress.country}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                    {SHIPPING_RATES.find((r) => r.id === shippingAddress.shippingMethod)?.label}
                  </p>
                </div>

                {/* Payment summary */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[var(--accent)]" />
                      <h3 className="font-semibold text-[var(--foreground)]">Payment</h3>
                    </div>
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
                      {paymentDetails.cardNumber.replace(/\s/g, "").slice(-4)}
                    </span>
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">{paymentDetails.cardName}</p>
                </div>

                {/* Items summary */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingBag className="h-4 w-4 text-[var(--accent)]" />
                    <h3 className="font-semibold text-[var(--foreground)]">
                      Items ({items.reduce((s, i) => s + i.quantity, 0)})
                    </h3>
                  </div>
                  <ul className="divide-y divide-[var(--border)]">
                    {items.map((item) => (
                      <li key={`${item.bookId}-${item.format}`} className="flex items-center gap-3 py-3">
                        <div className="h-14 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--accent-light)]">
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
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {item.author} · {item.format} · Qty {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Error message */}
                {submitError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-600">{submitError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("payment")}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl border border-[var(--border)] bg-transparent px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-all duration-200 hover:bg-[var(--accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting || items.length === 0}
                    className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        {t("checkout.processing")}
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        {t("checkout.placeOrder")}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right: Order summary ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
              <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-4">
                Order Summary
              </h2>

              {/* Items */}
              <ul className="space-y-2 mb-4">
                {items.map((item) => (
                  <li
                    key={`${item.bookId}-${item.format}`}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-[var(--muted-foreground)] truncate flex-1">
                      {item.title}
                      {item.quantity > 1 && (
                        <span className="ml-1 text-xs">×{item.quantity}</span>
                      )}
                    </span>
                    <span className="font-medium text-[var(--foreground)] flex-shrink-0">
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
                <div className="flex justify-between text-base font-bold border-t border-[var(--border)] pt-2 mt-2">
                  <span className="text-[var(--foreground)]">Total</span>
                  <span className="text-[var(--foreground)]">${total.toFixed(2)}</span>
                </div>
              </div>

              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <p className="mt-4 rounded-lg bg-[var(--accent-light)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                  Add{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)}
                  </span>{" "}
                  more for free shipping.
                </p>
              )}

              <div className="mt-4 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                <Lock className="h-3 w-3" />
                <span>Secure, encrypted checkout</span>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                <Truck className="h-3 w-3" />
                <span>Free returns within 30 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
