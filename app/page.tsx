"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Star, ShoppingCart, ArrowRight, Truck, Shield, RotateCcw, Heart, ChevronRight, Sparkles } from 'lucide-react';
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_TAGLINE, FREE_SHIPPING_THRESHOLD } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";

// ─── Static inline data (no DB needed) ───────────────────────────────────────

const GENRES_SHOWCASE = [
  { label: "Fiction", emoji: "📖", count: 1240, href: "/catalog?genre=Fiction" },
  { label: "Mystery & Thriller", emoji: "🔍", count: 890, href: "/catalog?genre=Mystery+%26+Thriller" },
  { label: "Science Fiction", emoji: "🚀", count: 670, href: "/catalog?genre=Science+Fiction" },
  { label: "Self-Help", emoji: "✨", count: 540, href: "/catalog?genre=Self-Help" },
  { label: "Biography", emoji: "🧑", count: 430, href: "/catalog?genre=Biography" },
  { label: "Fantasy", emoji: "🐉", count: 760, href: "/catalog?genre=Fantasy" },
];

const TESTIMONIALS = [
  {
    id: "t1",
    name: "Sarah M.",
    location: "New York, NY",
    quote:
      "PageTurner has completely changed how I discover books. The curation is spot-on and delivery is always faster than expected.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah%20M.",
  },
  {
    id: "t2",
    name: "James R.",
    location: "Austin, TX",
    quote:
      "I've ordered over 30 books this year alone. The packaging is beautiful and every recommendation has been a winner.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James%20R.",
  },
  {
    id: "t3",
    name: "Priya K.",
    location: "Chicago, IL",
    quote:
      "Finally a bookstore that feels personal. The genre filters are perfect and checkout takes under a minute.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya%20K.",
  },
];

const VALUE_PROPS = [
  {
    icon: Truck,
    title: "Free Shipping Over $50",
    description:
      "Orders above $50 ship free to your door. Standard delivery in 3-5 business days, express in 1-2.",
  },
  {
    icon: Shield,
    title: "Secure Checkout",
    description:
      "Your payment details are encrypted end-to-end. We never store card numbers on our servers.",
  },
  {
    icon: RotateCcw,
    title: "30-Day Returns",
    description:
      "Not the right read? Return any book within 30 days for a full refund, no questions asked.",
  },
  {
    icon: Heart,
    title: "Curated with Care",
    description:
      "Every title in our catalog is hand-reviewed by our editorial team. No filler, only great reads.",
  },
];

const STATS = [
  { value: "50,000+", label: "Titles in stock" },
  { value: "4.9", label: "Average rating" },
  { value: "120k+", label: "Happy readers" },
  { value: "Free", label: `Shipping over $${FREE_SHIPPING_THRESHOLD}` },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookRow {
  id: string;
  title: string;
  author: string;
  price: number;
  cover_image: string;
  rating: number;
  is_bestseller: boolean;
  is_featured: boolean;
  stock_quantity: number;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BookCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden animate-pulse">
      <div className="aspect-[2/3] bg-[var(--accent-light)]" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-[var(--accent-light)] rounded w-3/4" />
        <div className="h-3 bg-[var(--accent-light)] rounded w-1/2" />
        <div className="h-3 bg-[var(--accent-light)] rounded w-1/4" />
      </div>
    </div>
  );
}

// ─── Featured Book Card ───────────────────────────────────────────────────────

function FeaturedBookCard({ book, onAddToCart, addedId }: {
  book: BookRow;
  onAddToCart: (book: BookRow) => void;
  addedId: string | null;
}) {
  const isAdded = addedId === book.id;
  const outOfStock = book.stock_quantity === 0;

  return (
    <motion.article
      variants={fadeInUp}
      className="group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.14)] overflow-hidden"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {book.is_bestseller && (
          <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">
            Bestseller
          </span>
        )}
        {book.is_featured && !book.is_bestseller && (
          <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Featured
          </span>
        )}
      </div>

      {/* Cover */}
      <Link
        href={`/book-detail?id=${book.id}`}
        className="block relative aspect-[2/3] overflow-hidden bg-[var(--accent-light)]"
      >
        <img
          src={book.cover_image}
          alt={book.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/images/book-placeholder.jpg";
          }}
        />
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <Link href={`/book-detail?id=${book.id}`}>
            <h3 className="font-display text-base font-bold leading-snug text-[var(--foreground)] line-clamp-2 hover:text-[var(--accent)] transition-colors duration-200">
              {book.title}
            </h3>
          </Link>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{book.author}</p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-3.5 w-3.5",
                star <= Math.round(book.rating)
                  ? "fill-[var(--accent)] text-[var(--accent)]"
                  : "fill-transparent text-[var(--border)]"
              )}
            />
          ))}
          <span className="ml-1 text-xs text-[var(--muted-foreground)]">
            {book.rating.toFixed(1)}
          </span>
        </div>

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-display text-lg font-bold text-[var(--foreground)]">
            ${book.price.toFixed(2)}
          </span>
          <button
            onClick={() => onAddToCart(book)}
            disabled={outOfStock || isAdded}
            aria-label={`Add ${book.title} to cart`}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200",
              outOfStock
                ? "bg-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed"
                : isAdded
                ? "bg-green-600 text-white"
                : "bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent-hover)] hover:text-white"
            )}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {outOfStock ? "Out of stock" : isAdded ? "Added" : "Add to cart"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const t = useTranslations();

  // Featured books from Supabase
  const [featuredBooks, setFeaturedBooks] = useState<BookRow[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeaturedBooks() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("books")
          .select(
            "id,title,author,price,cover_image,rating,is_bestseller,is_featured,stock_quantity"
          )
          .eq("is_featured", true)
          .order("rating", { ascending: false })
          .limit(6);

        if (error) {
          console.error("Failed to fetch featured books:", error.message);
        } else {
          setFeaturedBooks(data ?? []);
        }
      } catch (err) {
        console.error("Unexpected error fetching featured books:", err);
      } finally {
        setLoadingBooks(false);
      }
    }

    fetchFeaturedBooks();
  }, []);

  const handleAddToCart = useCallback((book: BookRow) => {
    try {
      const raw = localStorage.getItem("pageturner_cart");
      const cart = raw ? JSON.parse(raw) : [];
      const existing = cart.find(
        (i: { bookId: string; format: string }) =>
          i.bookId === book.id && i.format === "Paperback"
      );
      let updated;
      if (existing) {
        updated = cart.map((i: { bookId: string; format: string; quantity: number }) =>
          i.bookId === book.id && i.format === "Paperback"
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        updated = [
          ...cart,
          {
            bookId: book.id,
            title: book.title,
            author: book.author,
            price: book.price,
            coverImage: book.cover_image,
            quantity: 1,
            format: "Paperback",
          },
        ];
      }
      localStorage.setItem("pageturner_cart", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
    } catch {
      // ignore storage errors
    }
    setAddedId(book.id);
    setTimeout(() => setAddedId(null), 1800);
  }, []);

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden bg-[var(--primary)] text-white"
        aria-label="Hero"
      >
        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 60% at 60% 50%, rgba(200,169,110,0.18) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-6"
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("hero.badge")}
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-balance"
              >
                {APP_TAGLINE}
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-white/70 text-lg leading-relaxed max-w-md"
              >
                Discover handpicked fiction, non-fiction, and everything in between. Over 50,000 titles across 16 genres.
              </motion.p>

              <motion.ul variants={fadeInUp} className="flex flex-col gap-2">
                {[
                  t("hero.bullet1"),
                  t("hero.bullet2"),
                  t("hero.bullet3"),
                ].map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2 text-sm text-white/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" aria-hidden="true" />
                    {bullet}
                  </li>
                ))}
              </motion.ul>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white shadow-[0_2px_12px_rgba(200,169,110,0.35)]"
                >
                  {t("hero.cta_primary")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/20"
                >
                  {t("hero.cta_secondary")}
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: stats grid */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="hidden lg:grid grid-cols-2 gap-4"
            >
              {STATS.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={scaleIn}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 flex flex-col gap-1"
                >
                  <span className="font-display text-3xl font-bold text-[var(--accent)]">
                    {stat.value}
                  </span>
                  <span className="text-sm text-white/60">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Featured Books ── */}
      <section
        className="py-20 md:py-28 bg-[var(--background)]"
        aria-labelledby="featured-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                {t("hero.featured_label")}
              </span>
              <h2
                id="featured-heading"
                className="mt-1 font-display text-3xl md:text-4xl font-bold text-[var(--foreground)] tracking-tight"
              >
                {t("hero.featured_heading")}
              </h2>
            </div>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors duration-200 shrink-0"
            >
              {t("hero.featured_cta")}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>

          {loadingBooks ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <BookCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen
                className="h-12 w-12 text-[var(--border)] mb-4"
                aria-hidden="true"
              />
              <p className="text-[var(--muted-foreground)] text-sm">
                No featured books available right now. Check back soon.
              </p>
              <Link
                href="/catalog"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                Browse the full catalog
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
            >
              {featuredBooks.map((book) => (
                <FeaturedBookCard
                  key={book.id}
                  book={book}
                  onAddToCart={handleAddToCart}
                  addedId={addedId}
                />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Genres Showcase ── */}
      <section
        className="py-20 md:py-28 bg-[var(--primary)]"
        aria-labelledby="genres-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
              {t("hero.genres_label")}
            </span>
            <h2
              id="genres-heading"
              className="mt-1 font-display text-3xl md:text-4xl font-bold text-white tracking-tight"
            >
              {t("hero.genres_heading")}
            </h2>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {GENRES_SHOWCASE.map((genre) => (
              <motion.div key={genre.label} variants={scaleIn}>
                <Link
                  href={genre.href}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center transition-all duration-300 hover:bg-white/10 hover:border-[var(--accent)]/40 hover:shadow-[0_4px_20px_rgba(200,169,110,0.15)] group"
                >
                  <span className="text-3xl" aria-hidden="true">{genre.emoji}</span>
                  <span className="font-display text-sm font-semibold text-white group-hover:text-[var(--accent)] transition-colors duration-200">
                    {genre.label}
                  </span>
                  <span className="text-xs text-white/50">
                    {genre.count.toLocaleString("en-US")} titles
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <Reveal className="text-center mt-10">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-6 py-3 text-sm font-semibold text-[var(--accent)] transition-all duration-200 hover:bg-[var(--accent)] hover:text-[var(--primary)]"
            >
              {t("hero.genres_cta")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Value Props ── */}
      <section
        className="py-20 md:py-28 bg-[var(--background)]"
        aria-labelledby="why-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <h2
              id="why-heading"
              className="font-display text-3xl md:text-4xl font-bold text-[var(--foreground)] tracking-tight"
            >
              {t("hero.why_heading")}
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUE_PROPS.map((prop, i) => {
              const Icon = prop.icon;
              return (
                <Reveal key={prop.title} delay={i * 0.08}>
                  <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] h-full">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-light)]">
                      <Icon className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-[var(--foreground)] mb-1">
                        {prop.title}
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                        {prop.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section
        className="py-20 md:py-28 bg-[var(--accent-light)]"
        aria-labelledby="testimonials-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
              {t("hero.testimonials_label")}
            </span>
            <h2
              id="testimonials-heading"
              className="mt-1 font-display text-3xl md:text-4xl font-bold text-[var(--foreground)] tracking-tight"
            >
              {t("hero.testimonials_heading")}
            </h2>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {TESTIMONIALS.map((testimonial) => (
              <motion.div
                key={testimonial.id}
                variants={fadeInUp}
                className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
              >
                {/* Stars */}
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-4 w-4",
                        star <= testimonial.rating
                          ? "fill-[var(--accent)] text-[var(--accent)]"
                          : "fill-transparent text-[var(--border)]"
                      )}
                    />
                  ))}
                </div>

                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed flex-1">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="h-9 w-9 rounded-full border border-[var(--border)] bg-[var(--accent-light)]"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 md:py-28 bg-[var(--primary)]" aria-label="Call to action">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-6">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {t("hero.cta_banner_heading")}
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white tracking-tight mb-4 text-balance">
              {t("hero.cta_banner_sub")}
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              Join over 120,000 readers who trust PageTurner for their next great read.
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 text-base font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white shadow-[0_4px_20px_rgba(200,169,110,0.4)]"
            >
              {t("hero.cta_banner_btn")}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
