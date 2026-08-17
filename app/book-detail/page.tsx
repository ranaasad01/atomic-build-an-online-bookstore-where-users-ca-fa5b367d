"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Star, ShoppingCart, Heart, Share2, ChevronRight, BookOpen, Award, Truck, RotateCcw, Check, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/hooks/useCart";
import type { Book } from "@/lib/data";

// ─── Static reviews (no reviews table needed) ────────────────────────────────

const REVIEWS = [
  {
    id: "r1",
    name: "Sarah M.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah%20M.",
    rating: 5,
    date: "March 12, 2024",
    title: "A life-changing read",
    body: "This book arrived at exactly the right moment in my life. The writing is both profound and accessible, weaving philosophy into a story that genuinely moved me to tears. I finished it in two sittings and immediately bought copies for three friends.",
  },
  {
    id: "r2",
    name: "James T.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James%20T.",
    rating: 4,
    date: "February 28, 2024",
    title: "Beautifully written, thought-provoking",
    body: "The concept is brilliant and the execution is mostly excellent. Some sections feel slightly rushed toward the end, but the core message about regret and possibility is handled with real sensitivity. Highly recommended for anyone going through a difficult period.",
  },
  {
    id: "r3",
    name: "Priya K.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya%20K.",
    rating: 5,
    date: "January 15, 2024",
    title: "Couldn't put it down",
    body: "I read this in one sitting on a rainy Sunday afternoon. The premise sounds gimmicky but the execution is anything but. It's a genuinely moving meditation on regret, possibility, and what makes a life worth living.",
  },
];

// ─── Format options ───────────────────────────────────────────────────────────

const FORMATS = [
  { id: "hardcover", label: "Hardcover", priceModifier: 5 },
  { id: "paperback", label: "Paperback", priceModifier: 0 },
  { id: "ebook", label: "eBook", priceModifier: -4 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const starSize = size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            starSize,
            star <= Math.round(rating)
              ? "fill-[var(--accent)] text-[var(--accent)]"
              : "fill-transparent text-[var(--border)]"
          )}
        />
      ))}
    </div>
  );
}

function formatPrice(n: number) {
  return `$${n.toFixed(2)}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function BookDetailPageInner() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("id") ?? "the-midnight-library";

  const supabase = createClient();
  const { addItem } = useCart();

  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState(FORMATS[1].id);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const [bookResult, relatedResult] = await Promise.all([
          supabase.from("books").select("*").eq("id", bookId).single(),
          supabase.from("books").select("*").neq("id", bookId).limit(4),
        ]);

        if (cancelled) return;

        if (bookResult.error) {
          console.error("Error fetching book:", bookResult.error);
          setBook(null);
        } else {
          setBook(bookResult.data as Book);
        }

        if (!relatedResult.error && relatedResult.data) {
          setRelatedBooks(relatedResult.data as Book[]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Unexpected error fetching book data:", err);
          setBook(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const selectedFormatObj = FORMATS.find((f) => f.id === selectedFormat) ?? FORMATS[1];
  const displayPrice = book ? book.price + selectedFormatObj.priceModifier : 0;

  function handleAddToCart() {
    if (!book) return;
    addItem({
      bookId: book.id,
      title: book.title,
      author: book.author,
      price: displayPrice,
      coverImage: book.coverImage,
      quantity,
      format: selectedFormatObj.label,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading book details...</p>
        </div>
      </div>
    );
  }

  // ── Not found state ────────────────────────────────────────────────────────
  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="text-center max-w-sm">
          <BookOpen className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Book not found</h1>
          <p className="text-[var(--muted-foreground)] mb-6">
            We couldn't find the book you were looking for. It may have been removed or the link is incorrect.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent)] text-[var(--primary)] font-semibold text-sm hover:bg-[var(--accent-hover)] transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  const inStock = book.stockQuantity > 0;
  const lowStock = book.stockQuantity > 0 && book.stockQuantity <= 5;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Breadcrumb */}
      <div className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[var(--accent)] transition-colors duration-200">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/catalog" className="hover:text-[var(--accent)] transition-colors duration-200">
              Catalog
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[var(--foreground)] font-medium truncate max-w-[200px]">{book.title}</span>
          </nav>
        </div>
      </div>

      {/* Hero section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Cover image */}
          <Reveal className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Decorative glow */}
              <div
                className="absolute inset-0 rounded-2xl blur-3xl opacity-20 bg-[var(--accent)]"
                style={{ transform: "scale(0.85) translateY(8%)" }}
                aria-hidden="true"
              />
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                className="relative w-64 sm:w-72 md:w-80"
              >
                <img
                  src={book.coverImage}
                  alt={`Cover of ${book.title}`}
                  className="w-full rounded-2xl shadow-[0_8px_40px_rgba(26,26,46,0.2)] border border-[var(--border)]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop";
                  }}
                />
                {book.isBestseller && (
                  <div className="absolute -top-3 -right-3 flex items-center gap-1 bg-[var(--accent)] text-[var(--primary)] text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                    <Award className="w-3.5 h-3.5" />
                    Bestseller
                  </div>
                )}
              </motion.div>
            </div>
          </Reveal>

          {/* Book info */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {/* Genre badge */}
            <motion.div variants={fadeInUp}>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
                {book.genre}
              </span>
            </motion.div>

            {/* Title & author */}
            <motion.div variants={fadeInUp}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--foreground)] tracking-tight text-balance mb-2">
                {book.title}
              </h1>
              <p className="text-lg text-[var(--muted-foreground)]">
                by{" "}
                <span className="text-[var(--foreground)] font-medium">{book.author}</span>
              </p>
            </motion.div>

            {/* Rating */}
            <motion.div variants={fadeInUp} className="flex items-center gap-3">
              <StarRating rating={book.rating} size="md" />
              <span className="text-sm font-semibold text-[var(--foreground)]">{book.rating.toFixed(1)}</span>
              <span className="text-sm text-[var(--muted-foreground)]">· Verified readers</span>
            </motion.div>

            {/* Description */}
            <motion.p
              variants={fadeInUp}
              className="text-[var(--muted-foreground)] leading-relaxed text-pretty"
            >
              {book.description}
            </motion.p>

            {/* Book meta */}
            {(book.isbn || book.publisher || book.publishedAt || book.pages) && (
              <motion.div
                variants={fadeInUp}
                className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[var(--accent-light)] border border-[var(--border)]"
              >
                {book.isbn && (
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-0.5">ISBN</p>
                    <p className="text-sm font-medium text-[var(--foreground)]">{book.isbn}</p>
                  </div>
                )}
                {book.publisher && (
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-0.5">Publisher</p>
                    <p className="text-sm font-medium text-[var(--foreground)]">{book.publisher}</p>
                  </div>
                )}
                {book.publishedAt && (
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-0.5">Published</p>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {new Date(book.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {book.pages && (
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-0.5">Pages</p>
                    <p className="text-sm font-medium text-[var(--foreground)]">{book.pages}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Format selector */}
            <motion.div variants={fadeInUp}>
              <p className="text-sm font-semibold text-[var(--foreground)] mb-2">Format</p>
              <div className="flex gap-2 flex-wrap">
                {FORMATS.map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200",
                      selectedFormat === fmt.id
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--accent)]"
                    )}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Price & quantity */}
            <motion.div variants={fadeInUp} className="flex items-center gap-6">
              <div>
                <p className="text-3xl font-bold text-[var(--foreground)]">{formatPrice(displayPrice)}</p>
                {selectedFormatObj.priceModifier !== 0 && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Base price: {formatPrice(book.price)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-semibold text-[var(--foreground)] tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(book.stockQuantity, q + 1))}
                  disabled={quantity >= book.stockQuantity}
                  aria-label="Increase quantity"
                  className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* Stock status */}
            <motion.div variants={fadeInUp}>
              {inStock ? (
                <p className={cn("text-sm font-medium", lowStock ? "text-amber-600" : "text-emerald-600")}>
                  {lowStock ? `Only ${book.stockQuantity} left in stock` : "In stock — ships in 2 business days"}
                </p>
              ) : (
                <p className="text-sm font-medium text-red-500">Out of stock</p>
              )}
            </motion.div>

            {/* CTA buttons */}
            <motion.div variants={fadeInUp} className="flex gap-3 flex-wrap">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={cn(
                  "flex-1 min-w-[160px] flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200",
                  inStock
                    ? addedToCart
                      ? "bg-emerald-600 text-white"
                      : "bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent-hover)] shadow-[0_4px_16px_rgba(200,169,110,0.35)] hover:shadow-[0_6px_20px_rgba(200,169,110,0.45)]"
                    : "bg-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed"
                )}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-4 h-4" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </>
                )}
              </button>

              <button
                onClick={() => setWishlisted((w) => !w)}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className={cn(
                  "w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200",
                  wishlisted
                    ? "bg-red-50 border-red-200 text-red-500"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-red-200 hover:text-red-400"
                )}
              >
                <Heart className={cn("w-5 h-5", wishlisted && "fill-red-500")} />
              </button>

              <button
                aria-label="Share this book"
                className="w-12 h-12 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all duration-200"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: book.title, url: window.location.href }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href).catch(() => {});
                  }
                }}
              >
                <Share2 className="w-5 h-5" />
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-3 gap-3 pt-2 border-t border-[var(--border)]"
            >
              {[
                { icon: Truck, label: "Free shipping over $40" },
                { icon: RotateCcw, label: "30-day returns" },
                { icon: BookOpen, label: "Secure checkout" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-center">
                  <Icon className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-xs text-[var(--muted-foreground)] leading-tight">{label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Reviews section */}
      <section className="bg-[var(--card)] border-t border-[var(--border)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-8">Reader Reviews</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((review, i) => (
              <Reveal key={review.id} delay={i * 0.1}>
                <div className="bg-[var(--background)] rounded-2xl p-6 border border-[var(--border)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] h-full flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={review.avatar}
                      alt={review.name}
                      className="w-10 h-10 rounded-full border border-[var(--border)]"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{review.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{review.date}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)] mb-1">{review.title}</p>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{review.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Related books */}
      {relatedBooks.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">You Might Also Like</h2>
                <Link
                  href="/catalog"
                  className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors duration-200 flex items-center gap-1"
                >
                  View all
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6"
            >
              {relatedBooks.map((related) => (
                <motion.div key={related.id} variants={fadeInUp}>
                  <Link
                    href={`/book-detail?id=${related.id}`}
                    className="group block bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.16)] transition-all duration-300"
                  >
                    <div className="aspect-[2/3] overflow-hidden bg-[var(--accent-light)]">
                      <img
                        src={related.coverImage}
                        alt={`Cover of ${related.title}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop";
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-[var(--accent)] font-semibold uppercase tracking-wide mb-1">
                        {related.genre}
                      </p>
                      <h3 className="text-sm font-bold text-[var(--foreground)] leading-tight mb-1 line-clamp-2 group-hover:text-[var(--accent)] transition-colors duration-200">
                        {related.title}
                      </h3>
                      <p className="text-xs text-[var(--muted-foreground)] mb-2">{related.author}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[var(--foreground)]">
                          {formatPrice(related.price)}
                        </span>
                        <StarRating rating={related.rating} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Back to catalog */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <Reveal>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </Link>
        </Reveal>
      </div>
    </main>
  );
}

export default function BookDetailPage() {
  return (
    <Suspense fallback={null}>
      <BookDetailPageInner />
    </Suspense>
  );
}
