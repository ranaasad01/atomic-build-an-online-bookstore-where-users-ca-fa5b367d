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

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;
        return (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-[var(--accent)] text-[var(--primary)]"
                  : isCompleted
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

// ─── Order Summary Sidebar ────────────────────────────────────────────────────

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
      <h3 className="font-display text-lg font-bold text-[var(--foreground)] mb-4">
        Order Summary
      </h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-[var(--muted-foreground)]">
          <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
          <span className="font-medium text-[var(--foreground)]">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[var(--muted-foreground)]">
          <span>Shipping</span>
          <span className="font-medium text-[var(--foreground)]">
            {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
          </span>
        </div>
        <div className="flex justify-between text-[var(--muted-foreground)]">
          <span>Tax (8%)</span>
          <span className="font-medium text-[var(--foreground)]">{formatPrice(tax)}</span>
        </div>
        <div className="border-t border-[var(--border)] pt-3 flex justify-between font-bold text-base">
          <span className="text-[var(--foreground)]">Total</span>
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
        <span>Secure, encrypted checkout</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const t = useTranslations();
  const router = useRouter();
  const { items, subtotal, clearCart, mounted: cartMounted } = useCart();

  const [step, setStep] = useState<Step>("shipping");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const selectedRate = SHIPPING_RATES.find((r) => r.id === shipping.shippingMethod) ?? SHIPPING_RATES[1];
  const shippingCost = selectedRate.price;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shippingCost + tax;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Redirect to cart if empty (after mount)
  useEffect(() => {
    if (cartMounted && items.length === 0) {
      router.replace("/cart");
    }
  }, [cartMounted, items.length, router]);

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validateShipping = useCallback((): boolean => {
    const errors: Partial<ShippingAddress> = {};
    if (!shipping.fullName.trim()) errors.fullName = "Full name is required";
    if (!shipping.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email))
      errors.email = "Enter a valid email address";
    if (!shipping.addressLine1.trim()) errors.addressLine1 = "Address is required";
    if (!shipping.city.trim()) errors.city = "City is required";
    if (!shipping.postalCode.trim()) errors.postalCode = "Postal code is required";
    if (shipping.country === "United States" && !shipping.state)
      errors.state = "State is required";
    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  }, [shipping]);

  const validatePayment = useCallback((): boolean => {
    const errors: Partial<PaymentDetails> = {};
    const digits = payment.cardNumber.replace(/\s/g, "");
    if (digits.length < 16) errors.cardNumber = "Enter a valid 16-digit card number";
    if (!payment.cardName.trim()) errors.cardName = "Name on card is required";
    if (!/^\d{2}\/\d{2}$/.test(payment.expiry)) errors.expiry = "Enter expiry as MM/YY";
    if (payment.cvv.length < 3) errors.cvv = "Enter a valid CVV";
    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  }, [payment]);

  // ─── Step navigation ─────────────────────────────────────────────────────────

  const handleShippingNext = useCallback(() => {
    if (validateShipping()) setStep("payment");
  }, [validateShipping]);

  const handlePaymentNext = useCallback(() => {
    if (validatePayment()) setStep("review");
  }, [validatePayment]);

  // ─── Place Order ─────────────────────────────────────────────────────────────

  const handlePlaceOrder = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const orderNumber = generateOrderNumber();
      const supabase = createClient();

      // Get current user (may be null for guests)
      const { data: { user } } = await supabase.auth.getUser();

      // Insert order row
      const { data: orderRow, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: user?.id ?? null,
          subtotal,
          tax,
          shipping_cost: shippingCost,
          total,
          shipping_name: shipping.fullName,
          shipping_email: shipping.email,
          shipping_address: shipping.addressLine1,
          shipping_city: shipping.city,
          shipping_state: shipping.state,
          shipping_postal_code: shipping.postalCode,
          shipping_country: shipping.country,
          shipping_method: shipping.shippingMethod,
          status: "pending",
        })
        .select("id")
        .single();

      if (orderError || !orderRow) {
        throw new Error(orderError?.message ?? "Failed to create order");
      }

      const orderId = orderRow.id as string;

      // Insert order items
      const orderItems = items.map((item) => ({
        order_id: orderId,
        book_id: item.bookId,
        title: item.title,
        author: item.author,
        price: item.price,
        quantity: item.quantity,
        format: item.format,
        cover_image: item.coverImage,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        throw new Error(itemsError.message ?? "Failed to save order items");
      }

      // Persist to sessionStorage for order-confirmation page
      const storedOrder = {
        id: orderId,
        orderNumber,
        items,
        shipping: {
          fullName: shipping.fullName,
          email: shipping.email,
          addressLine1: shipping.addressLine1,
          city: shipping.city,
          state: shipping.state,
          postalCode: shipping.postalCode,
          country: shipping.country,
          shippingMethod: shipping.shippingMethod,
        },
        subtotal,
        tax,
        shippingCost,
        total,
        placedAt: new Date().toISOString(),
      };

      try {
        sessionStorage.setItem("pageturner_last_order", JSON.stringify(storedOrder));
      } catch {
        // ignore storage errors
      }

      clearCart();
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
    tax,
    shippingCost,
    total,
    shipping,
    clearCart,
    router,
  ]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (!cartMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Reveal>
          <div className="mb-8 text-center">
            <Link
              href="/cart"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors duration-200 mb-4"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Back to cart
            </Link>
            <h1 className="font-display text-3xl font-bold text-[var(--foreground)] tracking-tight">
              Checkout
            </h1>
          </div>
        </Reveal>

        {/* Step indicator */}
        <StepIndicator currentStep={step} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Form ── */}
          <div className="lg:col-span-2">
            {/* SHIPPING STEP */}
            {step === "shipping" && (
              <motion.div
                key="shipping"
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
                    <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
                      Shipping Address
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Full Name"
                      id="fullName"
                      value={shipping.fullName}
                      onChange={(e) =>
                        setShipping((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      error={shippingErrors.fullName}
                      placeholder="Jane Smith"
                      className="sm:col-span-2"
                    />
                    <InputField
                      label="Email Address"
                      id="email"
                      type="email"
                      value={shipping.email}
                      onChange={(e) =>
                        setShipping((prev) => ({ ...prev, email: e.target.value }))
                      }
                      error={shippingErrors.email}
                      placeholder="jane@example.com"
                      className="sm:col-span-2"
                    />
                    <InputField
                      label="Address Line 1"
                      id="addressLine1"
                      value={shipping.addressLine1}
                      onChange={(e) =>
                        setShipping((prev) => ({ ...prev, addressLine1: e.target.value }))
                      }
                      error={shippingErrors.addressLine1}
                      placeholder="123 Main St"
                      className="sm:col-span-2"
                    />
                    <InputField
                      label="Address Line 2 (optional)"
                      id="addressLine2"
                      value={shipping.addressLine2}
                      onChange={(e) =>
                        setShipping((prev) => ({ ...prev, addressLine2: e.target.value }))
                      }
                      placeholder="Apt 4B"
                      className="sm:col-span-2"
                    />
                    <InputField
                      label="City"
                      id="city"
                      value={shipping.city}
                      onChange={(e) =>
                        setShipping((prev) => ({ ...prev, city: e.target.value }))
                      }
                      error={shippingErrors.city}
                      placeholder="New York"
                    />
                    <InputField
                      label="Postal Code"
                      id="postalCode"
                      value={shipping.postalCode}
                      onChange={(e) =>
                        setShipping((prev) => ({ ...prev, postalCode: e.target.value }))
                      }
                      error={shippingErrors.postalCode}
                      placeholder="10001"
                    />
                    <SelectField
                      label="Country"
                      id="country"
                      value={shipping.country}
                      onChange={(e) =>
                        setShipping((prev) => ({ ...prev, country: e.target.value, state: "" }))
                      }
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </SelectField>
                    {shipping.country === "United States" && (
                      <SelectField
                        label="State"
                        id="state"
                        value={shipping.state}
                        onChange={(e) =>
                          setShipping((prev) => ({ ...prev, state: e.target.value }))
                        }
                        error={shippingErrors.state}
                      >
                        <option value="">Select state</option>
                        {US_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </SelectField>
                    )}
                  </div>
                </motion.div>

                {/* Shipping method */}
                <motion.div
                  variants={fadeInUp}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <Truck className="h-5 w-5 text-[var(--accent)]" />
                    <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
                      Shipping Method
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {SHIPPING_RATES.map((rate) => (
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
                            onChange={(e) =>
                              setShipping((prev) => ({ ...prev, shippingMethod: e.target.value }))
                            }
                            className="accent-[var(--accent)]"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[var(--foreground)]">
                              {rate.label}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {rate.description}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[var(--foreground)]">
                          {rate.price === 0 ? "Free" : formatPrice(rate.price)}
                        </span>
                      </label>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="flex justify-end">
                  <button
                    onClick={handleShippingNext}
                    className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    Continue to Payment
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* PAYMENT STEP */}
            {step === "payment" && (
              <motion.div
                key="payment"
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
                    <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
                      Payment Details
                    </h2>
                    <span className="ml-auto flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                      <Lock className="h-3 w-3" /> Secure
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Card Number"
                      id="cardNumber"
                      value={payment.cardNumber}
                      onChange={(e) =>
                        setPayment((prev) => ({
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
                      label="Name on Card"
                      id="cardName"
                      value={payment.cardName}
                      onChange={(e) =>
                        setPayment((prev) => ({ ...prev, cardName: e.target.value }))
                      }
                      error={paymentErrors.cardName}
                      placeholder="Jane Smith"
                      className="sm:col-span-2"
                    />
                    <InputField
                      label="Expiry Date"
                      id="expiry"
                      value={payment.expiry}
                      onChange={(e) =>
                        setPayment((prev) => ({
                          ...prev,
                          expiry: formatExpiry(e.target.value),
                        }))
                      }
                      error={paymentErrors.expiry}
                      placeholder="MM/YY"
                      inputMode="numeric"
                    />
                    <InputField
                      label="CVV"
                      id="cvv"
                      value={payment.cvv}
                      onChange={(e) =>
                        setPayment((prev) => ({
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

                  <p className="mt-4 text-xs text-[var(--muted-foreground)]">
                    This is a demo checkout. No real payment is processed.
                  </p>
                </motion.div>

                <motion.div variants={fadeInUp} className="flex justify-between">
                  <button
                    onClick={() => setStep("shipping")}
                    className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Back
                  </button>
                  <button
                    onClick={handlePaymentNext}
                    className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    Review Order
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* REVIEW STEP */}
            {step === "review" && (
              <motion.div
                key="review"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {/* Items */}
                <motion.div
                  variants={fadeInUp}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingBag className="h-5 w-5 text-[var(--accent)]" />
                    <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
                      Your Items
                    </h2>
                  </div>
                  <ul className="divide-y divide-[var(--border)]">
                    {items.map((item) => (
                      <li key={`${item.bookId}-${item.format}`} className="flex gap-4 py-4">
                        <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--accent-light)]">
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/images/book-placeholder.jpg";
                            }}
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-center">
                          <p className="text-sm font-semibold text-[var(--foreground)] line-clamp-1">
                            {item.title}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {item.author} &middot; {item.format}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-[var(--foreground)] self-center">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Shipping summary */}
                <motion.div
                  variants={fadeInUp}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-[var(--accent)]" />
                      <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
                        Shipping To
                      </h2>
                    </div>
                    <button
                      onClick={() => setStep("shipping")}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] space-y-1">
                    <p className="font-semibold text-[var(--foreground)]">{shipping.fullName}</p>
                    <p>{shipping.email}</p>
                    <p>{shipping.addressLine1}{shipping.addressLine2 ? `, ${shipping.addressLine2}` : ""}</p>
                    <p>
                      {shipping.city}{shipping.state ? `, ${shipping.state}` : ""} {shipping.postalCode}
                    </p>
                    <p>{shipping.country}</p>
                    <p className="mt-2 font-medium text-[var(--foreground)]">
                      {selectedRate.label} ({selectedRate.description})
                    </p>
                  </div>
                </motion.div>

                {/* Error message */}
                {submitError && (
                  <motion.div
                    variants={fadeInUp}
                    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>{submitError}</p>
                  </motion.div>
                )}

                <motion.div variants={fadeInUp} className="flex justify-between">
                  <button
                    onClick={() => setStep("payment")}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-3 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Place Order
                      </>
                    )}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="lg:col-span-1">
            <Reveal>
              <OrderSummary
                subtotal={subtotal}
                shippingCost={shippingCost}
                tax={tax}
                total={total}
                itemCount={itemCount}
              />
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
