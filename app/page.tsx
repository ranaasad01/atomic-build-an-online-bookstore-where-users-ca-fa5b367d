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

interface FeaturedBook {
  id: string;
  title: string;
  author: string;
  price: number;
  rating: number;
  cover_image: string;
  is_bestseller: boolean;
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

function FeaturedBookCard({ book }: { book: FeaturedBook }) {
  const [added, setAdded] = useState(false);

  const handleAddToCart = useCallback(() => {
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
      // ignore
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }, [book]);

  return (
    <motion.article
      variants={fadeInUp}
      className="group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.14)] overflow-hidden"
    >
      {book.is_bestseller && (
        <div className="absolute top-3 left-3 z-10">
          <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">
            Bestseller
          </span>
        </div>
      )}
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
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <Link href={`/book-detail?id=${book.id}`}>
            <h3 className="font-display text-base font-bold leading-snug text-[var(--foreground)] line-clamp-2 hover:text-[var(--accent)] transition-colors duration-200">
              {book.title}
            </h3>
          </Link>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{book.author}</p>
        </div>
        <div className="flex items-center gap-1 mt-auto">
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
        <div className="flex items-center justify-between mt-1">
          <span className="font-semibold text-[var(--foreground)]">
            ${book.price.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            aria-label={`Add ${book.title} to cart`}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200",
              added
                ? "bg-green-600 text-white"
                : "bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent-hover)] hover:text-white"
            )}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {added ? "Added" : "Add to Cart"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const t = useTranslations();
  const heroT = t.raw("hero") as Record<string, string>;

  const [featuredBooks, setFeaturedBooks] = useState<FeaturedBook[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedBooks() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("books")
          .select("id, title, author, price, cover_image, rating, is_bestseller")
          .eq("is_featured", true)
          .limit(4);

        if (error) {
          console.error("Failed to fetch featured books:", error.message);
          setFeaturedBooks([]);
        } else {
          setFeaturedBooks((data as FeaturedBook[]) ?? []);
        }
      } catch (err) {
        console.error("Unexpected error fetching featured books:", err);
        setFeaturedBooks([]);
      } finally {
        setFeaturedLoading(false);
      }
    }

    fetchFeaturedBooks();
  }, []);

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[var(--primary)]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 70% 50%, rgba(200,169,110,0.18) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(200,169,110,0.10) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5 text-sm font-medium text-[var(--accent)]">
                <Sparkles className="h-3.5 w-3.5" />
                {heroT.badge ?? "New arrivals"}
              </span>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight text-balance leading-[1.08]"
            >
              {APP_NAME}.
              <br />
              <span className="text-[var(--accent)]">{APP_TAGLINE}</span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-white/70 text-lg leading-relaxed max-w-md"
            >
              Discover handpicked fiction, non-fiction, and everything in between. Over 2,000 titles across 12 genres.
            </motion.p>
            <motion.ul variants={fadeInUp} className="flex flex-col gap-2">
              {[heroT.bullet1, heroT.bullet2, heroT.bullet3].filter(Boolean).map((bullet, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
                  {bullet}
                </li>
              ))}
            </motion.ul>
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white shadow-[0_4px_16px_rgba(200,169,110,0.35)]"
              >
                {heroT.cta_primary ?? "Start shopping"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10"
              >
                {heroT.cta_secondary ?? "Learn more"}
              </Link>
            </motion.div>
          </motion.div>

          {/* Right — genre pills */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            {GENRES_SHOWCASE.map((genre) => (
              <motion.div key={genre.label} variants={scaleIn}>
                <Link
                  href={genre.href}
                  className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-200 hover:bg-white/10 hover:border-[var(--accent)]/40 group"
                >
                  <span className="text-3xl">{genre.emoji}</span>
                  <span className="font-display text-base font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                    {genre.label}
                  </span>
                  <span className="text-xs text-white/50">{genre.count.toLocaleString("en-US")} titles</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <Reveal>
        <section className="bg-[var(--accent)] py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-0.5">
                  <span className="font-display text-2xl font-bold text-[var(--primary)]">{stat.value}</span>
                  <span className="text-xs font-medium text-[var(--primary)]/70 uppercase tracking-wide">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Featured Reads ── */}
      <section className="py-20 md:py-28 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                  {heroT.featured_label ?? "Featured"}
                </span>
                <h2 className="mt-1 font-display text-3xl md:text-4xl font-bold text-[var(--foreground)] tracking-tight">
                  {heroT.featured_heading ?? "Curated for you"}
                </h2>
              </div>
              <Link
                href="/catalog"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                {heroT.featured_cta ?? "View collection"}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          {featuredLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[0, 1, 2, 3].map((i) => (
                <BookCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredBooks.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
            >
              {featuredBooks.map((book) => (
                <FeaturedBookCard key={book.id} book={book} />
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16 text-[var(--muted-foreground)]">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No featured books available right now.</p>
              <Link
                href="/catalog"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                Browse all books <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          <Reveal className="mt-8 sm:hidden text-center">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
            >
              {heroT.featured_cta ?? "View collection"}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Genres showcase ── */}
      <section className="py-20 md:py-28 bg-[var(--primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                {heroT.genres_label ?? "Genres"}
              </span>
              <h2 className="mt-1 font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
                {heroT.genres_heading ?? "Browse by genre"}
              </h2>
            </div>
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
                  className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-center transition-all duration-200 hover:bg-white/10 hover:border-[var(--accent)]/40 group"
                >
                  <span className="text-4xl">{genre.emoji}</span>
                  <span className="font-display text-sm font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                    {genre.label}
                  </span>
                  <span className="text-xs text-white/50">{genre.count.toLocaleString("en-US")} titles</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
          <Reveal className="mt-10 text-center">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-6 py-3 text-sm font-semibold text-[var(--accent)] transition-all duration-200 hover:bg-[var(--accent)]/20"
            >
              {heroT.genres_cta ?? "Explore genres"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Value props ── */}
      <section className="py-20 md:py-28 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--foreground)] tracking-tight">
                {heroT.why_heading ?? "Why shop with us"}
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUE_PROPS.map((vp) => {
              const Icon = vp.icon;
              return (
                <Reveal key={vp.title}>
                  <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-light)]">
                      <Icon className="h-5 w-5 text-[var(--accent)]" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-[var(--foreground)] mb-1">{vp.title}</h3>
                      <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{vp.description}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 md:py-28 bg-[var(--accent-light)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                {heroT.testimonials_label ?? "Testimonials"}
              </span>
              <h2 className="mt-1 font-display text-3xl md:text-4xl font-bold text-[var(--foreground)] tracking-tight">
                {heroT.testimonials_heading ?? "Loved by readers"}
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Reveal key={t.id}>
                <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-4 w-4",
                          star <= t.rating
                            ? "fill-[var(--accent)] text-[var(--accent)]"
                            : "fill-transparent text-[var(--border)]"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 mt-auto pt-2 border-t border-[var(--border)]">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="h-9 w-9 rounded-full border border-[var(--border)] bg-[var(--accent-light)]"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{t.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{t.location}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <Reveal>
        <section className="bg-[var(--primary)] py-16 md:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 50%, white 0%, transparent 60%)",
            }}
          />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5 text-sm font-medium text-[var(--accent)] mb-4">
              <BookOpen className="h-3.5 w-3.5" />
              {heroT.cta_banner_heading ?? "Limited edition pressings"}
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              {heroT.cta_banner_heading ?? "Your next great read is waiting"}
            </h2>
            <p className="text-white/70 text-base leading-relaxed mb-8">
              {heroT.cta_banner_sub ?? "Exclusive releases available for a short time."}
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-3.5 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white shadow-[0_4px_16px_rgba(200,169,110,0.35)]"
            >
              {heroT.cta_banner_btn ?? "Shop now"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
