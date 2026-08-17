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

export default function OrderConfirmationPage() {
  const t = useTranslations();
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    async function loadOrder() {
      let localOrder: StoredOrder | null = null;

      // Primary: read from localStorage (written by checkout page)
      try {
        const raw = localStorage.getItem("pageturner_last_order");
        if (raw) {
          localOrder = JSON.parse(raw) as StoredOrder;
        }
      } catch {
        // ignore parse errors
      }

      if (localOrder) {
        // If the order has a Supabase id, optionally verify/enrich from DB
        if (localOrder.id) {
          try {
            const supabase = createClient();
            const { data, error } = await supabase
              .from("orders")
              .select("*, order_items(*)")
              .eq("id", localOrder.id)
              .single<SupabaseOrder>();

            if (!error && data) {
              // Use Supabase data as the authoritative source when available
              setOrder(supabaseOrderToStored(data));
              return;
            }
          } catch {
            // Supabase fetch failed — fall through to localStorage data
          }
        }

        setOrder(localOrder);
        return;
      }

      // Fallback: empty placeholder
      setOrder(buildEmptyFallback());
    }

    loadOrder();
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
              className="mt-3 text-white/70"
            >
              {t("orderConfirmation.subheading")}
            </motion.p>
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white"
            >
              <Package className="h-4 w-4 text-[var(--accent)]" />
              {t("orderConfirmation.orderNumber")}: <span className="font-bold text-[var(--accent)]">{order.orderNumber}</span>
            </motion.div>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-12 space-y-8">
        {/* Delivery estimate */}
        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Calendar,
                label: t("orderConfirmation.estimatedDelivery"),
                value: estimatedDelivery,
              },
              {
                icon: Package,
                label: t("orderConfirmation.shippingMethod"),
                value: shippingLabel,
              },
              {
                icon: MapPin,
                label: t("orderConfirmation.deliverTo"),
                value: order.shipping.city
                  ? `${order.shipping.city}, ${order.shipping.state}`
                  : "—",
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)]">
                  <Icon className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Order items */}
        {order.items.length > 0 && (
          <Reveal>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="border-b border-[var(--border)] px-6 py-4">
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
                    className="flex items-center gap-4 px-6 py-4"
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
                      <p className="font-semibold text-sm text-[var(--foreground)] truncate">{item.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{item.author}</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        {item.format} &middot; Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--foreground)] shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </motion.li>
                ))}
              </motion.ul>

              {/* Totals */}
              <div className="border-t border-[var(--border)] px-6 py-4 space-y-2">
                <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
                  <span>{t("cart.subtotal")}</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
                  <span>{t("cart.shipping")}</span>
                  <span>
                    {order.shippingCost === 0
                      ? t("cart.freeShipping")
                      : formatPrice(order.shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
                  <span>{t("cart.tax")}</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[var(--foreground)] pt-2 border-t border-[var(--border)]">
                  <span>{t("cart.total")}</span>
                  <span className="text-[var(--accent)]">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {/* Shipping address */}
        {order.shipping.fullName && (
          <Reveal>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] p-6">
              <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-4">
                {t("orderConfirmation.shippingAddress")}
              </h2>
              <address className="not-italic text-sm text-[var(--muted-foreground)] space-y-1">
                <p className="font-semibold text-[var(--foreground)]">{order.shipping.fullName}</p>
                {order.shipping.email && <p>{order.shipping.email}</p>}
                <p>{order.shipping.addressLine1}</p>
                <p>
                  {order.shipping.city}
                  {order.shipping.state ? `, ${order.shipping.state}` : ""}
                  {order.shipping.postalCode ? ` ${order.shipping.postalCode}` : ""}
                </p>
                <p>{order.shipping.country}</p>
              </address>
            </div>
          </Reveal>
        )}

        {/* CTAs */}
        <Reveal>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/catalog"
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <ShoppingBag className="h-4 w-4" />
              {t("orderConfirmation.continueShopping")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {t("orderConfirmation.backHome")}
            </Link>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
