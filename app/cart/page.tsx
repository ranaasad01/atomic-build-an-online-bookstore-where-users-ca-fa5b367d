"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, BookOpen, Tag } from 'lucide-react';
import { useTranslations } from "next-intl";
import { CartItem, FREE_SHIPPING_THRESHOLD, TAX_RATE } from "@/lib/data";
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
    <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-1 py-0.5">
      <button
        onClick={onDecrease}
        aria-label="Decrease quantity"
        className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-light)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums text-[var(--foreground)]">
        {quantity}
      </span>
      <button
        onClick={onIncrease}
        aria-label="Increase quantity"
        className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-light)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
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
      className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_20px_-6px_rgba(0,0,0,0.12)]"
    >
      {/* Cover */}
      <Link href={`/book/${item.bookId}`} className="shrink-0">
        <div className="relative h-28 w-20 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--accent-light)] shadow-sm">
          <Image
            src={item.coverImage}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="80px"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/book/${item.bookId}`}
              className="block truncate font-display text-base font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors duration-200"
            >
              {item.title}
            </Link>
            <p className="text-sm text-[var(--muted-foreground)] truncate">{item.author}</p>
            {item.format && (
              <span className="mt-1 inline-block rounded-full bg-[var(--accent-light)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
                {item.format}
              </span>
            )}
          </div>
          <button
            onClick={() => onRemove(item.bookId)}
            aria-label={`Remove ${item.title} from cart`}
            className="shrink-0 rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 mt-auto">
          <QuantityStepper
            quantity={item.quantity}
            onIncrease={() => onIncrease(item.bookId)}
            onDecrease={() => onDecrease(item.bookId)}
          />
          <span className="font-semibold text-[var(--foreground)] tabular-nums">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>
    </motion.li>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CartPage() {
  const t = useTranslations();
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");

  useEffect(() => {
    setItems(loadCart());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveCart(items);
  }, [items, mounted]);

  const handleIncrease = useCallback((bookId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.bookId === bookId ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  }, []);

  const handleDecrease = useCallback((bookId: string) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.bookId === bookId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const handleRemove = useCallback((bookId: string) => {
    setItems((prev) => prev.filter((i) => i.bookId !== bookId));
  }, []);

  const handleClearCart = useCallback(() => {
    setItems([]);
  }, []);

  const handleApplyPromo = useCallback(() => {
    if (promoCode.trim().toUpperCase() === "READER10") {
      setPromoApplied(true);
      setPromoError("");
    } else {
      setPromoApplied(false);
      setPromoError("Invalid promo code. Try READER10.");
    }
  }, [promoCode]);

  // Totals
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const discountedSubtotal = subtotal - discount;
  const shipping = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 4.99;
  const tax = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + shipping + tax;
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - discountedSubtotal);
  const freeShippingProgress = Math.min(100, (discountedSubtotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] pb-24">
      {/* Header */}
      <Reveal>
        <section className="bg-[var(--primary)] py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="h-6 w-6 text-[var(--accent)]" />
              <h1 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
                {t("cart.heading")}
              </h1>
            </div>
            <p className="text-white/60 text-sm">
              {items.length === 0
                ? t("cart.emptySubtitle")
                : `${items.reduce((s, i) => s + i.quantity, 0)} item${items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""} in your cart`}
            </p>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
        {items.length === 0 ? (
          /* Empty state */
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--accent-light)]">
              <BookOpen className="h-10 w-10 text-[var(--accent)]" />
            </div>
            <h2 className="font-display text-2xl font-bold text-[var(--foreground)] mb-2">
              {t("cart.emptyTitle")}
            </h2>
            <p className="text-[var(--muted-foreground)] mb-8 max-w-sm">
              {t("cart.emptySubtitle")}
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[0_4px_16px_rgba(200,169,110,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {t("cart.browseCatalog")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Free shipping progress */}
              {freeShippingRemaining > 0 && (
                <Reveal>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-[var(--accent)]" />
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        Add{" "}
                        <span className="text-[var(--accent)] font-semibold">
                          ${freeShippingRemaining.toFixed(2)}
                        </span>{" "}
                        more for free shipping
                      </p>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--accent-light)] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-[var(--accent)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${freeShippingProgress}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Items list */}
              <motion.ul
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
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

              {/* Clear cart */}
              <div className="flex justify-end">
                <button
                  onClick={handleClearCart}
                  className="text-xs text-[var(--muted-foreground)] hover:text-red-500 transition-colors duration-200 underline underline-offset-2"
                >
                  Clear cart
                </button>
              </div>
            </div>

            {/* Order summary */}
            <Reveal className="lg:sticky lg:top-24">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]">
                <h2 className="font-display text-xl font-bold text-[var(--foreground)] mb-5">
                  {t("cart.orderSummary")}
                </h2>

                {/* Promo code */}
                <div className="mb-5">
                  <label htmlFor="promo" className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
                    Promo code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="promo"
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="e.g. READER10"
                      className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition-all duration-200"
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="rounded-xl bg-[var(--accent-light)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--primary)] transition-all duration-200"
                    >
                      Apply
                    </button>
                  </div>
                  {promoApplied && (
                    <p className="mt-1.5 text-xs text-green-600 font-medium">10% discount applied!</p>
                  )}
                  {promoError && (
                    <p className="mt-1.5 text-xs text-red-500">{promoError}</p>
                  )}
                </div>

                {/* Line items */}
                <div className="space-y-3 text-sm border-t border-[var(--border)] pt-4">
                  <div className="flex justify-between text-[var(--muted-foreground)]">
                    <span>Subtotal</span>
                    <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount (10%)</span>
                      <span className="tabular-nums">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[var(--muted-foreground)]">
                    <span>Shipping</span>
                    <span className="tabular-nums">
                      {shipping === 0 ? (
                        <span className="text-green-600 font-medium">Free</span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-[var(--muted-foreground)]">
                    <span>Tax (8%)</span>
                    <span className="tabular-nums">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-[var(--foreground)] border-t border-[var(--border)] pt-3">
                    <span>Total</span>
                    <span className="tabular-nums">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <Link
                  href="/checkout"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-[0_4px_16px_rgba(200,169,110,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  {t("cart.checkout")}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/catalog"
                  className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200"
                >
                  {t("cart.continueShopping")}
                </Link>
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </main>
  );
}
