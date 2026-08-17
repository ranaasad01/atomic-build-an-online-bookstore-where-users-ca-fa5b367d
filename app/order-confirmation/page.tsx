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

type ShippingAddress = any;

interface StoredOrder {
  orderNumber: string;
  items: CartItem[];
  shipping: ShippingAddress;
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

const FALLBACK_ORDER: StoredOrder = {
  orderNumber: "PT-000000",
  items: [
    {
      bookId: "1",
      title: "The Midnight Library",
      author: "Matt Haig",
      price: 16.99,
      coverImage: "/images/midnight-library-book-cover.jpg",
      quantity: 1,
      format: "paperback",
    },
    {
      bookId: "2",
      title: "Atomic Habits",
      author: "James Clear",
      price: 18.99,
      coverImage: "/images/atomic-habits-book-cover.jpg",
      quantity: 2,
      format: "paperback",
    },
  ],
  shipping: {
    fullName: "Jane Reader",
    email: "jane@example.com",
    addressLine1: "123 Bookshelf Lane",
    city: "Portland",
    state: "OR",
    postalCode: "97201",
    country: "United States",
    shippingMethod: "standard",
  },
  subtotal: 54.97,
  tax: 4.4,
  shippingCost: 0,
  total: 59.37,
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
        setOrder(FALLBACK_ORDER);
      }
    } catch {
      setOrder(FALLBACK_ORDER);
    }
  }, []);

  if (!mounted || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--brand-accent)] border-t-transparent animate-spin" />
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
    <main className="min-h-screen bg-[hsl(var(--background))] pb-24">
      {/* Success Banner */}
      <Reveal>
        <section className="relative overflow-hidden bg-[var(--brand-accent)] py-16 md:py-20">
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
              className="mb-6 flex justify-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-4 ring-white/30">
                <CheckCircle className="h-10 w-10 text-white" aria-hidden="true" />
              </div>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl"
            >
              {t("orderConfirmation.banner.heading")}
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="mt-3 text-lg text-white/80"
            >
              {t("orderConfirmation.banner.subheading")}
            </motion.p>
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-sm font-semibold text-white backdrop-blur-sm ring-1 ring-white/30"
            >
              <span>{t("orderConfirmation.banner.orderLabel")}</span>
              <span className="font-mono tracking-wider">{order.orderNumber}</span>
            </motion.div>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto max-w-5xl px-6 pt-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Main Details */}
          <div className="space-y-8 lg:col-span-2">
            {/* Items */}
            <Reveal>
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] px-6 py-4">
                  <ShoppingBag className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
                  <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
                    {t("orderConfirmation.items.heading")}
                  </h2>
                  <span className="ml-auto rounded-full bg-[hsl(var(--muted))] px-2.5 py-0.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    {order.items.reduce((s, i) => s + i.quantity, 0)}{" "}
                    {t("orderConfirmation.items.itemsLabel")}
                  </span>
                </div>
                <motion.ul
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-[hsl(var(--border))]"
                >
                  {order.items.map((item, idx) => (
                    <motion.li
                      key={`${item.bookId}-${idx}`}
                      variants={fadeInUp}
                      className="flex gap-4 px-6 py-5"
                    >
                      <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg shadow-sm ring-1 ring-black/5">
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://titoaistorageaccount.blob.core.windows.net/titoai-storage/site-images/c3daa240290f462eba06fde627c379ca.jpg";
                          }}
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-center gap-1">
                        <p className="font-semibold leading-snug text-[hsl(var(--foreground))]">
                          {item.title}
                        </p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          {item.author}
                        </p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          Qty: {item.quantity} &times; {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center font-semibold text-[hsl(var(--foreground))]">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
            </Reveal>

            {/* Shipping Address */}
            <Reveal>
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] px-6 py-4">
                  <MapPin className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
                  <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
                    {t("orderConfirmation.shipping.heading")}
                  </h2>
                </div>
                <div className="px-6 py-5 space-y-1 text-sm text-[hsl(var(--foreground))]">
                  <p className="font-semibold">{order.shipping.fullName}</p>
                  <p>{order.shipping.addressLine1}</p>
                  {order.shipping.addressLine2 && <p>{order.shipping.addressLine2}</p>}
                  <p>{order.shipping.city}, {order.shipping.state} {order.shipping.postalCode}</p>
                  <p>{order.shipping.country}</p>
                  <p className="pt-2 text-[hsl(var(--muted-foreground))]">{order.shipping.email}</p>
                  <p className="pt-1 text-[hsl(var(--muted-foreground))]">{shippingLabel}</p>
                </div>
              </div>
            </Reveal>

            {/* Estimated Delivery */}
            <Reveal>
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] px-6 py-4">
                  <Calendar className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
                  <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
                    {t("orderConfirmation.delivery.heading")}
                  </h2>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm text-[hsl(var(--foreground))]">
                    {t("orderConfirmation.delivery.estimatedLabel")}:{" "}
                    <span className="font-semibold">{estimatedDelivery}</span>
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right: Order Summary */}
          <div className="space-y-6">
            <Reveal>
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] px-6 py-4">
                  <Package className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
                  <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
                    {t("orderConfirmation.summary.heading")}
                  </h2>
                </div>
                <div className="px-6 py-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">{t("orderConfirmation.summary.subtotal")}</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">{t("orderConfirmation.summary.tax")}</span>
                    <span>{formatPrice(order.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">{t("orderConfirmation.summary.shipping")}</span>
                    <span>{order.shippingCost === 0 ? t("orderConfirmation.summary.free") : formatPrice(order.shippingCost)}</span>
                  </div>
                  <div className="border-t border-[hsl(var(--border))] pt-3 flex justify-between font-semibold text-base">
                    <span>{t("orderConfirmation.summary.total")}</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <Link
                href="/catalog"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-[var(--brand-accent)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
              >
                {t("orderConfirmation.cta.continueShopping")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </main>
  );
}
