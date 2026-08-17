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
            ? "border-red-400 focus:ring-red-400/30"
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
            ? "border-red-400 focus:ring-red-400/30"
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

// ─── Order Summary ────────────────────────────────────────────────────────────

function OrderSummary({
  items,
  subtotal,
  shippingCost,
  taxAmount,
  totalAmount,
}: {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] sticky top-24">
      <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-4">
        Order Summary
      </h2>

      {/* Items */}
      <ul className="space-y-3 mb-4">
        {items.map((item) => (
          <li key={`${item.bookId}-${item.format}`} className="flex gap-3">
            <div className="relative h-14 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--accent-light)]">
              <img
                src={item.coverImage}
                alt={item.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div className="flex flex-1 flex-col justify-center min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] line-clamp-1">{item.title}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{item.format} × {item.quantity}</p>
            </div>
            <span className="text-sm font-semibold text-[var(--foreground)] flex-shrink-0">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      <div className="border-t border-[var(--border)] pt-4 space-y-2">
        <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
          <span>Shipping</span>
          <span>{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
          <span>Tax (8%)</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-[var(--foreground)] border-t border-[var(--border)] pt-2 mt-2">
          <span>Total</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--accent-light)] px-3 py-2">
        <Lock className="h-3.5 w-3.5 text-[var(--accent)]" />
        <span className="text-xs text-[var(--muted-foreground)]">Secure checkout — 256-bit SSL encryption</span>
      </div>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const isCompleted = idx < stepIndex;
        const isActive = idx === stepIndex;
        return (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-[var(--accent)] text-[var(--primary)]"
                  : isCompleted
                  ? "bg-[var(--accent-light)] text-[var(--accent)]"
                  : "bg-[var(--background)] text-[var(--muted-foreground)] border border-[var(--border)]"
              )}
            >
              {step.icon}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-[var(--border)] mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const t = useTranslations();
  const router = useRouter();
  const { items: cartItems, clearCart, mounted: cartMounted } = useCart();

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

  // Derived totals
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const selectedRate = SHIPPING_RATES.find((r) => r.id === shippingAddress.shippingMethod) ?? SHIPPING_RATES[1];
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD && shippingAddress.shippingMethod === "free" ? 0 : selectedRate.price;
  const taxAmount = subtotal * TAX_RATE;
  const totalAmount = subtotal + shippingCost + taxAmount;

  // ─── Validation ─────────────────────────────────────────────────────────────

  function validateShipping(): boolean {
    const errors: Partial<ShippingAddress> = {};
    if (!shippingAddress.fullName.trim()) errors.fullName = "Full name is required";
    if (!shippingAddress.email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(shippingAddress.email))
      errors.email = "Valid email is required";
    if (!shippingAddress.addressLine1.trim()) errors.addressLine1 = "Address is required";
    if (!shippingAddress.city.trim()) errors.city = "City is required";
    if (!shippingAddress.state.trim()) errors.state = "State is required";
    if (!shippingAddress.postalCode.trim()) errors.postalCode = "Postal code is required";
    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validatePayment(): boolean {
    const errors: Partial<PaymentDetails> = {};
    const digits = paymentDetails.cardNumber.replace(/\s/g, "");
    if (digits.length < 16) errors.cardNumber = "Valid 16-digit card number required";
    if (!paymentDetails.cardName.trim()) errors.cardName = "Name on card is required";
    if (!/^\d{2}\/\d{2}$/.test(paymentDetails.expiry)) errors.expiry = "Valid expiry (MM/YY) required";
    if (paymentDetails.cvv.length < 3) errors.cvv = "Valid CVV required";
    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ─── Step navigation ─────────────────────────────────────────────────────────

  function handleShippingNext() {
    if (validateShipping()) setStep("payment");
  }

  function handlePaymentNext() {
    if (validatePayment()) setStep("review");
  }

  // ─── Place Order ─────────────────────────────────────────────────────────────

  const handlePlaceOrder = useCallback(async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const orderNumber = generateOrderNumber();

    // Build the localStorage payload (always saved regardless of DB result)
    const localOrderPayload = {
      orderNumber,
      items: cartItems,
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
      tax: taxAmount,
      shippingCost,
      total: totalAmount,
      placedAt: new Date().toISOString(),
    };

    // ── Persist to Supabase ──────────────────────────────────────────────────
    try {
      const supabase = createClient();

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          email: shippingAddress.email,
          full_name: shippingAddress.fullName,
          address_line1: shippingAddress.addressLine1,
          address_line2: shippingAddress.addressLine2 || null,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postalCode,
          country: shippingAddress.country,
          shipping_method: shippingAddress.shippingMethod,
          subtotal,
          shipping_cost: shippingCost,
          tax: taxAmount,
          total: totalAmount,
          status: "confirmed",
        })
        .select("id")
        .single();

      if (orderError) {
        // Log but don't block — fall through to localStorage + redirect
        console.error("[checkout] order insert failed:", orderError.message);
      } else if (order?.id) {
        // Insert order items
        const { error: itemsError } = await supabase.from("order_items").insert(
          cartItems.map((item) => ({
            order_id: order.id,
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
          console.error("[checkout] order_items insert failed:", itemsError.message);
        }
      }
    } catch (dbErr) {
      // Network or unexpected error — still proceed
      console.error("[checkout] unexpected DB error:", dbErr);
    }

    // ── Always save to localStorage for the confirmation page ────────────────
    try {
      localStorage.setItem("pageturner_last_order", JSON.stringify(localOrderPayload));
    } catch {
      // ignore storage errors
    }

    // ── Clear cart and navigate ──────────────────────────────────────────────
    clearCart();
    setIsSubmitting(false);
    router.push("/order-confirmation");
  }, [
    cartItems,
    shippingAddress,
    subtotal,
    shippingCost,
    taxAmount,
    totalAmount,
    clearCart,
    router,
  ]);

  // ─── Empty cart guard ────────────────────────────────────────────────────────

  if (cartMounted && cartItems.length === 0 && step !== "review") {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <ShoppingBag className="h-16 w-16 text-[var(--border)] mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-[var(--foreground)] mb-2">Your cart is empty</h1>
          <p className="text-[var(--muted-foreground)] mb-6">Add some books before checking out.</p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors duration-200"
          >
            Browse Catalog
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
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/cart"
                className="text-white/60 hover:text-white text-sm transition-colors duration-200"
              >
                Cart
              </Link>
              <ChevronRight className="h-4 w-4 text-white/40" />
              <span className="text-white text-sm font-medium">Checkout</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-white">Checkout</h1>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
        {/* Step indicator */}
        <StepIndicator currentStep={step} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Form ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── SHIPPING STEP ── */}
            {step === "shipping" && (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <motion.div
                  variants={fadeInUp}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <MapPin className="h-5 w-5 text-[var(--accent)]" />
                    <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Shipping Address</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Full Name"
                      id="fullName"
                      placeholder="Jane Smith"
                      value={shippingAddress.fullName}
                      onChange={(e) => setShippingAddress((p) => ({ ...p, fullName: e.target.value }))}
                      error={shippingErrors.fullName}
                      className="sm:col-span-2"
                    />
                    <InputField
                      label="Email Address"
                      id="email"
                      type="email"
                      placeholder="jane@example.com"
                      value={shippingAddress.email}
                      onChange={(e) => setShippingAddress((p) => ({ ...p, email: e.target.value }))}
                      error={shippingErrors.email}
                      className="sm:col-span-2"
                    />
                    <InputField
                      label="Address Line 1"
                      id="addressLine1"
                      placeholder="123 Main Street"
                      value={shippingAddress.addressLine1}
                      onChange={(e) => setShippingAddress((p) => ({ ...p, addressLine1: e.target.value }))}
                      error={shippingErrors.addressLine1}
                      className="sm:col-span-2"
                    />
                    <InputField
                      label="Address Line 2 (optional)"
                      id="addressLine2"
                      placeholder="Apt, suite, unit…"
                      value={shippingAddress.addressLine2}
                      onChange={(e) => setShippingAddress((p) => ({ ...p, addressLine2: e.target.value }))}
                      className="sm:col-span-2"
                    />
                    <InputField
                      label="City"
                      id="city"
                      placeholder="New York"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress((p) => ({ ...p, city: e.target.value }))}
                      error={shippingErrors.city}
                    />
                    <SelectField
                      label="State"
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress((p) => ({ ...p, state: e.target.value }))}
                      error={shippingErrors.state}
                    >
                      <option value="">Select state…</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </SelectField>
                    <InputField
                      label="Postal Code"
                      id="postalCode"
                      placeholder="10001"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress((p) => ({ ...p, postalCode: e.target.value }))}
                      error={shippingErrors.postalCode}
                    />
                    <SelectField
                      label="Country"
                      id="country"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress((p) => ({ ...p, country: e.target.value }))}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </SelectField>
                  </div>
                </motion.div>

                {/* Shipping method */}
                <motion.div
                  variants={fadeInUp}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <Truck className="h-5 w-5 text-[var(--accent)]" />
                    <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Shipping Method</h2>
                  </div>

                  <div className="space-y-3">
                    {SHIPPING_RATES.map((rate) => {
                      const isSelected = shippingAddress.shippingMethod === rate.id;
                      return (
                        <label
                          key={rate.id}
                          className={cn(
                            "flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all duration-200",
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
                              onChange={() => setShippingAddress((p) => ({ ...p, shippingMethod: rate.id }))}
                              className="accent-[var(--accent)]"
                            />
                            <div>
                              <p className="text-sm font-semibold text-[var(--foreground)]">{rate.label}</p>
                              <p className="text-xs text-[var(--muted-foreground)]">{rate.description}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-[var(--foreground)]">
                            {rate.price === 0 ? "Free" : `$${rate.price.toFixed(2)}`}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="flex justify-end">
                  <button
                    onClick={handleShippingNext}
                    className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-3 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors duration-200"
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
                className="space-y-6"
              >
                <motion.div
                  variants={fadeInUp}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="h-5 w-5 text-[var(--accent)]" />
                    <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Payment Details</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Card Number"
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentDetails.cardNumber}
                      onChange={(e) =>
                        setPaymentDetails((p) => ({ ...p, cardNumber: formatCard(e.target.value) }))
                      }
                      error={paymentErrors.cardNumber}
                      className="sm:col-span-2"
                      maxLength={19}
                      inputMode="numeric"
                    />
                    <InputField
                      label="Name on Card"
                      id="cardName"
                      placeholder="Jane Smith"
                      value={paymentDetails.cardName}
                      onChange={(e) => setPaymentDetails((p) => ({ ...p, cardName: e.target.value }))}
                      error={paymentErrors.cardName}
                      className="sm:col-span-2"
                    />
                    <InputField
                      label="Expiry Date"
                      id="expiry"
                      placeholder="MM/YY"
                      value={paymentDetails.expiry}
                      onChange={(e) =>
                        setPaymentDetails((p) => ({ ...p, expiry: formatExpiry(e.target.value) }))
                      }
                      error={paymentErrors.expiry}
                      maxLength={5}
                      inputMode="numeric"
                    />
                    <InputField
                      label="CVV"
                      id="cvv"
                      placeholder="123"
                      value={paymentDetails.cvv}
                      onChange={(e) =>
                        setPaymentDetails((p) => ({
                          ...p,
                          cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                        }))
                      }
                      error={paymentErrors.cvv}
                      maxLength={4}
                      inputMode="numeric"
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--accent-light)] px-3 py-2">
                    <Lock className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Your payment information is encrypted and never stored on our servers.
                    </span>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="flex justify-between">
                  <button
                    onClick={() => setStep("shipping")}
                    className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent-light)] transition-colors duration-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePaymentNext}
                    className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-3 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors duration-200"
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
                className="space-y-6"
              >
                {/* Shipping summary */}
                <motion.div
                  variants={fadeInUp}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-[var(--accent)]" />
                      <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Shipping</h2>
                    </div>
                    <button
                      onClick={() => setStep("shipping")}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] space-y-1">
                    <p className="font-medium text-[var(--foreground)]">{shippingAddress.fullName}</p>
                    <p>{shippingAddress.email}</p>
                    <p>{shippingAddress.addressLine1}{shippingAddress.addressLine2 ? `, ${shippingAddress.addressLine2}` : ""}</p>
                    <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                    <p>{shippingAddress.country}</p>
                    <p className="mt-2 font-medium text-[var(--foreground)]">
                      {SHIPPING_RATES.find((r) => r.id === shippingAddress.shippingMethod)?.label} shipping
                    </p>
                  </div>
                </motion.div>

                {/* Payment summary */}
                <motion.div
                  variants={fadeInUp}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-[var(--accent)]" />
                      <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Payment</h2>
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
                </motion.div>

                {/* Error message */}
                {submitError && (
                  <motion.div
                    variants={fadeInUp}
                    className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {submitError}
                  </motion.div>
                )}

                <motion.div variants={fadeInUp} className="flex justify-between">
                  <button
                    onClick={() => setStep("payment")}
                    className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent-light)] transition-colors duration-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold transition-all duration-200",
                      isSubmitting
                        ? "bg-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed"
                        : "bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent-hover)]"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        Placing Order…
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Place Order — ${totalAmount.toFixed(2)}
                      </>
                    )}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={cartItems}
              subtotal={subtotal}
              shippingCost={shippingCost}
              taxAmount={taxAmount}
              totalAmount={totalAmount}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
