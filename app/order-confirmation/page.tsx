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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderConfirmationPage() {
  const t = useTranslations();
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    async function loadOrder() {
      // 1) Try sessionStorage first
      let resolved: StoredOrder | null = null;

      try {
        const raw = sessionStorage.getItem("pageturner_last_order");
        if (raw) {
          resolved = JSON.parse(raw) as StoredOrder;
          sessionStorage.removeItem("pageturner_last_order");
        }
      } catch {
        // ignore parse errors
      }

      if (resolved) {
        setOrder(resolved);
        return;
      }

      // 2) Fall back to Supabase — fetch most recent order for current user
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (!userError && user) {
          const { data, error } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (!error && data) {
            resolved = supabaseOrderToStored(data as SupabaseOrder);
            setOrder(resolved);
            return;
          }
        }
      } catch {
        // ignore Supabase errors — fall through to empty fallback
      }

      // 3) Both sources failed — show empty fallback
      setOrder(buildEmptyFallback());
    }

    loadOrder();
  }, []);

  if (!mounted || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading your order...</p>
        </div>
      </div>
    );
  }

  const estimatedDelivery = generateEstimatedDelivery(order.shipping.shippingMethod);

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success header */}
        <Reveal>
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-2">
              Order Confirmed!
            </h1>
            <p className="text-[var(--muted-foreground)] text-base">
              Thank you{order.shipping.fullName ? `, ${order.shipping.fullName.split(" ")[0]}` : ""}. Your order has been placed successfully.
            </p>
          </motion.div>
        </Reveal>

        {/* Order number + estimated delivery */}
        <Reveal delay={0.05}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Order Number</span>
              </div>
              <p className="font-display text-xl font-bold text-[var(--foreground)]">{order.orderNumber}</p>
              {order.shipping.email && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Confirmation sent to {order.shipping.email}</p>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Estimated Delivery</span>
              </div>
              <p className="font-display text-base font-bold text-[var(--foreground)] leading-snug">{estimatedDelivery}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 capitalize">{order.shipping.shippingMethod} shipping</p>
            </div>
          </div>
        </Reveal>

        {/* Items list */}
        {order.items.length > 0 && (
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 mb-5">
                <ShoppingBag className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Your Books</h2>
              </div>
              <motion.ul
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {order.items.map((item, idx) => (
                  <motion.li
                    key={`${item.bookId}-${item.format}-${idx}`}
                    variants={fadeInUp}
                    className="flex gap-4 items-start"
                  >
                    <div className="relative w-14 h-20 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--accent-light)] flex-shrink-0 shadow-sm">
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/images/book-placeholder.jpg";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[var(--foreground)] leading-snug line-clamp-2">{item.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{item.author}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs rounded-full bg-[var(--accent-light)] text-[var(--foreground)] px-2 py-0.5 font-medium">{item.format}</span>
                        <span className="text-xs text-[var(--muted-foreground)]">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-[var(--foreground)] flex-shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </Reveal>
        )}

        {/* Shipping address */}
        {order.shipping.fullName && (
          <Reveal delay={0.15}>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Shipping Address</h2>
              </div>
              <address className="not-italic text-sm text-[var(--muted-foreground)] leading-relaxed">
                <p className="font-semibold text-[var(--foreground)]">{order.shipping.fullName}</p>
                {order.shipping.addressLine1 && <p>{order.shipping.addressLine1}</p>}
                {(order.shipping.city || order.shipping.state || order.shipping.postalCode) && (
                  <p>
                    {[order.shipping.city, order.shipping.state, order.shipping.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {order.shipping.country && <p>{order.shipping.country}</p>}
              </address>
            </div>
          </Reveal>
        )}

        {/* Order totals */}
        <Reveal delay={0.2}>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]">
            <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Subtotal</span>
                <span className="text-[var(--foreground)] font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Shipping</span>
                <span className="text-[var(--foreground)] font-medium">
                  {order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Tax</span>
                <span className="text-[var(--foreground)] font-medium">{formatPrice(order.tax)}</span>
              </div>
              <div className="h-px bg-[var(--border)] my-2" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-[var(--foreground)]">Total</span>
                <span className="text-[var(--accent)]">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal delay={0.25}>
          <div className="text-center">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-3.5 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white shadow-[0_2px_12px_rgba(200,169,110,0.35)] hover:shadow-[0_4px_20px_rgba(200,169,110,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="mt-4 text-xs text-[var(--muted-foreground)]">
              Questions? Email us at{" "}
              <a
                href="mailto:hello@pageturner.store"
                className="text-[var(--accent)] hover:underline"
              >
                hello@pageturner.store
              </a>
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
