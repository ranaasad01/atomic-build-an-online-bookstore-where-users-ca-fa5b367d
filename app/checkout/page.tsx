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

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
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

// ─── Order summary sidebar ────────────────────────────────────────────────────

function OrderSummary({
  cartItems,
  subtotal,
  shippingCost,
  tax,
  total,
}: {
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] sticky top-24">
      <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-4">
        Order Summary
      </h2>
      <ul className="space-y-3 mb-4">
        {cartItems.map((item) => (
          <li key={`${item.bookId}-${item.format}`} className="flex gap-3 items-start">
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] line-clamp-1">{item.title}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{item.format} × {item.quantity}</p>
            </div>
            <span className="text-sm font-semibold text-[var(--foreground)] tabular-nums">
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
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-[var(--foreground)] pt-2 border-t border-[var(--border)]">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Shipping step ────────────────────────────────────────────────────────────

function ShippingStep({
  address,
  onChange,
  errors,
  subtotal,
}: {
  address: ShippingAddress;
  onChange: (field: keyof ShippingAddress, value: string) => void;
  errors: Partial<Record<keyof ShippingAddress, string>>;
  subtotal: number;
}) {
  const qualifiesForFree = subtotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <motion.div variants={fadeInUp} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--foreground)] mb-1">Shipping Details</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Where should we send your books?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Full Name"
          id="fullName"
          value={address.fullName}
          onChange={(e) => onChange("fullName", e.target.value)}
          placeholder="Jane Reader"
          error={errors.fullName}
          className="sm:col-span-2"
        />
        <InputField
          label="Email Address"
          id="email"
          type="email"
          value={address.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="jane@example.com"
          error={errors.email}
          className="sm:col-span-2"
        />
        <InputField
          label="Address Line 1"
          id="addressLine1"
          value={address.addressLine1}
          onChange={(e) => onChange("addressLine1", e.target.value)}
          placeholder="123 Bookshelf Lane"
          error={errors.addressLine1}
          className="sm:col-span-2"
        />
        <InputField
          label="Address Line 2 (optional)"
          id="addressLine2"
          value={address.addressLine2}
          onChange={(e) => onChange("addressLine2", e.target.value)}
          placeholder="Apt, suite, unit…"
          className="sm:col-span-2"
        />
        <InputField
          label="City"
          id="city"
          value={address.city}
          onChange={(e) => onChange("city", e.target.value)}
          placeholder="Portland"
          error={errors.city}
        />
        <SelectField
          label="Country"
          id="country"
          value={address.country}
          onChange={(e) => onChange("country", e.target.value)}
          error={errors.country}
        >
          <option value="">Select country…</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </SelectField>
        {address.country === "United States" ? (
          <SelectField
            label="State"
            id="state"
            value={address.state}
            onChange={(e) => onChange("state", e.target.value)}
            error={errors.state}
          >
            <option value="">Select state…</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectField>
        ) : (
          <InputField
            label="State / Province"
            id="state"
            value={address.state}
            onChange={(e) => onChange("state", e.target.value)}
            placeholder="State or province"
            error={errors.state}
          />
        )}
        <InputField
          label="Postal Code"
          id="postalCode"
          value={address.postalCode}
          onChange={(e) => onChange("postalCode", e.target.value)}
          placeholder="97201"
          error={errors.postalCode}
        />
      </div>

      {/* Shipping method */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Shipping Method</h3>
        <div className="space-y-2">
          {SHIPPING_RATES.map((rate) => {
            const isDisabled = rate.id === "free" && !qualifiesForFree;
            const isSelected = address.shippingMethod === rate.id;
            return (
              <label
                key={rate.id}
                className={cn(
                  "flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all duration-200",
                  isDisabled
                    ? "opacity-40 cursor-not-allowed border-[var(--border)]"
                    : isSelected
                    ? "border-[var(--accent)] bg-[var(--accent-light)]"
                    : "border-[var(--border)] hover:border-[var(--accent)]/50"
                )}
              >
                <input
                  type="radio"
                  name="shippingMethod"
                  value={rate.id}
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => !isDisabled && onChange("shippingMethod", rate.id)}
                  className="accent-[var(--accent)]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-[var(--accent)]" />
                    <span className="text-sm font-semibold text-[var(--foreground)]">{rate.label}</span>
                    {rate.id === "free" && !qualifiesForFree && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        (orders over ${FREE_SHIPPING_THRESHOLD})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{rate.description}</p>
                </div>
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {rate.price === 0 ? "Free" : `$${rate.price.toFixed(2)}`}
                </span>
              </label>
            );
          })}
        </div>
        {errors.shippingMethod && <FieldError msg={errors.shippingMethod} />}
      </div>
    </motion.div>
  );
}

// ─── Payment step ─────────────────────────────────────────────────────────────

function PaymentStep({
  payment,
  onChange,
  errors,
}: {
  payment: PaymentDetails;
  onChange: (field: keyof PaymentDetails, value: string) => void;
  errors: Partial<Record<keyof PaymentDetails, string>>;
}) {
  return (
    <motion.div variants={fadeInUp} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--foreground)] mb-1">Payment Details</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Your payment info is encrypted and secure.</p>
      </div>

      <div className="rounded-xl border border-[var(--accent-light)] bg-[var(--accent-light)] px-4 py-3 flex items-center gap-2">
        <Lock className="h-4 w-4 text-[var(--accent)]" />
        <p className="text-xs text-[var(--muted-foreground)]">
          This is a demo checkout. No real payment is processed.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Card Number"
          id="cardNumber"
          value={payment.cardNumber}
          onChange={(e) => onChange("cardNumber", formatCard(e.target.value))}
          placeholder="1234 5678 9012 3456"
          inputMode="numeric"
          error={errors.cardNumber}
          className="sm:col-span-2"
        />
        <InputField
          label="Name on Card"
          id="cardName"
          value={payment.cardName}
          onChange={(e) => onChange("cardName", e.target.value)}
          placeholder="Jane Reader"
          error={errors.cardName}
          className="sm:col-span-2"
        />
        <InputField
          label="Expiry (MM/YY)"
          id="expiry"
          value={payment.expiry}
          onChange={(e) => onChange("expiry", formatExpiry(e.target.value))}
          placeholder="MM/YY"
          inputMode="numeric"
          error={errors.expiry}
        />
        <InputField
          label="CVV"
          id="cvv"
          value={payment.cvv}
          onChange={(e) => onChange("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="123"
          inputMode="numeric"
          error={errors.cvv}
        />
      </div>
    </motion.div>
  );
}

// ─── Review step ──────────────────────────────────────────────────────────────

function ReviewStep({
  address,
  payment,
  cartItems,
  subtotal,
  shippingCost,
  tax,
  total,
}: {
  address: ShippingAddress;
  payment: PaymentDetails;
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}) {
  const shippingRate = SHIPPING_RATES.find((r) => r.id === address.shippingMethod);

  return (
    <motion.div variants={fadeInUp} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--foreground)] mb-1">Review Your Order</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Check everything looks right before placing your order.</p>
      </div>

      {/* Shipping summary */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Shipping To</h3>
        </div>
        <p className="text-sm text-[var(--foreground)] font-medium">{address.fullName}</p>
        <p className="text-sm text-[var(--muted-foreground)]">{address.email}</p>
        <p className="text-sm text-[var(--muted-foreground)]">
          {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}
        </p>
        <p className="text-sm text-[var(--muted-foreground)]">
          {address.city}, {address.state} {address.postalCode}
        </p>
        <p className="text-sm text-[var(--muted-foreground)]">{address.country}</p>
        {shippingRate && (
          <p className="text-sm text-[var(--accent)] font-medium mt-2">
            {shippingRate.label} — {shippingRate.description}
          </p>
        )}
      </div>

      {/* Payment summary */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-4 w-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Payment</h3>
        </div>
        <p className="text-sm text-[var(--foreground)]">
          {payment.cardName} — ending in {payment.cardNumber.replace(/\s/g, "").slice(-4)}
        </p>
        <p className="text-sm text-[var(--muted-foreground)]">Expires {payment.expiry}</p>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="h-4 w-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">{cartItems.length} {cartItems.length === 1 ? "Book" : "Books"}</h3>
        </div>
        <ul className="space-y-2">
          {cartItems.map((item) => (
            <li key={`${item.bookId}-${item.format}`} className="flex justify-between text-sm">
              <span className="text-[var(--foreground)] line-clamp-1 flex-1 mr-2">
                {item.title} <span className="text-[var(--muted-foreground)]">× {item.quantity}</span>
              </span>
              <span className="font-semibold text-[var(--foreground)] tabular-nums">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const t = useTranslations();
  const router = useRouter();
  const { items: cartItems, clearCart, mounted: cartMounted } = useCart();

  const [currentStep, setCurrentStep] = useState<Step>("shipping");
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

  const [payment, setPayment] = useState<PaymentDetails>({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  const [shippingErrors, setShippingErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});
  const [paymentErrors, setPaymentErrors] = useState<Partial<Record<keyof PaymentDetails, string>>>({});

  // ── Derived totals ──────────────────────────────────────────────────────────

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingRate = SHIPPING_RATES.find((r) => r.id === shippingAddress.shippingMethod);
  const shippingCost = shippingRate?.price ?? 4.99;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shippingCost + tax;

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateShipping = useCallback((): boolean => {
    const errs: Partial<Record<keyof ShippingAddress, string>> = {};
    if (!shippingAddress.fullName.trim()) errs.fullName = "Full name is required";
    if (!shippingAddress.email.trim()) errs.email = "Email is required";
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(shippingAddress.email)) errs.email = "Enter a valid email";
    if (!shippingAddress.addressLine1.trim()) errs.addressLine1 = "Address is required";
    if (!shippingAddress.city.trim()) errs.city = "City is required";
    if (!shippingAddress.state.trim()) errs.state = "State is required";
    if (!shippingAddress.postalCode.trim()) errs.postalCode = "Postal code is required";
    if (!shippingAddress.country) errs.country = "Country is required";
    if (!shippingAddress.shippingMethod) errs.shippingMethod = "Select a shipping method";
    setShippingErrors(errs);
    return Object.keys(errs).length === 0;
  }, [shippingAddress]);

  const validatePayment = useCallback((): boolean => {
    const errs: Partial<Record<keyof PaymentDetails, string>> = {};
    const digits = payment.cardNumber.replace(/\s/g, "");
    if (digits.length < 13) errs.cardNumber = "Enter a valid card number";
    if (!payment.cardName.trim()) errs.cardName = "Name on card is required";
    if (!/^\d{2}\/\d{2}$/.test(payment.expiry)) errs.expiry = "Enter expiry as MM/YY";
    if (payment.cvv.length < 3) errs.cvv = "Enter a valid CVV";
    setPaymentErrors(errs);
    return Object.keys(errs).length === 0;
  }, [payment]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    if (currentStep === "shipping") {
      if (validateShipping()) setCurrentStep("payment");
    } else if (currentStep === "payment") {
      if (validatePayment()) setCurrentStep("review");
    }
  }, [currentStep, validateShipping, validatePayment]);

  const handleBack = useCallback(() => {
    if (currentStep === "payment") setCurrentStep("shipping");
    else if (currentStep === "review") setCurrentStep("payment");
  }, [currentStep]);

  // ── Place order ─────────────────────────────────────────────────────────────

  const handlePlaceOrder = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const supabase = createClient();
      const orderNumber = generateOrderNumber();

      const { data, error } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          items: cartItems as unknown as Record<string, unknown>[],
          subtotal,
          shipping_cost: shippingCost,
          tax,
          total,
          shipping_name: shippingAddress.fullName,
          shipping_email: shippingAddress.email,
          shipping_address_line1: shippingAddress.addressLine1,
          shipping_address_line2: shippingAddress.addressLine2,
          shipping_city: shippingAddress.city,
          shipping_state: shippingAddress.state,
          shipping_postal_code: shippingAddress.postalCode,
          shipping_country: shippingAddress.country,
          shipping_method: shippingAddress.shippingMethod,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Build the stored order shape that order-confirmation page expects
      const storedOrder = {
        orderNumber: data.order_number ?? orderNumber,
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
        tax,
        shippingCost,
        total,
        placedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem("pageturner_last_order", JSON.stringify(storedOrder));
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
    cartItems,
    subtotal,
    shippingCost,
    tax,
    total,
    shippingAddress,
    clearCart,
    router,
  ]);

  // ── Empty cart guard ────────────────────────────────────────────────────────

  if (cartMounted && cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <ShoppingBag className="h-16 w-16 text-[var(--border)] mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-[var(--foreground)] mb-2">Your cart is empty</h1>
          <p className="text-[var(--muted-foreground)] mb-6">Add some books before checking out.</p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white"
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
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]">
                <ShoppingBag className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  {t("checkout.heading")}
                </h1>
                <p className="text-sm text-white/60">Secure checkout</p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
        {/* Step indicator */}
        <StepIndicator currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main form area */}
          <div className="lg:col-span-2">
            <motion.div
              key={currentStep}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]"
            >
              {currentStep === "shipping" && (
                <ShippingStep
                  address={shippingAddress}
                  onChange={(field, value) =>
                    setShippingAddress((prev) => ({ ...prev, [field]: value }))
                  }
                  errors={shippingErrors}
                  subtotal={subtotal}
                />
              )}
              {currentStep === "payment" && (
                <PaymentStep
                  payment={payment}
                  onChange={(field, value) =>
                    setPayment((prev) => ({ ...prev, [field]: value }))
                  }
                  errors={paymentErrors}
                />
              )}
              {currentStep === "review" && (
                <ReviewStep
                  address={shippingAddress}
                  payment={payment}
                  cartItems={cartItems}
                  subtotal={subtotal}
                  shippingCost={shippingCost}
                  tax={tax}
                  total={total}
                />
              )}

              {/* Error message */}
              {submitError && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="mt-8 flex items-center justify-between gap-4">
                {currentStep !== "shipping" ? (
                  <button
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-all duration-200 hover:bg-[var(--accent-light)] disabled:opacity-50"
                  >
                    Back
                  </button>
                ) : (
                  <Link
                    href="/cart"
                    className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-all duration-200 hover:bg-[var(--accent-light)]"
                  >
                    Back to Cart
                  </Link>
                )}

                {currentStep !== "review" ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
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
                )}
              </div>
            </motion.div>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            {cartMounted && (
              <OrderSummary
                cartItems={cartItems}
                subtotal={subtotal}
                shippingCost={shippingCost}
                tax={tax}
                total={total}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
