"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Package, MapPin, Calendar, ShoppingBag, ArrowRight, Star } from 'lucide-react';
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/lib/data";
import { TAX_RATE, FREE_SHIPPING_THRESHOLD } from "@/lib/data";

interface ShippingInfo {
  fullName: string;
  email: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingMethod: string;
}

interface StoredOrder {
  orderNumber: string;
  items: CartItem[];
  shipping: ShippingInfo;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  placedAt: string;
}

function generateEstimatedDelivery(method: string): string {
  const today = new Date("2025-01-15");
  const days =
    method === "express" ? 2 : method === "standard" ? 5 : 7;
  const delivery = new Date(today);
  delivery.setDate(today.getDate() + days);
  return delivery.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(n: number) {
  return `$${n.toFixed(2)}`;
}

const EMPTY_FALLBACK: StoredOrder = {
  orderNumber: "PT-000000",
  items: [],
  shipping: {
    fullName: "",
    email: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    shippingMethod: "standard",
  },
  subtotal: 0,
  tax: 0,
  shippingCost: 0,
  total: 0,
  placedAt: new Date("2025-01-15").toISOString(),
};

export default function OrderConfirmationPage() {
  const t = useTranslations();
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("pageturner_last_order");
      if (raw) {
        const parsed = JSON.parse(raw) as StoredOrder;
        setOrder(parsed);
      } else {
        setOrder(EMPTY_FALLBACK);
      }
    } catch {
      setOrder(EMPTY_FALLBACK);
    }
  }, []);

  if (!mounted || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const estimatedDelivery = generateEstimatedDelivery(
    order.shipping.shippingMethod
  );

  const shippingLabel =
    order.shipping.shippingMethod === "express"
      ? "Express (1-2 days)"
      : order.shipping.shippingMethod === "standard"
      ? "Standard (3-5 days)"
      : "Free Standard (5-7 days)";

  return (
    <main className="min-h-screen bg-[var(--background)] pb-24">
      {/* Success Banner */}
      <Reveal>
        <section className="relative overflow-hidden bg-[var(--primary)] py-16 md:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 0%, transparent 60%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)",
            }}
          />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)]/20 ring-4 ring-[var(--accent)]/30"
            >
              <CheckCircle className="h-10 w-10 text-[var(--accent)]" />
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="font-display text-3xl font-bold text-white md:text-4xl"
            >
              {t("orderConfirmation.heading")}
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="mt-3 text-white/70"
            >
              {t("orderConfirmation.subheading")}
            </motion.p>
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white"
            >
              <ShoppingBag className="h-4 w-4 text-[var(--accent)]" />
              {t("orderConfirmation.orderNumber")}{order.orderNumber}
            </motion.div>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Info Cards Row */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="-mt-8 mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {/* Shipping To */}
            <motion.div
              variants={fadeInUp}
              className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)]">
                <MapPin className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {t("orderConfirmation.shippingTo")}
                </p>
                {order.shipping.fullName ? (
                  <>
                    <p className="mt-1 text-sm font-semibold text-[var(--foreground)] truncate">
                      {order.shipping.fullName}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">
                      {order.shipping.city}, {order.shipping.state}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">—</p>
                )}
              </div>
            </motion.div>

            {/* Estimated Delivery */}
            <motion.div
              variants={fadeInUp}
              className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)]">
                <Calendar className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {t("orderConfirmation.estimatedDelivery")}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                  {estimatedDelivery}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">{shippingLabel}</p>
              </div>
            </motion.div>

            {/* Package */}
            <motion.div
              variants={fadeInUp}
              className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)]">
                <Package className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Items
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                  {order.items.reduce((sum, i) => sum + i.quantity, 0)} book
                  {order.items.reduce((sum, i) => sum + i.quantity, 0) !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {order.items.length} title{order.items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </Reveal>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: Items */}
          <div className="lg:col-span-2 space-y-6">
            <Reveal>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="border-b border-[var(--border)] px-6 py-4">
                  <h2 className="font-display text-lg font-bold text-[var(--foreground)]">
                    {t("orderConfirmation.yourBooks")}
                  </h2>
                </div>

                {order.items.length === 0 ? (
                  <div className="px-6 py-10 text-center text-[var(--muted-foreground)] text-sm">
                    No items in this order.
                  </div>
                ) : (
                  <ul className="divide-y divide-[var(--border)]">
                    {order.items.map((item) => (
                      <li
                        key={`${item.bookId}-${item.format}`}
                        className="flex items-center gap-4 px-6 py-4"
                      >
                        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--accent-light)]">
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
                          <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {item.author}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)] capitalize">
                            {item.format} &middot; Qty {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-[var(--foreground)] shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Reveal>

            {/* Shipping Details */}
            {order.shipping.fullName && (
              <Reveal>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="border-b border-[var(--border)] px-6 py-4">
                    <h2 className="font-display text-lg font-bold text-[var(--foreground)]">
                      Shipping Details
                    </h2>
                  </div>
                  <div className="px-6 py-5 space-y-1 text-sm text-[var(--foreground)]">
                    <p className="font-semibold">{order.shipping.fullName}</p>
                    {order.shipping.email && (
                      <p className="text-[var(--muted-foreground)]">{order.shipping.email}</p>
                    )}
                    <p>{order.shipping.addressLine1}</p>
                    <p>
                      {order.shipping.city}, {order.shipping.state} {order.shipping.postalCode}
                    </p>
                    <p>{order.shipping.country}</p>
                  </div>
                </div>
              </Reveal>
            )}
          </div>

          {/* Right: Summary */}
          <div className="space-y-6">
            <Reveal>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="border-b border-[var(--border)] px-6 py-4">
                  <h2 className="font-display text-lg font-bold text-[var(--foreground)]">
                    {t("orderConfirmation.orderSummary")}
                  </h2>
                </div>
                <div className="px-6 py-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">{t("cart.subtotal")}</span>
                    <span className="font-medium text-[var(--foreground)]">{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">{t("cart.shipping")}</span>
                    <span className="font-medium text-[var(--foreground)]">
                      {order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">{t("cart.tax")}</span>
                    <span className="font-medium text-[var(--foreground)]">{formatPrice(order.tax)}</span>
                  </div>
                  <div className="border-t border-[var(--border)] pt-3 flex justify-between">
                    <span className="font-semibold text-[var(--foreground)]">{t("cart.total")}</span>
                    <span className="font-bold text-lg text-[var(--foreground)]">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* CTA Buttons */}
            <Reveal>
              <div className="space-y-3">
                <Link
                  href="/catalog"
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200",
                    "bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent-hover)] hover:text-white",
                    "shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_-4px_rgba(200,169,110,0.4)]"
                  )}
                >
                  {t("orderConfirmation.continueShopping")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/"
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-semibold transition-all duration-200",
                    "text-[var(--foreground)] hover:bg-[var(--accent-light)] hover:border-[var(--accent)]"
                  )}
                >
                  {t("orderConfirmation.backHome")}
                </Link>
              </div>
            </Reveal>

            {/* Trust note */}
            <Reveal>
              <div className="flex items-center gap-2 rounded-xl bg-[var(--accent-light)] px-4 py-3">
                <Star className="h-4 w-4 shrink-0 fill-[var(--accent)] text-[var(--accent)]" />
                <p className="text-xs text-[var(--muted-foreground)] leading-snug">
                  A confirmation email has been sent to{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {order.shipping.email || "your email address"}
                  </span>.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </main>
  );
}
