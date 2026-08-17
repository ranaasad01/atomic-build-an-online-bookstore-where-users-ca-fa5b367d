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
  const today = new Date();
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

function buildEmptyFallback(): StoredOrder {
  return {
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
    placedAt: new Date().toISOString(),
  };
}

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
        setOrder(buildEmptyFallback());
      }
    } catch {
      setOrder(buildEmptyFallback());
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
              {t("orderConfirmation.title")}
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mt-3 text-white/70"
            >
              {t("orderConfirmation.subtitle")}
            </motion.p>
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white ring-1 ring-white/20"
            >
              <Package className="h-4 w-4 text-[var(--accent)]" />
              {t("orderConfirmation.orderNumber")}: {order.orderNumber}
            </motion.div>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Delivery estimate */}
        <Reveal>
          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-light)]">
                <Calendar className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {t("orderConfirmation.estimatedDelivery")}
                </p>
                <p className="font-semibold text-[var(--foreground)]">{estimatedDelivery}</p>
              </div>
            </div>
            <span className="rounded-full bg-[var(--accent-light)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              {shippingLabel}
            </span>
          </div>
        </Reveal>

        {/* Order items */}
        {order.items.length > 0 && (
          <Reveal>
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="border-b border-[var(--border)] px-5 py-4">
                <h2 className="font-display text-lg font-bold text-[var(--foreground)]">
                  {t("orderConfirmation.itemsOrdered")}
                </h2>
              </div>
              <motion.ul
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="divide-y divide-[var(--border)]"
              >
                {order.items.map((item) => (
                  <motion.li
                    key={`${item.bookId}-${item.format}`}
                    variants={fadeInUp}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--accent-light)]">
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
                      <p className="font-semibold text-[var(--foreground)] line-clamp-1">{item.title}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">{item.author}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {item.format} &middot; Qty {item.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-[var(--foreground)]">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </motion.li>
                ))}
              </motion.ul>
              {/* Totals */}
              <div className="border-t border-[var(--border)] bg-[var(--background)] px-5 py-4 space-y-2">
                <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
                  <span>{t("orderConfirmation.subtotal")}</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
                  <span>{t("orderConfirmation.shipping")}</span>
                  <span>
                    {order.shippingCost === 0
                      ? t("orderConfirmation.free")
                      : formatPrice(order.shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
                  <span>{t("orderConfirmation.tax")}</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--border)] pt-2 font-bold text-[var(--foreground)]">
                  <span>{t("orderConfirmation.total")}</span>
                  <span className="text-[var(--accent)]">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {/* Shipping address */}
        {order.shipping.fullName && (
          <Reveal>
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="font-display text-lg font-bold text-[var(--foreground)]">
                  {t("orderConfirmation.shippingTo")}
                </h2>
              </div>
              <p className="font-semibold text-[var(--foreground)]">{order.shipping.fullName}</p>
              <p className="text-sm text-[var(--muted-foreground)]">{order.shipping.email}</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                {order.shipping.addressLine1}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {[order.shipping.city, order.shipping.state, order.shipping.postalCode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {order.shipping.country && (
                <p className="text-sm text-[var(--muted-foreground)]">{order.shipping.country}</p>
              )}
            </div>
          </Reveal>
        )}

        {/* CTA */}
        <Reveal>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/catalog"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white"
            >
              <ShoppingBag className="h-4 w-4" />
              {t("orderConfirmation.continueShopping")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
