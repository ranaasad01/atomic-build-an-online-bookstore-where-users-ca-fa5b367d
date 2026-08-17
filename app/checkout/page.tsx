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
type ShippingAddress = any;
const ShippingAddress: any = [];
type PaymentDetails = any;
const PaymentDetails: any = [];
type SHIPPING_RATES = any;
const SHIPPING_RATES: any = [];

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "shipping" | "payment" | "review";

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
      <label htmlFor={id} className="text-sm font-medium text-[hsl(var(--foreground))]">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "rounded-xl border bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none transition-all duration-200",
          "placeholder:text-[hsl(var(--muted-foreground))]",
          "focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]",
          error
            ? "border-red-400 focus:ring-red-300/40"
            : "border-[hsl(var(--border))]"
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
      <label htmlFor={id} className="text-sm font-medium text-[hsl(var(--foreground))]">
        {label}
      </label>
      <select
        id={id}
        className={cn(
          "rounded-xl border bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none transition-all duration-200",
          "focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]",
          error
            ? "border-red-400 focus:ring-red-300/40"
            : "border-[hsl(var(--border))]"
        )}
        {...props}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <FieldError msg={error} />
    </div>
  );
}

// ─── Order Summary ────────────────────────────────────────────────────────────

function OrderSummary({
  items,
  shippingMethod,
}: {
  items: CartItem[];
  shippingMethod: ShippingAddress["shippingMethod"];
}) {
  const t = useTranslations();
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingCost =
    subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_RATES[shippingMethod] ?? SHIPPING_RATES.standard;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shippingCost + tax;

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[hsl(var(--foreground))]">
        <ShoppingBag className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
        {t("checkout.summary.title")}
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {t("checkout.summary.empty")}
        </p>
      ) : (
        <ul className="mb-4 divide-y divide-[hsl(var(--border))]">
          {items.map((item) => (
            <li key={item.bookId} className="flex items-start gap-3 py-3">
              <img
                src={item.coverImage}
                alt={item.title}
                className="h-14 w-10 rounded-lg object-cover shadow-sm ring-1 ring-black/5"
              />
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium leading-snug text-[hsl(var(--foreground))] line-clamp-2">
                  {item.title}
                </span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {item.author}
                </span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {t("checkout.summary.qty")} {item.quantity}
                </span>
              </div>
              <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 border-t border-[hsl(var(--border))] pt-4 text-sm">
        <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
          <span>{t("checkout.summary.subtotal")}</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
          <span>{t("checkout.summary.shipping")}</span>
          <span>
            {shippingCost === 0 ? (
              <span className="font-medium text-green-600">{t("checkout.summary.free")}</span>
            ) : (
              `$${shippingCost.toFixed(2)}`
            )}
          </span>
        </div>
        <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
          <span>{t("checkout.summary.tax")}</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-[hsl(var(--border))] pt-3 text-base font-bold text-[hsl(var(--foreground))]">
          <span>{t("checkout.summary.total")}</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {subtotal < FREE_SHIPPING_THRESHOLD && (
        <p className="mt-4 rounded-xl bg-[var(--accent)]/10 px-4 py-2.5 text-xs text-[hsl(var(--foreground))]">
          <Truck className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
          {t("checkout.summary.freeShippingHint", {
            amount: (FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2),
          })}
        </p>
      )}
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <nav aria-label="Checkout steps" className="mb-8">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <li key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                    done
                      ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                      : active
                      ? "border-[var(--accent)] bg-[hsl(var(--background))] text-[var(--accent)]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))]"
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? <CheckCircle className="h-4 w-4" /> : step.icon}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    active
                      ? "text-[hsl(var(--foreground))]"
                      : "text-[hsl(var(--muted-foreground))]"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 mb-5 h-0.5 flex-1 transition-all duration-500",
                    done ? "bg-[var(--accent)]" : "bg-[hsl(var(--border))]"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Shipping Form ────────────────────────────────────────────────────────────

function ShippingForm({
  data,
  onChange,
  errors,
}: {
  data: ShippingAddress;
  onChange: (d: ShippingAddress) => void;
  errors: Partial<Record<keyof ShippingAddress, string>>;
}) {
  const t = useTranslations();
  const set = (field: keyof ShippingAddress) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => onChange({ ...data, [field]: e.target.value });

  return (
    <div className="space-y-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-[hsl(var(--foreground))]">
        <MapPin className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
        {t("checkout.shipping.title")}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          label={t("checkout.shipping.fullName")}
          id="fullName"
          value={data.fullName}
          onChange={set("fullName")}
          placeholder="Jane Austen"
          autoComplete="name"
          error={errors.fullName}
          className="sm:col-span-2"
        />
        <InputField
          label={t("checkout.shipping.email")}
          id="email"
          type="email"
          value={data.email}
          onChange={set("email")}
          placeholder="jane@example.com"
          autoComplete="email"
          error={errors.email}
          className="sm:col-span-2"
        />
        <InputField
          label={t("checkout.shipping.address1")}
          id="addressLine1"
          value={data.addressLine1}
          onChange={set("addressLine1")}
          placeholder="123 Bookshelf Lane"
          autoComplete="address-line1"
          error={errors.addressLine1}
          className="sm:col-span-2"
        />
        <InputField
          label={t("checkout.shipping.address2")}
          id="addressLine2"
          value={data.addressLine2 ?? ""}
          onChange={set("addressLine2")}
          placeholder="Apt 4B (optional)"
          autoComplete="address-line2"
          className="sm:col-span-2"
        />
        <InputField
          label={t("checkout.shipping.city")}
          id="city"
          value={data.city}
          onChange={set("city")}
          placeholder="New York"
          autoComplete="address-level2"
          error={errors.city}
        />
        <SelectField
          label={t("checkout.shipping.state")}
          id="state"
          value={data.state}
          onChange={set("state")}
          options={US_STATES}
          error={errors.state}
        />
        <InputField
          label={t("checkout.shipping.postalCode")}
          id="postalCode"
          value={data.postalCode}
          onChange={set("postalCode")}
          placeholder="10001"
          autoComplete="postal-code"
          error={errors.postalCode}
        />
        <SelectField
          label={t("checkout.shipping.country")}
          id="country"
          value={data.country}
          onChange={set("country")}
          options={COUNTRIES}
          error={errors.country}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-[hsl(var(--foreground))]">
          {t("checkout.shipping.method")}
        </p>
        <div className="space-y-2">
          {(
            [
              {
                id: "standard",
                label: t("checkout.shipping.standard"),
                detail: t("checkout.shipping.standardDetail"),
                price: `$${SHIPPING_RATES.standard.toFixed(2)}`,
              },
              {
                id: "express",
                label: t("checkout.shipping.express"),
                detail: t("checkout.shipping.expressDetail"),
                price: `$${SHIPPING_RATES.express.toFixed(2)}`,
              },
              {
                id: "free",
                label: t("checkout.shipping.free"),
                detail: t("checkout.shipping.freeDetail"),
                price: t("checkout.summary.free"),
              },
            ] as const
          ).map((opt) => (
            <label
              key={opt.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all duration-200",
                data.shippingMethod === opt.id
                  ? "border-[var(--accent)] bg-[var(--accent)]/5"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[var(--accent)]/40"
              )}
            >
              <input
                type="radio"
                name="shippingMethod"
                value={opt.id}
                checked={data.shippingMethod === opt.id}
                onChange={set("shippingMethod")}
                className="accent-[var(--accent)]"
              />
              <div className="flex flex-1 items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                    {opt.label}
                  </span>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{opt.detail}</p>
                </div>
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  {opt.price}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Payment Form ─────────────────────────────────────────────────────────────

function PaymentForm({
  data,
  onChange,
  errors,
}: {
  data: PaymentDetails;
  onChange: (d: PaymentDetails) => void;
  errors: Partial<Record<keyof PaymentDetails, string>>;
}) {
  const t = useTranslations();
  const set =
    (field: keyof PaymentDetails) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let val: string | boolean = e.target.value;
      if (field === "sameAsShipping") val = e.target.checked;
      if (field === "cardNumber") val = formatCard(e.target.value);
      if (field === "expiryDate") val = formatExpiry(e.target.value);
      if (field === "cvv") val = e.target.value.replace(/\D/g, "").slice(0, 4);
      onChange({ ...data, [field]: val });
    };

  return (
    <div className="space-y-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-[hsl(var(--foreground))]">
        <CreditCard className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
        {t("checkout.payment.title")}
      </h2>

      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <div className="mb-3 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          {t("checkout.payment.secure")}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            label={t("checkout.payment.cardholderName")}
            id="cardholderName"
            value={data.cardholderName}
            onChange={set("cardholderName")}
            placeholder="Jane Austen"
            autoComplete="cc-name"
            error={errors.cardholderName}
            className="sm:col-span-2"
          />
          <InputField
            label={t("checkout.payment.cardNumber")}
            id="cardNumber"
            value={data.cardNumber}
            onChange={set("cardNumber")}
            placeholder="1234 5678 9012 3456"
            autoComplete="cc-number"
            inputMode="numeric"
            error={errors.cardNumber}
            className="sm:col-span-2"
          />
          <InputField
            label={t("checkout.payment.expiry")}
            id="expiryDate"
            value={data.expiryDate}
            onChange={set("expiryDate")}
            placeholder="MM/YY"
            autoComplete="cc-exp"
            inputMode="numeric"
            error={errors.expiryDate}
          />
          <InputField
            label={t("checkout.payment.cvv")}
            id="cvv"
            type="password"
            value={data.cvv}
            onChange={set("cvv")}
            placeholder="•••"
            autoComplete="cc-csc"
            inputMode="numeric"
            error={errors.cvv}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={data.sameAsShipping}
          onChange={set("sameAsShipping")}
          className="h-4 w-4 rounded accent-[var(--accent)]"
        />
        <span className="text-sm text-[hsl(var(--foreground))]">
          {t("checkout.payment.sameAsShipping")}
        </span>
      </label>

      <div className="flex items-center gap-3 rounded-xl bg-[hsl(var(--muted))]/40 px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">
        <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t("checkout.payment.disclaimer")}</span>
      </div>
    </div>
  );
}

// ─── Review Step ──────────────────────────────────────────────────────────────

function ReviewStep({
  shipping,
  payment,
  items,
}: {
  shipping: ShippingAddress;
  payment: PaymentDetails;
  items: CartItem[];
}) {
  const t = useTranslations();
  const maskedCard =
    payment.cardNumber.length >= 4
      ? `•••• •••• •••• ${payment.cardNumber.replace(/\s/g, "").slice(-4)}`
      : t("checkout.review.noCard");

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
        {t("checkout.review.title")}
      </h2>

      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))]">
          <MapPin className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
          {t("checkout.review.shippingTo")}
        </h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {shipping.fullName}
          <br />
          {shipping.addressLine1}
          {shipping.addressLine2 ? `, ${shipping.addressLine2}` : ""}
          <br />
          {shipping.city}, {shipping.state} {shipping.postalCode}
          <br />
          {shipping.country}
          <br />
          {shipping.email}
        </p>
        <p className="mt-2 text-xs font-medium capitalize text-[var(--accent)]">
          {shipping.shippingMethod} shipping
        </p>
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))]">
          <CreditCard className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
          {t("checkout.review.paymentMethod")}
        </h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {payment.cardholderName}
          <br />
          {maskedCard}
        </p>
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <h3 className="mb-3 text-sm font-semibold text-[hsl(var(--foreground))]">
          {t("checkout.review.items")} ({items.length})
        </h3>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.bookId}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-[hsl(var(--foreground))]">
                {item.title}{" "}
                <span className="text-[hsl(var(--muted-foreground))]">
                  x{item.quantity}
                </span>
              </span>
              <span className="font-medium text-[hsl(var(--foreground))]">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const t = useTranslations();
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [step, setStep] = useState<Step>("shipping");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    sameAsShipping: true,
  });

  const [shippingErrors, setShippingErrors] = useState<
    Partial<Record<keyof ShippingAddress, string>>
  >({});
  const [paymentErrors, setPaymentErrors] = useState<
    Partial<Record<keyof PaymentDetails, string>>
  >({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pageturner_cart");
      if (raw) setCartItems(JSON.parse(raw) as CartItem[]);
    } catch {
      setCartItems([]);
    }
  }, []);

  const validateShipping = useCallback((): boolean => {
    const errs: Partial<Record<keyof ShippingAddress, string>> = {};
    if (!shipping.fullName.trim()) errs.fullName = "Full name is required.";
    if (!shipping.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email))
      errs.email = "A valid email is required.";
    if (!shipping.addressLine1.trim()) errs.addressLine1 = "Address is required.";
    if (!shipping.city.trim()) errs.city = "City is required.";
    if (!shipping.state) errs.state = "State is required.";
    if (!shipping.postalCode.trim()) errs.postalCode = "Postal code is required.";
    if (!shipping.country) errs.country = "Country is required.";
    setShippingErrors(errs);
    return Object.keys(errs).length === 0;
  }, [shipping]);

  const validatePayment = useCallback((): boolean => {
    const errs: Partial<Record<keyof PaymentDetails, string>> = {};
    if (!payment.cardholderName.trim())
      errs.cardholderName = "Cardholder name is required.";
    const digits = payment.cardNumber.replace(/\s/g, "");
    if (digits.length < 13 || digits.length > 16)
      errs.cardNumber = "Enter a valid card number.";
    const [mm, yy] = payment.expiryDate.split("/");
    const month = parseInt(mm ?? "0", 10);
    const year = parseInt(yy ?? "0", 10) + 2000;
    const now = new Date();
    if (
      !mm ||
      !yy ||
      month < 1 ||
      month > 12 ||
      year < now.getFullYear() ||
      (year === now.getFullYear() && month < now.getMonth() + 1)
    )
      errs.expiryDate = "Enter a valid expiry date.";
    if (payment.cvv.length < 3) errs.cvv = "Enter a valid CVV.";
    setPaymentErrors(errs);
    return Object.keys(errs).length === 0;
  }, [payment]);

  const handleNext = () => {
    if (step === "shipping") {
      if (validateShipping()) setStep("payment");
    } else if (step === "payment") {
      if (validatePayment()) setStep("review");
    }
  };

  const handleBack = () => {
    if (step === "payment") setStep("shipping");
    else if (step === "review") setStep("payment");
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));

    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shippingCost =
      subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : SHIPPING_RATES[shipping.shippingMethod] ?? SHIPPING_RATES.standard;
    const tax = subtotal * TAX_RATE;
    const total = subtotal + shippingCost + tax;

    const deliveryDays =
      shipping.shippingMethod === "express"
        ? 2
        : shipping.shippingMethod === "free"
        ? 10
        : 5;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);

    const order = {
      orderNumber: generateOrderNumber(),
      items: cartItems,
      shipping,
      subtotal,
      shippingCost,
      tax,
      total,
      estimatedDelivery: deliveryDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      placedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("pageturner_last_order", JSON.stringify(order));
      localStorage.removeItem("pageturner_cart");
    } catch {
      // ignore storage errors
    }

    router.push("/order-confirmation");
  };

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] pb-24 pt-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <Reveal>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
              {t("checkout.heading")}
            </h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              {t("checkout.subheading")}
            </p>
          </div>
        </Reveal>

        {/* Empty cart guard */}
        {cartItems.length === 0 && (
          <Reveal>
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-20 text-center">
              <ShoppingBag className="h-12 w-12 text-[hsl(var(--muted-foreground))]" aria-hidden="true" />
              <p className="text-lg font-semibold text-[hsl(var(--foreground))]">
                {t("checkout.emptyCart")}
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {t("checkout.emptyCartSub")}
              </p>
              <Link
                href="/catalog"
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:opacity-90"
              >
                {t("checkout.browseCta")}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        )}

        {cartItems.length > 0 && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
            {/* Left column */}
            <div>
              <Reveal>
                <StepIndicator current={step} />
              </Reveal>

              <Reveal>
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
                  <motion.div
                    key={step}
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                  >
                    {step === "shipping" && (
                      <ShippingForm
                        data={shipping}
                        onChange={setShipping}
                        errors={shippingErrors}
                      />
                    )}
                    {step === "payment" && (
                      <PaymentForm
                        data={payment}
                        onChange={setPayment}
                        errors={paymentErrors}
                      />
                    )}
                    {step === "review" && (
                      <ReviewStep
                        shipping={shipping}
                        payment={payment}
                        items={cartItems}
                      />
                    )}
                  </motion.div>

                  {/* Navigation buttons */}
                  <div className="mt-8 flex items-center justify-between gap-4 border-t border-[hsl(var(--border))] pt-6">
                    {step !== "shipping" ? (
                      <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-5 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-all duration-200 hover:border-[var(--accent)]/50 hover:bg-[hsl(var(--card))]"
                      >
                        {t("checkout.back")}
                      </button>
                    ) : (
                      <Link
                        href="/cart"
                        className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-5 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-all duration-200 hover:border-[var(--accent)]/50 hover:bg-[hsl(var(--card))]"
                      >
                        {t("checkout.backToCart")}
                      </Link>
                    )}

                    {step !== "review" ? (
                      <motion.button
                        onClick={handleNext}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-7 py-2.5 text-sm font-semibold text-black shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-all duration-200 hover:opacity-90"
                      >
                        {t("checkout.continue")}
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting}
                        whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-7 py-2.5 text-sm font-semibold text-black shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                            {t("checkout.placing")}
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4" aria-hidden="true" />
                            {t("checkout.placeOrder")} — ${(subtotal + (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATES[shipping.shippingMethod] ?? SHIPPING_RATES.standard) + subtotal * TAX_RATE).toFixed(2)}
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Right column — Order Summary */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Reveal delay={0.1}>
                <OrderSummary
                  items={cartItems}
                  shippingMethod={shipping.shippingMethod}
                />
              </Reveal>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}