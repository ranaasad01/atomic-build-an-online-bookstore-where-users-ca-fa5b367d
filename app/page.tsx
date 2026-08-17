"use client";

import { useState, useEffect } from "react";
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
  genre: string;
  cover_image: string;
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const t = useTranslations();
  const heroItems = Array.isArray(t.raw("hero")) ? (t.raw("hero") as string[]) : [];

  const [featuredBooks, setFeaturedBooks] = useState<FeaturedBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchFeaturedBooks() {
      setBooksLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("books")
          .select("id, title, author, price, cover_image, rating, is_bestseller, is_featured, stock_quantity, genre")
          .eq("is_featured", true)
          .order("rating", { ascending: false })
          .limit(6);

        if (error) {
          console.error("Failed to fetch featured books:", error);
          if (!cancelled) setFeaturedBooks([]);
          return;
        }

        if (!cancelled) {
          setFeaturedBooks((data ?? []) as FeaturedBook[]);
        }
      } catch (err) {
        console.error("Unexpected error fetching featured books:", err);
        if (!cancelled) setFeaturedBooks([]);
      } finally {
        if (!cancelled) setBooksLoading(false);
      }
    }

    fetchFeaturedBooks();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden bg-[var(--primary)] text-white"
        aria-label="Hero"
      >
        {/* Background texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 0%, transparent 60%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: copy */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-6"
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                  {APP_TAGLINE}
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-balance"
              >
                Your next great read{" "}
                <span className="text-[var(--accent)]">starts here.</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg text-white/70 leading-relaxed max-w-lg text-pretty"
              >
                Handpicked fiction, non-fiction, and everything in between. Over 50,000 titles across 12 genres, delivered to your door.
              </motion.p>

              {/* Bullet points from i18n */}
              {heroItems.length > 0 && (
                <motion.ul variants={fadeInUp} className="flex flex-col gap-2">
                  {heroItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex-shrink-0">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </motion.ul>
              )}

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white shadow-[0_4px_14px_rgba(200,169,110,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  Browse Catalog
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/catalog?genre=Fiction"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  Explore Fiction
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <p className="font-display text-3xl font-bold text-[var(--accent)]">{stat.value}</p>
                  <p className="mt-1 text-sm text-white/60">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Featured Books ── */}
      <section className="py-20 md:py-28" aria-labelledby="featured-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">
                  Hand-picked for you
                </p>
                <h2
                  id="featured-heading"
                  className="font-display text-3xl sm:text-4xl font-bold text-[var(--foreground)] tracking-tight"
                >
                  Featured Reads
                </h2>
              </div>
              <Link
                href="/catalog"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors duration-200"
              >
                View all
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>

          {booksLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <BookCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredBooks.length === 0 ? (
            <Reveal>
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <BookOpen className="h-12 w-12 text-[var(--border)] mb-4" aria-hidden="true" />
                <p className="text-[var(--muted-foreground)] text-lg font-medium">No featured books yet.</p>
                <p className="text-[var(--muted-foreground)] text-sm mt-1">Check back soon for our curated picks.</p>
                <Link
                  href="/catalog"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors duration-200"
                >
                  Browse all books
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
            >
              {featuredBooks.map((book) => (
                <motion.article
                  key={book.id}
                  variants={fadeInUp}
                  className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.14)]"
                >
                  {/* Cover */}
                  <Link
                    href={`/book-detail?id=${book.id}`}
                    className="relative block aspect-[2/3] overflow-hidden bg-[var(--accent-light)]"
                    aria-label={`View ${book.title}`}
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

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-1.5 p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                      {book.genre}
                    </span>
                    <Link href={`/book-detail?id=${book.id}`}>
                      <h3 className="font-display text-sm font-bold leading-snug text-[var(--foreground)] line-clamp-2 hover:text-[var(--accent)] transition-colors duration-200">
                        {book.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">{book.author}</p>

                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 fill-[var(--accent)] text-[var(--accent)]" aria-hidden="true" />
                      <span className="text-xs font-medium text-[var(--foreground)]">{book.rating.toFixed(1)}</span>
                    </div>

                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-[var(--foreground)]">${book.price.toFixed(2)}</span>
                      <Link
                        href={`/book-detail?id=${book.id}`}
                        className="rounded-lg bg-[var(--accent-light)] p-1.5 text-[var(--accent)] transition-colors duration-200 hover:bg-[var(--accent)] hover:text-[var(--primary)]"
                        aria-label={`View ${book.title}`}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}

          <Reveal className="mt-8 flex justify-center sm:hidden">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all duration-200"
            >
              View all books
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Genre Showcase ── */}
      <section className="bg-[var(--accent-light)] py-20 md:py-28" aria-labelledby="genres-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">
                Browse by genre
              </p>
              <h2
                id="genres-heading"
                className="font-display text-3xl sm:text-4xl font-bold text-[var(--foreground)] tracking-tight"
              >
                Find your next obsession
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
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center transition-all duration-200 hover:border-[var(--accent)] hover:shadow-[0_4px_20px_-4px_rgba(200,169,110,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <span className="text-3xl" role="img" aria-label={genre.label}>{genre.emoji}</span>
                  <span className="font-display text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors duration-200">
                    {genre.label}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {genre.count.toLocaleString("en-US")} titles
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Value Props ── */}
      <section className="py-20 md:py-28" aria-labelledby="value-props-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2
              id="value-props-heading"
              className="sr-only"
            >
              Why shop with PageTurner
            </h2>
          </Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {VALUE_PROPS.map((prop) => {
              const Icon = prop.icon;
              return (
                <motion.div
                  key={prop.title}
                  variants={fadeInUp}
                  className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
                >
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
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-[var(--primary)] py-20 md:py-28" aria-labelledby="testimonials-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">
                Reader stories
              </p>
              <h2
                id="testimonials-heading"
                className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight"
              >
                Loved by readers everywhere
              </h2>
            </div>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {TESTIMONIALS.map((testimonial) => (
              <motion.figure
                key={testimonial.id}
                variants={fadeInUp}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-4 w-4",
                        star <= testimonial.rating
                          ? "fill-[var(--accent)] text-[var(--accent)]"
                          : "fill-transparent text-white/20"
                      )}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <blockquote>
                  <p className="text-sm text-white/80 leading-relaxed italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                </blockquote>
                <figcaption className="flex items-center gap-3 mt-auto pt-2 border-t border-white/10">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="h-9 w-9 rounded-full border border-white/20"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                    <p className="text-xs text-white/50">{testimonial.location}</p>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <Reveal>
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-10 md:p-16 shadow-[0_8px_40px_rgba(26,26,46,0.1)] relative overflow-hidden">
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 70% 30%, var(--accent-light) 0%, transparent 60%)",
                }}
              />
              <div className="relative">
                <BookOpen className="mx-auto h-10 w-10 text-[var(--accent)] mb-4" aria-hidden="true" />
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--foreground)] tracking-tight mb-4 text-balance">
                  Ready to find your next great read?
                </h2>
                <p className="text-[var(--muted-foreground)] text-lg leading-relaxed mb-8 max-w-xl mx-auto text-pretty">
                  Browse over 50,000 titles across every genre. Free shipping on orders over ${FREE_SHIPPING_THRESHOLD}.
                </p>
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-3.5 text-sm font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[var(--accent-hover)] hover:text-white shadow-[0_4px_14px_rgba(200,169,110,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  Start browsing
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
