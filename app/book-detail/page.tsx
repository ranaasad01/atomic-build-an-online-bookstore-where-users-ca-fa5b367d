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
        <p className="text-sm text-[var(--muted-foreground)]">Loading book details...</p>
      </div>
    </div>
  );
}

// ─── Book Not Found ───────────────────────────────────────────────────────────

function BookNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="text-center max-w-md">
        <BookOpen className="w-16 h-16 text-[var(--border)] mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-[var(--foreground)] mb-2">
          Book not found
        </h1>
        <p className="text-[var(--muted-foreground)] mb-6">
          We couldn't find the book you're looking for. It may have been removed or the link is incorrect.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>
      </div>
    </div>
  );
}

// ─── Inner page (uses useSearchParams) ───────────────────────────────────────

function BookDetailInner() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("id") ?? "";
  const { addItem } = useCart();

  const [book, setBook] = useState<BookRow | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<RelatedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedFormat, setSelectedFormat] = useState(FORMATS[1]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "details" | "reviews">("description");

  // ── Fetch book + related books ──────────────────────────────────────────────
  useEffect(() => {
    if (!bookId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchBook() {
      setLoading(true);
      setNotFound(false);

      try {
        const supabase = createClient();

        // Fetch the main book
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
        const { data: related } = await supabase
          .from("books")
          .select("id, title, author, price, cover_image, rating, is_bestseller")
          .eq("genre", (bookData as BookRow).genre)
          .neq("id", bookId)
          .limit(4);

        if (cancelled) return;

        setRelatedBooks((related as RelatedBook[]) ?? []);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBook();

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleAddToCart() {
    if (!book) return;
    addItem({
      bookId: book.id,
      title: book.title,
      author: book.author,
      price: book.price + selectedFormat.priceModifier,
      coverImage: book.cover_image,
      format: selectedFormat.label,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  // ── Render states ───────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner />;
  if (notFound || !book) return <BookNotFound />;

  const finalPrice = book.price + selectedFormat.priceModifier;
  const inStock = book.stock_quantity > 0;
  const ratingCount = book.rating_count ?? REVIEWS.length;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Breadcrumb */}
      <div className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[var(--accent)] transition-colors duration-200">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/catalog" className="hover:text-[var(--accent)] transition-colors duration-200">Catalog</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[var(--foreground)] font-medium line-clamp-1">{book.title}</span>
          </nav>
        </div>
      </div>

      {/* Main product section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
          {/* Cover */}
          <Reveal className="flex justify-center lg:justify-end">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="relative w-full max-w-sm"
            >
              {/* Decorative shadow */}
              <div className="absolute -bottom-4 -right-4 w-full h-full rounded-2xl bg-[var(--accent)]/20 blur-xl" />
              <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] shadow-[0_8px_40px_rgba(26,26,46,0.18)]">
                <img
                  src={book.cover_image}
                  alt={book.title}
                  className="w-full aspect-[2/3] object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/images/book-placeholder.jpg";
                  }}
                />
                {book.is_bestseller && (
                  <div className="absolute top-4 left-4">
                    <span className="flex items-center gap-1 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--primary)]">
                      <Award className="w-3 h-3" />
                      Bestseller
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </Reveal>

          {/* Info */}
          <Reveal>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-5"
            >
              {/* Genre */}
              <motion.div variants={fadeInUp}>
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                  {book.genre}
                </span>
              </motion.div>

              {/* Title & Author */}
              <motion.div variants={fadeInUp}>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--foreground)] leading-tight mb-2">
                  {book.title}
                </h1>
                <p className="text-lg text-[var(--muted-foreground)]">
                  by <span className="font-medium text-[var(--foreground)]">{book.author}</span>
                </p>
              </motion.div>

              {/* Rating */}
              <motion.div variants={fadeInUp} className="flex items-center gap-3">
                <StarRating rating={book.rating} size="md" />
                <span className="text-sm font-semibold text-[var(--foreground)]">{book.rating.toFixed(1)}</span>
                <span className="text-sm text-[var(--muted-foreground)]">
                  ({ratingCount.toLocaleString("en-US")} reviews)
                </span>
              </motion.div>

              {/* Price */}
              <motion.div variants={fadeInUp} className="flex items-baseline gap-3">
                <span className="font-display text-3xl font-bold text-[var(--foreground)]">
                  {formatPrice(finalPrice)}
                </span>
                {selectedFormat.priceModifier !== 0 && (
                  <span className="text-sm text-[var(--muted-foreground)] line-through">
                    {formatPrice(book.price)}
                  </span>
                )}
              </motion.div>

              {/* Format selector */}
              <motion.div variants={fadeInUp}>
                <p className="text-sm font-semibold text-[var(--foreground)] mb-2">Format</p>
                <div className="flex gap-2 flex-wrap">
                  {FORMATS.map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setSelectedFormat(fmt)}
                      className={cn(
                        "rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200",
                        selectedFormat.id === fmt.id
                          ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--foreground)] shadow-sm"
                          : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/50 hover:text-[var(--foreground)]"
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
              </motion.div>

              {/* Quantity + Add to cart */}
              <motion.div variants={fadeInUp} className="flex items-center gap-3 flex-wrap">
                {/* Quantity stepper */}
                <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-1 py-0.5">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-light)] hover:text-[var(--foreground)]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-light)] hover:text-[var(--foreground)]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock || added}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200",
                    !inStock
                      ? "bg-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed"
                      : added
                      ? "bg-green-600 text-white"
                      : "bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent-hover)] hover:text-white shadow-[0_2px_12px_rgba(200,169,110,0.35)]"
                  )}
                >
                  {added ? (
                    <><Check className="w-4 h-4" /> Added to Cart</>
                  ) : !inStock ? (
                    "Out of Stock"
                  ) : (
                    <><ShoppingCart className="w-4 h-4" /> Add to Cart</>
                  )}
                </button>

                {/* Wishlist */}
                <button
                  onClick={() => setWishlisted((w) => !w)}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-200",
                    wishlisted
                      ? "border-red-300 bg-red-50 text-red-500"
                      : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-red-300 hover:text-red-400"
                  )}
                >
                  <Heart className={cn("w-4 h-4", wishlisted && "fill-current")} />
                </button>

                {/* Share */}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: book.title, url: window.location.href }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.href).catch(() => {});
                    }
                  }}
                  aria-label="Share this book"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition-all duration-200 hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                variants={fadeInUp}
                className="grid grid-cols-3 gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                {[
                  { icon: Truck, label: "Free shipping over $40" },
                  { icon: RotateCcw, label: "30-day returns" },
                  { icon: BookOpen, label: "Secure checkout" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-light)]">
                      <Icon className="w-4 h-4 text-[var(--accent)]" />
                    </div>
                    <span className="text-[11px] text-[var(--muted-foreground)] leading-tight">{label}</span>
                  </div>
                ))}
              </motion.div>

              {/* Stock indicator */}
              {inStock && book.stock_quantity <= 10 && (
                <motion.p variants={fadeInUp} className="text-sm text-amber-600 font-medium">
                  Only {book.stock_quantity} left in stock — order soon.
                </motion.p>
              )}
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* Tabs: Description / Details / Reviews */}
      <section className="border-t border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab bar */}
          <div className="flex gap-0 border-b border-[var(--border)] overflow-x-auto">
            {(["description", "details", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-4 text-sm font-semibold capitalize whitespace-nowrap border-b-2 transition-all duration-200",
                  activeTab === tab
                    ? "border-[var(--accent)] text-[var(--foreground)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                {tab === "reviews" ? `Reviews (${REVIEWS.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="py-8 max-w-3xl">
            {activeTab === "description" && (
              <Reveal>
                <div className="prose prose-stone max-w-none">
                  <p className="text-[var(--foreground)] leading-relaxed text-base">
                    {book.description}
                  </p>
                </div>
              </Reveal>
            )}

            {activeTab === "details" && (
              <Reveal>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "ISBN", value: book.isbn ?? "N/A" },
                    { label: "Publisher", value: book.publisher ?? "N/A" },
                    { label: "Published", value: book.published_at ? new Date(book.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A" },
                    { label: "Pages", value: book.pages ? book.pages.toLocaleString("en-US") : "N/A" },
                    { label: "Genre", value: book.genre },
                    { label: "Language", value: "English" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{label}</dt>
                      <dd className="text-sm font-medium text-[var(--foreground)]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            )}

            {activeTab === "reviews" && (
              <Reveal>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-6"
                >
                  {REVIEWS.map((review) => (
                    <motion.article
                      key={review.id}
                      variants={fadeInUp}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={review.avatar}
                          alt={review.name}
                          className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--accent-light)] flex-shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-[var(--foreground)]">{review.name}</span>
                            <span className="text-xs text-[var(--muted-foreground)]">{review.date}</span>
                          </div>
                          <StarRating rating={review.rating} />
                        </div>
                      </div>
                      <h4 className="font-semibold text-sm text-[var(--foreground)] mb-1">{review.title}</h4>
                      <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{review.body}</p>
                    </motion.article>
                  ))}
                </motion.div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* Related Books */}
      {relatedBooks.length > 0 && (
        <section className="border-t border-[var(--border)] py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="font-display text-2xl font-bold text-[var(--foreground)] mb-8">
                You might also like
              </h2>
            </Reveal>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {relatedBooks.map((related) => (
                <motion.article
                  key={related.id}
                  variants={fadeInUp}
                  className="group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.14)]"
                >
                  {related.is_bestseller && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--primary)]">
                        Bestseller
                      </span>
                    </div>
                  )}
                  <Link href={`/book-detail?id=${related.id}`} className="block relative aspect-[2/3] overflow-hidden bg-[var(--accent-light)]">
                    <img
                      src={related.cover_image}
                      alt={related.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/images/book-placeholder.jpg";
                      }}
                    />
                  </Link>
                  <div className="flex flex-col gap-1.5 p-3">
                    <Link href={`/book-detail?id=${related.id}`}>
                      <h3 className="font-display text-sm font-bold leading-snug text-[var(--foreground)] line-clamp-2 hover:text-[var(--accent)] transition-colors duration-200">
                        {related.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-[var(--muted-foreground)]">{related.author}</p>
                    <div className="flex items-center justify-between mt-1">
                      <StarRating rating={related.rating} />
                      <span className="text-sm font-bold text-[var(--foreground)]">
                        {formatPrice(related.price)}
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>
      )}
    </main>
  );
}

// ─── Page export (wraps inner in Suspense for useSearchParams) ────────────────

export default function BookDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <BookDetailInner />
    </Suspense>
  );
}
