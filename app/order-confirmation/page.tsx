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
              className="mb-6 flex justify-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)]/20 ring-4 ring-[var(--accent)]/30">
                <CheckCircle className="h-10 w-10 text-[var(--accent)]" />
              </div>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="font-display text-3xl font-bold text-white md:text-4xl"
            >
              Order Confirmed!
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mt-3 text-white/70"
            >
              Thank you for your order. We&apos;ll send a confirmation to{" "}
              <span className="font-medium text-[var(--accent)]">
                {order.shipping.email}
              </span>
            </motion.p>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white"
            >
              <Package className="h-4 w-4 text-[var(--accent)]" />
              Order #{order.orderNumber}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-10 grid gap-6 lg:grid-cols-3"
        >
          {/* Left column: items + summary */}
          <div className="space-y-6 lg:col-span-2">
            {/* Items */}
            <Reveal>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
                <h2 className="mb-4 font-display text-lg font-semibold text-[var(--foreground)]">
                  Your Books
                </h2>
                <ul className="divide-y divide-[var(--border)]">
                  {order.items.map((item) => (
                    <li
                      key={`${item.bookId}-${item.format}`}
                      className="flex gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--accent-light)]">
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "/images/placeholder-book.jpg";
                          }}
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-center">
                        <p className="font-medium text-[var(--foreground)] leading-snug">
                          {item.title}
                        </p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {item.author}
                        </p>
                        {item.format && (
                          <p className="mt-0.5 text-xs capitalize text-[var(--muted-foreground)]">
                            {item.format}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end justify-center gap-1">
                        <p className="font-semibold text-[var(--foreground)]">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Order Summary */}
            <Reveal>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
                <h2 className="mb-4 font-display text-lg font-semibold text-[var(--foreground)]">
                  Order Summary
                </h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[var(--muted-foreground)]">Subtotal</dt>
                    <dd className="font-medium text-[var(--foreground)]">
                      {formatPrice(order.subtotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--muted-foreground)]">Shipping</dt>
                    <dd className="font-medium text-[var(--foreground)]">
                      {order.shippingCost === 0
                        ? "Free"
                        : formatPrice(order.shippingCost)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--muted-foreground)]">Tax</dt>
                    <dd className="font-medium text-[var(--foreground)]">
                      {formatPrice(order.tax)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-[var(--border)] pt-3">
                    <dt className="font-semibold text-[var(--foreground)]">Total</dt>
                    <dd className="font-bold text-[var(--foreground)] text-base">
                      {formatPrice(order.total)}
                    </dd>
                  </div>
                </dl>
              </div>
            </Reveal>
          </div>

          {/* Right column: shipping + delivery */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <Reveal>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[var(--accent)]" />
                  <h2 className="font-display text-base font-semibold text-[var(--foreground)]">
                    Shipping To
                  </h2>
                </div>
                <address className="not-italic text-sm text-[var(--muted-foreground)] leading-relaxed">
                  <p className="font-medium text-[var(--foreground)]">
                    {order.shipping.fullName}
                  </p>
                  <p>{order.shipping.addressLine1}</p>
                  <p>
                    {order.shipping.city}, {order.shipping.state}{" "}
                    {order.shipping.postalCode}
                  </p>
                  <p>{order.shipping.country}</p>
                </address>
                <div className="mt-3 rounded-lg bg-[var(--accent-light)] px-3 py-2 text-xs font-medium text-[var(--foreground)]">
                  {shippingLabel}
                </div>
              </div>
            </Reveal>

            {/* Estimated Delivery */}
            <Reveal>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
                <div className="mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--accent)]" />
                  <h2 className="font-display text-base font-semibold text-[var(--foreground)]">
                    Estimated Delivery
                  </h2>
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {estimatedDelivery}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  You&apos;ll receive a tracking email once your order ships.
                </p>
              </div>
            </Reveal>

            {/* CTA */}
            <Reveal>
              <div className="space-y-3">
                <Link
                  href="/catalog"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Continue Shopping
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition-all duration-200 hover:bg-[var(--accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  Back to Home
                </Link>
              </div>
            </Reveal>
          </div>
        </motion.div>

        {/* Reassurance strip */}
        <Reveal>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icon: <Package className="h-5 w-5 text-[var(--accent)]" />,
                title: "Carefully Packed",
                body: "Every order is wrapped to protect your books in transit.",
              },
              {
                icon: <Star className="h-5 w-5 text-[var(--accent)]" />,
                title: "Quality Guaranteed",
                body: "Not satisfied? Return within 30 days for a full refund.",
              },
              {
                icon: <CheckCircle className="h-5 w-5 text-[var(--accent)]" />,
                title: "Secure Payment",
                body: "Your payment details are encrypted end-to-end.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)] leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </main>
  );
}
