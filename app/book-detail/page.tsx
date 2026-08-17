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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center max-w-md px-6">
        <BookOpen className="w-16 h-16 text-[var(--border)] mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-[var(--foreground)] mb-2">
          Book not found
        </h1>
        <p className="text-[var(--muted-foreground)] mb-6">
          We couldn't find the book you're looking for. It may have been removed or the link is incorrect.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--accent-hover)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>
      </div>
    </div>
  );
}

// ─── Related Book Card ────────────────────────────────────────────────────────

function RelatedBookCard({ book }: { book: RelatedBook }) {
  return (
    <motion.article
      variants={fadeInUp}
      className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.14)]"
    >
      <Link
        href={`/book-detail?id=${book.id}`}
        className="relative block aspect-[2/3] overflow-hidden bg-[var(--accent-light)]"
      >
        <img
          src={book.cover_image}
          alt={book.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/images/book-placeholder.jpg";
          }}
        />
        {book.is_bestseller && (
          <span className="absolute top-2 left-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">
            Bestseller
          </span>
        )}
      </Link>
      <div className="flex flex-col gap-1 p-3">
        <Link href={`/book-detail?id=${book.id}`}>
          <h3 className="font-display text-sm font-bold leading-snug text-[var(--foreground)] line-clamp-2 hover:text-[var(--accent)] transition-colors duration-200">
            {book.title}
          </h3>
        </Link>
        <p className="text-xs text-[var(--muted-foreground)]">{book.author}</p>
        <div className="flex items-center justify-between mt-1">
          <StarRating rating={book.rating} />
          <span className="text-sm font-semibold text-[var(--foreground)]">
            {formatPrice(book.price)}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Inner page (needs useSearchParams) ──────────────────────────────────────

function BookDetailInner() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("id");
  const { addItem } = useCart();

  const [book, setBook] = useState<BookRow | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<RelatedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedFormat, setSelectedFormat] = useState(FORMATS[1]); // Paperback default
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);

  // ── Fetch book from Supabase ──────────────────────────────────────────────
  useEffect(() => {
    if (!bookId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchBook() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", bookId)
          .single();

        if (cancelled) return;

        if (error || !data) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setBook(data as BookRow);

        // Fetch related books by same genre
        const { data: related } = await supabase
          .from("books")
          .select("id, title, author, price, cover_image, rating, is_bestseller")
          .eq("genre", (data as BookRow).genre)
          .neq("id", (data as BookRow).id)
          .limit(4);

        if (!cancelled) {
          setRelatedBooks((related as RelatedBook[]) ?? []);
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

    fetchBook();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleAddToCart() {
    if (!book) return;
    addItem({
      bookId: book.id,
      title: book.title,
      author: book.author,
      price: book.price + selectedFormat.priceModifier,
      coverImage: book.cover_image,
      quantity,
      format: selectedFormat.label,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard
        .writeText(window.location.href)
        .catch(() => {});
    }
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  // ── Render states ─────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner />;
  if (notFound || !book) return <BookNotFound />;

  const finalPrice = book.price + selectedFormat.priceModifier;
  const outOfStock = book.stock_quantity === 0;
  const publishYear = book.published_at
    ? new Date(book.published_at).getFullYear()
    : null;

  return (
    <main className="min-h-screen bg-[var(--background)] pb-24">
      {/* Breadcrumb */}
      <div className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/catalog" className="hover:text-[var(--accent)] transition-colors">Catalog</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[var(--foreground)] font-medium line-clamp-1">{book.title}</span>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
          {/* Left — Cover */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center lg:items-start gap-6"
          >
            <div className="relative w-full max-w-sm mx-auto lg:mx-0">
              <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(26,26,46,0.18)] ring-1 ring-black/5">
                <img
                  src={book.cover_image}
                  alt={book.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/images/book-placeholder.jpg";
                  }}
                />
              </div>
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {book.is_bestseller && (
                  <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--primary)] shadow-sm">
                    Bestseller
                  </span>
                )}
                {book.is_featured && !book.is_bestseller && (
                  <span className="rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                    Featured
                  </span>
                )}
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-sm mx-auto lg:mx-0">
              {[
                { icon: Truck, label: "Free shipping over $40" },
                { icon: RotateCcw, label: "30-day returns" },
                { icon: Award, label: "Quality guaranteed" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-center"
                >
                  <Icon className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-[10px] leading-tight text-[var(--muted-foreground)]">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — Details */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {/* Genre tag */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                {book.genre}
              </span>
            </div>

            {/* Title & Author */}
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-[var(--foreground)] text-balance">
                {book.title}
              </h1>
              <p className="mt-2 text-lg text-[var(--muted-foreground)]">
                by <span className="font-medium text-[var(--foreground)]">{book.author}</span>
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <StarRating rating={book.rating} size="md" />
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {book.rating.toFixed(1)}
              </span>
              {book.rating_count !== undefined && (
                <span className="text-sm text-[var(--muted-foreground)]">
                  ({book.rating_count.toLocaleString("en-US")} reviews)
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-[var(--foreground)]">
                {formatPrice(finalPrice)}
              </span>
              {selectedFormat.priceModifier !== 0 && (
                <span className="text-sm text-[var(--muted-foreground)] line-through">
                  {formatPrice(book.price)}
                </span>
              )}
            </div>

            {/* Format selector */}
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--foreground)]">
                {t("bookDetail.format")}
              </p>
              <div className="flex gap-2">
                {FORMATS.map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt)}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200",
                      selectedFormat.id === fmt.id
                        ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--foreground)] shadow-sm"
                        : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {fmt.label}
                    {fmt.priceModifier > 0 && (
                      <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                        +{formatPrice(fmt.priceModifier)}
                      </span>
                    )}
                    {fmt.priceModifier < 0 && (
                      <span className="ml-1 text-xs text-green-600">
                        {formatPrice(fmt.priceModifier)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity stepper */}
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--foreground)]">
                {t("bookDetail.quantity")}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-1 py-0.5">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-light)] hover:text-[var(--foreground)]"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums text-[var(--foreground)]">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(q + 1, book.stock_quantity || 99)
                      )
                    }
                    aria-label="Increase quantity"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-light)] hover:text-[var(--foreground)]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {book.stock_quantity > 0 && book.stock_quantity <= 10 && (
                  <span className="text-xs font-medium text-amber-600">
                    Only {book.stock_quantity} left in stock
                  </span>
                )}
                {outOfStock && (
                  <span className="text-xs font-medium text-red-500">Out of stock</span>
                )}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={outOfStock || added}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-200",
                  outOfStock
                    ? "bg-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed"
                    : added
                    ? "bg-green-600 text-white"
                    : "bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent-hover)] hover:text-white shadow-[0_2px_8px_rgba(200,169,110,0.35)]"
                )}
              >
                {added ? (
                  <><Check className="h-4 w-4" /> {t("bookDetail.added")}</>
                ) : outOfStock ? (
                  t("bookDetail.outOfStock")
                ) : (
                  <><ShoppingCart className="h-4 w-4" /> {t("bookDetail.addToCart")}</>
                )}
              </button>

              <button
                onClick={() => setWishlisted((w) => !w)}
                aria-label={wishlisted ? t("bookDetail.wishlisted") : t("bookDetail.wishlist")}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-200",
                  wishlisted
                    ? "border-red-300 bg-red-50 text-red-500"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-red-300 hover:text-red-400"
                )}
              >
                <Heart className={cn("h-5 w-5", wishlisted && "fill-current")} />
              </button>

              <button
                onClick={handleShare}
                aria-label="Share"
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {shared ? <Check className="h-5 w-5 text-green-600" /> : <Share2 className="h-5 w-5" />}
              </button>
            </div>

            {/* Book metadata */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Book Details
              </h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {book.isbn && (
                  <>
                    <dt className="text-[var(--muted-foreground)]">ISBN</dt>
                    <dd className="font-medium text-[var(--foreground)]">{book.isbn}</dd>
                  </>
                )}
                {book.publisher && (
                  <>
                    <dt className="text-[var(--muted-foreground)]">Publisher</dt>
                    <dd className="font-medium text-[var(--foreground)]">{book.publisher}</dd>
                  </>
                )}
                {publishYear && (
                  <>
                    <dt className="text-[var(--muted-foreground)]">Published</dt>
                    <dd className="font-medium text-[var(--foreground)]">{publishYear}</dd>
                  </>
                )}
                {book.pages && (
                  <>
                    <dt className="text-[var(--muted-foreground)]">Pages</dt>
                    <dd className="font-medium text-[var(--foreground)]">{book.pages}</dd>
                  </>
                )}
                <dt className="text-[var(--muted-foreground)]">Genre</dt>
                <dd className="font-medium text-[var(--foreground)]">{book.genre}</dd>
              </dl>
            </div>
          </motion.div>
        </div>

        {/* Description */}
        <Reveal className="mt-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-[var(--foreground)] mb-4">
              {t("bookDetail.description")}
            </h2>
            <p className="text-[var(--muted-foreground)] leading-relaxed text-pretty">
              {book.description}
            </p>
          </div>
        </Reveal>

        {/* Reviews */}
        <Reveal className="mt-16">
          <h2 className="font-display text-2xl font-bold text-[var(--foreground)] mb-8">
            {t("bookDetail.reviews")}
          </h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {REVIEWS.map((review) => (
              <motion.article
                key={review.id}
                variants={fadeInUp}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--accent-light)]"
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
                <h3 className="mt-2 text-sm font-semibold text-[var(--foreground)]">{review.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">{review.body}</p>
              </motion.article>
            ))}
          </motion.div>
        </Reveal>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <Reveal className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-bold text-[var(--foreground)]">
                {t("bookDetail.relatedBooks")}
              </h2>
              <Link
                href={`/catalog?genre=${encodeURIComponent(book.genre)}`}
                className="flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {relatedBooks.map((rb) => (
                <RelatedBookCard key={rb.id} book={rb} />
              ))}
            </motion.div>
          </Reveal>
        )}
      </div>
    </main>
  );
}

// ─── Page export (wraps inner in Suspense for useSearchParams) ────────────────

export default function BookDetailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BookDetailInner />
    </Suspense>
  );
}
