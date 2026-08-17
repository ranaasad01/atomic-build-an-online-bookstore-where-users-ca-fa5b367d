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

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookRow {
  id: string;
  title: string;
  author: string;
  description: string;
  genre: string;
  price: number;
  cover_image: string;
  isbn?: string;
  publisher?: string;
  published_at?: string;
  stock_quantity: number;
  is_featured: boolean;
  is_bestseller: boolean;
  rating: number;
  rating_count?: number;
  pages?: number;
}

interface RelatedBook {
  id: string;
  title: string;
  author: string;
  price: number;
  cover_image: string;
  rating: number;
  is_bestseller: boolean;
}

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

function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
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

// ─── Loading Spinner ──────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        <p className="text-sm text-[var(--muted-foreground)]">Loading book details…</p>
      </div>
    </div>
  );
}

// ─── Not Found ────────────────────────────────────────────────────────────────

function BookNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="text-center max-w-sm">
        <BookOpen className="w-12 h-12 text-[var(--accent)] mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-[var(--foreground)] mb-2">
          Book not found
        </h1>
        <p className="text-[var(--muted-foreground)] mb-6">
          We couldn't find the book you were looking for. It may have been removed or the link is incorrect.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--accent-hover)] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>
      </div>
    </div>
  );
}

// ─── Inner page (needs useSearchParams) ──────────────────────────────────────

function BookDetailPageInner() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("id") ?? "";

  const supabase = createClient();
  const { addItem } = useCart();

  const [book, setBook] = useState<BookRow | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<RelatedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState(FORMATS[1].id);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    if (!bookId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setNotFound(false);

      try {
        const { data: bookData, error: bookError } = await supabase
          .from("books")
          .select("*")
          .eq("id", bookId)
          .single();

        if (cancelled) return;

        if (bookError || !bookData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setBook(bookData as BookRow);

        // Fetch related books by same genre
        const { data: relatedData } = await supabase
          .from("books")
          .select("id, title, author, price, cover_image, rating, is_bestseller")
          .eq("genre", bookData.genre)
          .neq("id", bookData.id)
          .limit(4);

        if (!cancelled) {
          setRelatedBooks((relatedData as RelatedBook[]) ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch book:", err);
          setNotFound(true);
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

  const handleAddToCart = () => {
    if (!book) return;
    const format = FORMATS.find((f) => f.id === selectedFormat) ?? FORMATS[1];
    const finalPrice = book.price + format.priceModifier;
    addItem({
      bookId: book.id,
      title: book.title,
      author: book.author,
      price: finalPrice,
      coverImage: book.cover_image,
      quantity,
      format: format.label,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) return <LoadingSpinner />;
  if (notFound || !book) return <BookNotFound />;

  const selectedFormatObj = FORMATS.find((f) => f.id === selectedFormat) ?? FORMATS[1];
  const finalPrice = book.price + selectedFormatObj.priceModifier;
  const inStock = book.stock_quantity > 0;
  const lowStock = book.stock_quantity > 0 && book.stock_quantity <= 5;

  const avgRating =
    REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Breadcrumb */}
      <Reveal>
        <div className="border-b border-[var(--border)] bg-[var(--card)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-[var(--accent)] transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/catalog" className="hover:text-[var(--accent)] transition-colors">
                Catalog
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[var(--foreground)] font-medium line-clamp-1">
                {book.title}
              </span>
            </nav>
          </div>
        </div>
      </Reveal>

      {/* Main content */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16">
          {/* Left — Cover */}
          <Reveal>
            <div className="flex flex-col items-center lg:items-start gap-6">
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                className="relative w-full max-w-sm mx-auto lg:mx-0"
              >
                {book.is_bestseller && (
                  <div className="absolute -top-3 -left-3 z-10">
                    <span className="flex items-center gap-1 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--primary)] shadow-md">
                      <Award className="w-3 h-3" />
                      Bestseller
                    </span>
                  </div>
                )}
                <div className="aspect-[2/3] w-full overflow-hidden rounded-2xl border border-[var(--border)] shadow-[0_8px_40px_rgba(26,26,46,0.16)] bg-[var(--accent-light)]">
                  <img
                    src={book.cover_image}
                    alt={book.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "/images/book-placeholder.jpg";
                    }}
                  />
                </div>
              </motion.div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm mx-auto lg:mx-0">
                {[
                  { icon: Truck, label: "Free shipping over $40" },
                  { icon: RotateCcw, label: "30-day returns" },
                  { icon: BookOpen, label: "Quality guaranteed" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-center"
                  >
                    <Icon className="w-4 h-4 text-[var(--accent)]" />
                    <span className="text-[10px] leading-tight text-[var(--muted-foreground)]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Right — Details */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {/* Genre + title */}
            <motion.div variants={fadeInUp}>
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                {book.genre}
              </span>
              <h1 className="mt-1 font-display text-3xl md:text-4xl font-bold leading-tight text-[var(--foreground)] text-balance">
                {book.title}
              </h1>
              <p className="mt-2 text-lg text-[var(--muted-foreground)]">
                by{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {book.author}
                </span>
              </p>
            </motion.div>

            {/* Rating */}
            <motion.div variants={fadeInUp} className="flex items-center gap-3">
              <StarRating rating={book.rating} size="md" />
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {book.rating.toFixed(1)}
              </span>
              {book.rating_count !== undefined && (
                <span className="text-sm text-[var(--muted-foreground)]">
                  ({book.rating_count.toLocaleString("en-US")} reviews)
                </span>
              )}
            </motion.div>

            {/* Price */}
            <motion.div variants={fadeInUp}>
              <span className="font-display text-3xl font-bold text-[var(--foreground)]">
                {formatPrice(finalPrice)}
              </span>
            </motion.div>

            {/* Format selector */}
            <motion.div variants={fadeInUp} className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {t("bookDetail.format")}
              </span>
              <div className="flex gap-2">
                {FORMATS.map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200",
                      selectedFormat === fmt.id
                        ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--foreground)] shadow-sm"
                        : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {fmt.label}
                    {fmt.priceModifier !== 0 && (
                      <span className="ml-1 text-xs opacity-70">
                        {fmt.priceModifier > 0
                          ? `+$${fmt.priceModifier}`
                          : `-$${Math.abs(fmt.priceModifier)}`}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Quantity + stock */}
            <motion.div variants={fadeInUp} className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {t("bookDetail.quantity")}
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-1 py-0.5">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-light)] hover:text-[var(--foreground)]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(q + 1, book.stock_quantity)
                      )
                    }
                    aria-label="Increase quantity"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-light)] hover:text-[var(--foreground)]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    inStock ? "text-green-600" : "text-red-500"
                  )}
                >
                  {!inStock
                    ? t("bookDetail.outOfStock")
                    : lowStock
                    ? t("bookDetail.lowStock", { count: book.stock_quantity })
                    : t("bookDetail.inStock")}
                </span>
              </div>
            </motion.div>

            {/* CTA buttons */}
            <motion.div variants={fadeInUp} className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || addedToCart}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200",
                  !inStock
                    ? "bg-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed"
                    : addedToCart
                    ? "bg-green-600 text-white"
                    : "bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent-hover)] hover:text-white shadow-[0_2px_12px_rgba(200,169,110,0.3)]"
                )}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t("bookDetail.added")}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    {t("bookDetail.addToCart")}
                  </>
                )}
              </button>

              <button
                onClick={() => setWishlisted((w) => !w)}
                aria-label={t("bookDetail.wishlist")}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-200",
                  wishlisted
                    ? "border-red-300 bg-red-50 text-red-500"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-red-300 hover:text-red-400"
                )}
              >
                <Heart
                  className={cn(
                    "w-5 h-5",
                    wishlisted && "fill-red-500"
                  )}
                />
              </button>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator
                      .share({ title: book.title, url: window.location.href })
                      .catch(() => {});
                  } else {
                    navigator.clipboard
                      .writeText(window.location.href)
                      .catch(() => {});
                  }
                }}
                aria-label={t("bookDetail.share")}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </motion.div>

            {/* Description */}
            <motion.div variants={fadeInUp} className="border-t border-[var(--border)] pt-6">
              <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-3">
                About this book
              </h2>
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                {book.description}
              </p>
            </motion.div>

            {/* Metadata */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              {[
                { label: t("bookDetail.isbn"), value: book.isbn },
                { label: t("bookDetail.publisher"), value: book.publisher },
                {
                  label: t("bookDetail.published"),
                  value: book.published_at
                    ? new Date(book.published_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : undefined,
                },
                {
                  label: t("bookDetail.pages"),
                  value: book.pages ? String(book.pages) : undefined,
                },
              ]
                .filter((m) => m.value)
                .map((m) => (
                  <div key={m.label}>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      {m.label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium text-[var(--foreground)]">
                      {m.value}
                    </dd>
                  </div>
                ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Reviews */}
      <Reveal>
        <section className="border-t border-[var(--border)] bg-[var(--card)] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-[var(--foreground)]">
                {t("bookDetail.reviews")}
              </h2>
              <div className="flex items-center gap-2">
                <StarRating rating={avgRating} size="md" />
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-sm text-[var(--muted-foreground)]">
                  ({REVIEWS.length} reviews)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {REVIEWS.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={review.avatar}
                      alt={review.name}
                      className="w-9 h-9 rounded-full border border-[var(--border)]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {review.name}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {review.date}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                  <h3 className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                    {review.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {review.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Related books */}
      {relatedBooks.length > 0 && (
        <Reveal>
          <section className="py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="font-display text-2xl font-bold text-[var(--foreground)] mb-8">
                {t("bookDetail.relatedBooks")}
              </h2>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              >
                {relatedBooks.map((rb) => (
                  <motion.article
                    key={rb.id}
                    variants={fadeInUp}
                    className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.14)]"
                  >
                    <Link href={`/book-detail?id=${rb.id}`} className="block relative aspect-[2/3] overflow-hidden bg-[var(--accent-light)]">
                      {rb.is_bestseller && (
                        <span className="absolute top-2 left-2 z-10 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--primary)]">
                          Bestseller
                        </span>
                      )}
                      <img
                        src={rb.cover_image}
                        alt={rb.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "/images/book-placeholder.jpg";
                        }}
                      />
                    </Link>
                    <div className="p-3">
                      <Link href={`/book-detail?id=${rb.id}`}>
                        <h3 className="font-display text-sm font-bold leading-snug text-[var(--foreground)] line-clamp-2 hover:text-[var(--accent)] transition-colors">
                          {rb.title}
                        </h3>
                      </Link>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {rb.author}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <StarRating rating={rb.rating} />
                        <span className="text-sm font-bold text-[var(--foreground)]">
                          {formatPrice(rb.price)}
                        </span>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            </div>
          </section>
        </Reveal>
      )}
    </main>
  );
}

// ─── Page export (wrapped in Suspense for useSearchParams) ───────────────────

export default function BookDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <BookDetailPageInner />
    </Suspense>
  );
}
