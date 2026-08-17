"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, BookOpen, Tag } from 'lucide-react';
import { useTranslations } from "next-intl";
import { CartItem, FREE_SHIPPING_THRESHOLD, TAX_RATE } from "@/lib/data";
type SHIPPING_RATES = any;
const SHIPPING_RATES: any = [];
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";

// ---------------------------------------------------------------------------
// Cart state helpers (localStorage-backed)
// ---------------------------------------------------------------------------

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pageturner_cart");
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem("pageturner_cart", JSON.stringify(items));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Sub-components (inline)
// ---------------------------------------------------------------------------

interface QuantityStepperProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

function QuantityStepper({ quantity, onIncrease, onDecrease }: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-1 py-0.5">
      <button
        onClick={onDecrease}
        aria-label="Decrease quantity"
        className="flex h-7 w-7 items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums text-[hsl(var(--foreground))]">
        {quantity}
      </span>
      <button
        onClick={onIncrease}
        aria-label="Increase quantity"
        className="flex h-7 w-7 items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface CartRowProps {
  item: CartItem;
  onIncrease: (bookId: string) => void;
  onDecrease: (bookId: string) => void;
  onRemove: (bookId: string) => void;
}

function CartRow({ item, onIncrease, onDecrease, onRemove }: CartRowProps) {
  const t = useTranslations();
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.25 } }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_20px_-6px_rgba(0,0,0,0.12)]"
    >
      {/* Cover */}
      <Link href={`/book/${item.bookId}`} className="shrink-0">
        <div className="relative h-28 w-20 overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] shadow-sm">
          <Image
            src={item.coverImage}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="80px"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "https://titoaistorageaccount.blob.core.windows.net/titoai-storage/site-images/c3daa240290f462eba06fde627c379ca.jpg";
            }}
          />
        </div>
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <Link
            href={`/book/${item.bookId}`}
            className="block truncate text-base font-semibold leading-snug text-[hsl(var(--foreground))] hover:text-[var(--accent)] transition-colors"
          >
            {item.title}
          </Link>
          <p className="mt-0.5 truncate text-sm text-[hsl(var(--muted-foreground))]">{item.author}</p>
          <p className="mt-1 text-sm font-medium text-[hsl(var(--foreground))]">
            ${item.price.toFixed(2)} {t("cart.eachLabel")}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <QuantityStepper
            quantity={item.quantity}
            onIncrease={() => onIncrease(item.bookId)}
            onDecrease={() => onDecrease(item.bookId)}
          />
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[hsl(var(--foreground))] tabular-nums">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
            <button
              onClick={() => onRemove(item.bookId)}
              aria-label={`Remove ${item.title} from cart`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.li>
  );
}

interface CartSummaryProps {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

function CartSummary({ subtotal, shipping, tax, total, itemCount }: CartSummaryProps) {
  const t = useTranslations();
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]">
      <h2 className="text-lg font-bold tracking-tight text-[hsl(var(--foreground))]">
        {t("cart.summaryTitle")}
      </h2>

      {/* Free shipping progress */}
      <div className="mt-4 rounded-xl bg-[hsl(var(--muted))] p-3">
        {freeShippingRemaining > 0 ? (
          <>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {t("cart.freeShippingProgress", { amount: freeShippingRemaining.toFixed(2) })}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--border))]">
              <motion.div
                className="h-full rounded-full bg-[var(--accent)]"
                initial={{ width: 0 }}
                animate={{ width: `${freeShippingProgress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </>
        ) : (
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <Tag className="h-3.5 w-3.5" />
            {t("cart.freeShippingUnlocked")}
          </p>
        )}
      </div>

      {/* Line items */}
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-[hsl(var(--muted-foreground))]">
            {t("cart.subtotalLabel", { count: itemCount })}
          </dt>
          <dd className="font-medium text-[hsl(var(--foreground))]">${subtotal.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[hsl(var(--muted-foreground))]">{t("cart.shippingLabel")}</dt>
          <dd className="font-medium text-[hsl(var(--foreground))]">
            {shipping === 0 ? (
              <span className="text-emerald-600">{t("cart.freeLabel")}</span>
            ) : (
              `$${shipping.toFixed(2)}`
            )}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[hsl(var(--muted-foreground))]">{t("cart.taxLabel")}</dt>
          <dd className="font-medium text-[hsl(var(--foreground))]">${tax.toFixed(2)}</dd>
        </div>
        <div className="my-1 border-t border-[hsl(var(--border))]" />
        <div className="flex justify-between text-base">
          <dt className="font-bold text-[hsl(var(--foreground))]">{t("cart.totalLabel")}</dt>
          <dd className="font-bold text-[hsl(var(--foreground))]">${total.toFixed(2)}</dd>
        </div>
      </dl>

      {/* CTA */}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-6">
        <Link
          href="/checkout"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-bold text-black shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        >
          {t("cart.checkoutCta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>

      <p className="mt-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
        {t("cart.secureNote")}
      </p>

      {/* Continue shopping */}
      <div className="mt-4 border-t border-[hsl(var(--border))] pt-4 text-center">
        <Link
          href="/catalog"
          className="text-xs font-medium text-[hsl(var(--muted-foreground))] underline-offset-2 hover:text-[hsl(var(--foreground))] hover:underline transition-colors"
        >
          {t("cart.continueShopping")}
        </Link>
      </div>
    </div>
  );
}

function EmptyState() {
  const t = useTranslations();
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[hsl(var(--muted))] shadow-inner">
        <ShoppingCart className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
        {t("cart.emptyTitle")}
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
        {t("cart.emptyDescription")}
      </p>
      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="mt-8">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-bold text-black shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        >
          <BookOpen className="h-4 w-4" />
          {t("cart.browseCatalogCta")}
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CartPage() {
  const t = useTranslations();
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setMounted(true);
  }, []);

  const persistAndSet = useCallback((next: CartItem[]) => {
    setItems(next);
    saveCart(next);
    // Dispatch a storage event so other tabs/components can react
    window.dispatchEvent(new Event("storage"));
  }, []);

  const handleIncrease = useCallback(
    (bookId: string) => {
      persistAndSet(
        items.map((it) =>
          it.bookId === bookId ? { ...it, quantity: it.quantity + 1 } : it
        )
      );
    },
    [items, persistAndSet]
  );

  const handleDecrease = useCallback(
    (bookId: string) => {
      const item = items.find((it) => it.bookId === bookId);
      if (!item) return;
      if (item.quantity <= 1) {
        persistAndSet(items.filter((it) => it.bookId !== bookId));
      } else {
        persistAndSet(
          items.map((it) =>
            it.bookId === bookId ? { ...it, quantity: it.quantity - 1 } : it
          )
        );
      }
    },
    [items, persistAndSet]
  );

  const handleRemove = useCallback(
    (bookId: string) => {
      persistAndSet(items.filter((it) => it.bookId !== bookId));
    },
    [items, persistAndSet]
  );

  const handleClearCart = useCallback(() => {
    persistAndSet([]);
  }, [persistAndSet]);

  // Derived totals
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? SHIPPING_RATES.free : SHIPPING_RATES.standard;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);

  // Avoid hydration mismatch — render nothing until mounted
  if (!mounted) {
    return (
      <main className="min-h-screen bg-[hsl(var(--background))]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-[hsl(var(--muted))]" />
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-[hsl(var(--muted))]" />
              ))}
            </div>
            <div className="h-80 animate-pulse rounded-2xl bg-[hsl(var(--muted))]" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[hsl(var(--background))]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Page header */}
        <Reveal>
          <div className="flex items-end justify-between gap-4 border-b border-[hsl(var(--border))] pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
                {t("cart.pageTitle")}
              </h1>
              {items.length > 0 && (
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  {t("cart.itemCountLabel", { count: itemCount })}
                </p>
              )}
            </div>
            {items.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-xs font-medium text-[hsl(var(--muted-foreground))] underline-offset-2 hover:text-red-500 hover:underline transition-colors"
              >
                {t("cart.clearCart")}
              </button>
            )}
          </div>
        </Reveal>

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Cart items list */}
            <Reveal>
              <motion.ul
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4"
                aria-label={t("cart.itemsListLabel")}
              >
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <CartRow
                      key={item.bookId}
                      item={item}
                      onIncrease={handleIncrease}
                      onDecrease={handleDecrease}
                      onRemove={handleRemove}
                    />
                  ))}
                </AnimatePresence>
              </motion.ul>

              {/* Promo / trust badges */}
              <div className="mt-6 flex flex-wrap gap-3">
                {(
                  Array.isArray(t.raw("cart.trustBadges"))
                    ? (t.raw("cart.trustBadges") as { label: string }[])
                    : []
                ).map((badge, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))]"
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            </Reveal>

            {/* Sticky summary */}
            <div className="lg:sticky lg:top-24">
              <Reveal delay={0.1}>
                <CartSummary
                  subtotal={subtotal}
                  shipping={shipping}
                  tax={tax}
                  total={total}
                  itemCount={itemCount}
                />
              </Reveal>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}