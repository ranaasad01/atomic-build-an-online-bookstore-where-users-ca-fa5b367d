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
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  id?: string;
  orderNumber: string;
  items: CartItem[];
  shipping: ShippingInfo;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  placedAt: string;
}

// Shape returned by Supabase orders table
interface SupabaseOrderItem {
  id: string;
  book_id: string;
  title: string;
  author: string;
  price: number;
  quantity: number;
  format: string;
  cover_image: string;
}

interface SupabaseOrder {
  id: string;
  order_number: string;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total: number;
  shipping_name: string;
  shipping_email: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_method: string;
  created_at: string;
  order_items: SupabaseOrderItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function supabaseOrderToStored(row: SupabaseOrder): StoredOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    items: row.order_items.map((item) => ({
      bookId: item.book_id,
      title: item.title,
      author: item.author,
      price: item.price,
      coverImage: item.cover_image,
      quantity: item.quantity,
      format: item.format,
    })),
    shipping: {
      fullName: row.shipping_name,
      email: row.shipping_email,
      addressLine1: row.shipping_address,
      city: row.shipping_city,
      state: row.shipping_state,
      postalCode: row.shipping_postal_code,
      country: row.shipping_country,
      shippingMethod: row.shipping_method,
    },
    subtotal: row.subtotal,
    tax: row.tax,
    shippingCost: row.shipping_cost,
    total: row.total,
    placedAt: row.created_at,
  };
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderConfirmationPage() {
  const t = useTranslations();
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [mounted, setMounted] = useState(false);
  const [noOrder, setNoOrder] = useState(false);

  useEffect(() => {
    setMounted(true);

    async function loadOrder() {
      // 1) Read order_number from localStorage
      let orderNumber: string | null = null;
      try {
        orderNumber = localStorage.getItem("pageturner_last_order");
      } catch {
        // ignore
      }

      if (!orderNumber) {
        setNoOrder(true);
        return;
      }

      // 2) Query Supabase for the order
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("order_number", orderNumber)
          .single();

        if (error || !data) {
          setNoOrder(true);
          return;
        }

        // 3) Map through supabaseOrderToStored
        const resolved = supabaseOrderToStored(data as SupabaseOrder);
        setOrder(resolved);

        // 5) Clear the localStorage key after successfully loading
        try {
          localStorage.removeItem("pageturner_last_order");
        } catch {
          // ignore
        }
      } catch {
        setNoOrder(true);
      }
    }

    loadOrder();
  }, []);

  // ── Not yet mounted (SSR) ──────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading your order…</p>
        </div>
      </div>
    );
  }

  // ── 4) No order found state ────────────────────────────────────────────────
  if (noOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center max-w-md"
        >
          <motion.div variants={scaleIn} className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--accent-light)] mb-4">
              <ShoppingBag className="w-10 h-10 text-[var(--accent)]" aria-hidden="true" />
            </div>
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            className="font-display text-3xl font-bold text-[var(--foreground)] mb-3"
          >
            No order found
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="text-[var(--muted-foreground)] mb-8 leading-relaxed"
          >
            We couldn't find a recent order to display. Browse our catalog to find your next great read.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Browse Catalog
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── Loading spinner (order_number found but fetch in progress) ─────────────
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading your order…</p>
        </div>
      </div>
    );
  }

  const estimatedDelivery = generateEstimatedDelivery(order.shipping.shippingMethod);

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4">
      {/* Subtle background glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(200,169,110,0.12) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-3xl mx-auto">
        {/* ── Success header ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center mb-10"
        >
          <motion.div variants={scaleIn} className="mb-5">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 shadow-[0_4px_20px_rgba(34,197,94,0.15)]">
              <CheckCircle className="w-10 h-10 text-green-500" aria-hidden="true" />
            </div>
          </motion.div>

          <motion.p
            variants={fadeInUp}
            className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-2"
          >
            {t("orderConfirmation.eyebrow")}
          </motion.p>
          <motion.h1
            variants={fadeInUp}
            className="font-display text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-3 tracking-tight"
          >
            {t("orderConfirmation.heading")}
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="text-[var(--muted-foreground)] text-base leading-relaxed max-w-md mx-auto"
          >
            {t("orderConfirmation.subheading")}
          </motion.p>

          {/* Order number pill */}
          <motion.div variants={fadeInUp} className="mt-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-2 text-sm font-semibold text-[var(--foreground)] shadow-sm">
              <Package className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
              {t("orderConfirmation.orderNumber")}: {order.orderNumber}
            </span>
          </motion.div>
        </motion.div>

        {/* ── Info cards row ── */}
        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {/* Shipping to */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {t("orderConfirmation.shippingTo")}
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{order.shipping.fullName}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{order.shipping.addressLine1}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {order.shipping.city}, {order.shipping.state} {order.shipping.postalCode}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">{order.shipping.country}</p>
            </div>

            {/* Estimated delivery */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {t("orderConfirmation.estimatedDelivery")}
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)] leading-snug">{estimatedDelivery}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 capitalize">
                {order.shipping.shippingMethod} shipping
              </p>
            </div>

            {/* Confirmation sent to */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {t("orderConfirmation.confirmationSent")}
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)] break-all">{order.shipping.email}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {t("orderConfirmation.confirmationNote")}
              </p>
            </div>
          </div>
        </Reveal>

        {/* ── Order items ── */}
        <Reveal>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] mb-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-[var(--foreground)]">
                {t("orderConfirmation.itemsOrdered")} ({order.items.length})
              </h2>
            </div>

            <ul className="divide-y divide-[var(--border)]">
              {order.items.map((item, idx) => (
                <li key={`${item.bookId}-${item.format}-${idx}`} className="flex items-center gap-4 px-6 py-4">
                  {/* Cover */}
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--accent-light)] flex-shrink-0 shadow-sm">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">{item.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">{item.author}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {item.format} &middot; Qty {item.quantity}
                    </p>
                  </div>

                  {/* Price */}
                  <p className="text-sm font-bold text-[var(--foreground)] flex-shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--background)] space-y-2">
              <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
                <span>{t("cart.subtotal")}</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
                <span>{t("cart.shipping")}</span>
                <span>{order.shippingCost === 0 ? t("cart.freeShipping") : formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
                <span>{t("cart.tax")}</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[var(--foreground)] pt-2 border-t border-[var(--border)]">
                <span>{t("cart.total")}</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── CTA row ── */}
        <Reveal>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-[var(--primary)] shadow-sm transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {t("orderConfirmation.continueShopping")}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        {/* ── Delight nudge ── */}
        <Reveal>
          <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--accent-light)] p-6 text-center">
            <Star className="w-6 h-6 text-[var(--accent)] mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
              {t("orderConfirmation.enjoyReading")}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {t("orderConfirmation.reviewNudge")}
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
