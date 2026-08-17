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
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const t = useTranslations();
  const heroItems = Array.isArray(t.raw("hero")) ? (t.raw("hero") as string[]) : [];

  const [featuredBooks, setFeaturedBooks] = useState<FeaturedBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("books")
      .select("*")
      .eq("is_featured", true)
      .limit(4)
      .then(({ data, error }) => {
        if (!error && data) {
          setFeaturedBooks(data as FeaturedBook[]);
        }
        setBooksLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section
        className="relative min-h-[92vh] flex items-center overflow-hidden"
        style={{ background: "var(--primary)" }}
      >
        {/* Texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        {/* Glow */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] opacity-20"
          style={{
            background:
              "radial-gradient(circle at 70% 30%, var(--accent) 0%, transparent 65%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            <motion.div variants={fadeInUp}>
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase"
                style={{
                  background: "rgba(200,169,110,0.15)",
                  color: "var(--accent)",
                  border: "1px solid rgba(200,169,110,0.3)",
                }}
              >
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                New arrivals every week
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight text-balance"
              style={{ fontFamily: "Playfair Display, Georgia, serif", lineHeight: 1.08 }}
            >
              {APP_NAME}
              <span
                className="block mt-2"
                style={{ color: "var(--accent)", fontStyle: "italic" }}
              >
                Every great story
              </span>
              <span className="block">begins here.</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg text-white/70 leading-relaxed max-w-md"
            >
              {APP_TAGLINE} Discover handpicked fiction, non-fiction, and everything in between — over 2,000 titles across 12 genres.
            </motion.p>

            {/* Hero bullets */}
            {heroItems.length > 0 && (
              <motion.ul variants={fadeInUp} className="flex flex-col gap-2">
                {heroItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: "var(--accent)" }}
                    />
                    {item}
                  </li>
                ))}
              </motion.ul>
            )}

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: "var(--accent)",
                  color: "var(--primary)",
                }}
              >
                Browse Catalog
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-all duration-300"
              >
                <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                View Cart
              </Link>
            </motion.div>
          </motion.div>

          {/* Right — Stats grid */}
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
                className="rounded-2xl p-6 flex flex-col gap-1"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <span
                  className="text-3xl font-bold"
                  style={{
                    fontFamily: "Playfair Display, Georgia, serif",
                    color: "var(--accent)",
                  }}
                >
                  {stat.value}
                </span>
                <span className="text-sm text-white/60">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent, var(--background))",
          }}
        />
      </section>

      {/* ── Featured Books ── */}
      <section className="py-20 md:py-28" style={{ background: "var(--background)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-end justify-between mb-12">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Hand-picked
                </p>
                <h2
                  className="text-4xl md:text-5xl font-bold tracking-tight text-balance"
                  style={{ color: "var(--foreground)", fontFamily: "Playfair Display, Georgia, serif" }}
                >
                  Featured Reads
                </h2>
              </div>
              <Link
                href="/catalog"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
                style={{ color: "var(--accent)" }}
              >
                View all
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>

          {booksLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden animate-pulse"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="aspect-[3/4] bg-[var(--border)]" />
                  <div className="p-4 flex flex-col gap-3">
                    <div className="h-4 rounded bg-[var(--border)] w-3/4" />
                    <div className="h-3 rounded bg-[var(--border)] w-1/2" />
                    <div className="h-3 rounded bg-[var(--border)] w-1/4" />
                    <div className="h-9 rounded-full bg-[var(--border)] mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredBooks.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-base" style={{ color: "var(--muted-foreground)" }}>
                No featured books available right now.
              </p>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
                style={{ background: "var(--accent)", color: "var(--primary)" }}
              >
                Browse all books
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {featuredBooks.map((book) => (
                <motion.div
                  key={book.id}
                  variants={fadeInUp}
                  className="group rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.10)",
                  }}
                >
                  {/* Cover */}
                  <Link href={`/book-detail?id=${book.id}`} className="block relative aspect-[3/4] overflow-hidden bg-[var(--accent-light)]">
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          `https://placehold.co/300x400/f0e6d3/5c5240?text=${encodeURIComponent(book.title)}`;
                      }}
                    />
                    {book.is_bestseller && (
                      <span
                        className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "var(--accent)", color: "var(--primary)" }}
                      >
                        Bestseller
                      </span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex flex-col flex-1 p-4 gap-2">
                    <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                      {book.genre}
                    </p>
                    <Link href={`/book-detail?id=${book.id}`}>
                      <h3
                        className="text-base font-bold leading-snug line-clamp-2 hover:underline"
                        style={{
                          fontFamily: "Playfair Display, Georgia, serif",
                          color: "var(--foreground)",
                        }}
                      >
                        {book.title}
                      </h3>
                    </Link>
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {book.author}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-auto">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3.5 h-3.5",
                            i < Math.round(book.rating)
                              ? "fill-[var(--accent)] text-[var(--accent)]"
                              : "text-[var(--border)]"
                          )}
                          aria-hidden="true"
                        />
                      ))}
                      <span className="text-xs ml-1" style={{ color: "var(--muted-foreground)" }}>
                        {book.rating?.toFixed(1)}
                      </span>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between mt-3">
                      <span
                        className="text-lg font-bold"
                        style={{
                          fontFamily: "Playfair Display, Georgia, serif",
                          color: "var(--foreground)",
                        }}
                      >
                        ${book.price?.toFixed(2)}
                      </span>
                      <Link
                        href={`/book-detail?id=${book.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105"
                        style={{ background: "var(--accent)", color: "var(--primary)" }}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
                        Add
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          <Reveal className="mt-8 sm:hidden text-center">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 text-sm font-medium"
              style={{ color: "var(--accent)" }}
            >
              View all books
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Genres Showcase ── */}
      <section
        className="py-20 md:py-28"
        style={{ background: "var(--accent-light)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--accent)" }}
              >
                Explore by genre
              </p>
              <h2
                className="text-4xl md:text-5xl font-bold tracking-tight text-balance"
                style={{ color: "var(--foreground)", fontFamily: "Playfair Display, Georgia, serif" }}
              >
                Find Your Next Read
              </h2>
            </div>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {GENRES_SHOWCASE.map((genre) => (
              <motion.div key={genre.label} variants={fadeInUp}>
                <Link
                  href={genre.href}
                  className="flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px -4px rgba(0,0,0,0.08)",
                  }}
                >
                  <span className="text-3xl" aria-hidden="true">{genre.emoji}</span>
                  <div>
                    <p
                      className="font-semibold text-sm leading-tight"
                      style={{ color: "var(--foreground)" }}
                    >
                      {genre.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {genre.count.toLocaleString("en-US")} titles
                    </p>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ color: "var(--accent)" }}
                    aria-hidden="true"
                  />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Value Props ── */}
      <section className="py-20 md:py-28" style={{ background: "var(--primary)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--accent)" }}
              >
                Why PageTurner
              </p>
              <h2
                className="text-4xl md:text-5xl font-bold tracking-tight text-white text-balance"
                style={{ fontFamily: "Playfair Display, Georgia, serif" }}
              >
                Reading, Made Easy
              </h2>
            </div>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {VALUE_PROPS.map((vp) => {
              const Icon = vp.icon;
              return (
                <motion.div
                  key={vp.title}
                  variants={fadeInUp}
                  className="flex flex-col gap-4 p-6 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(200,169,110,0.15)" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "var(--accent)" }} aria-hidden="true" />
                  </div>
                  <div>
                    <h3
                      className="text-base font-semibold text-white mb-1"
                      style={{ fontFamily: "Playfair Display, Georgia, serif" }}
                    >
                      {vp.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-white/60">{vp.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 md:py-28" style={{ background: "var(--background)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--accent)" }}
              >
                Reader stories
              </p>
              <h2
                className="text-4xl md:text-5xl font-bold tracking-tight text-balance"
                style={{ color: "var(--foreground)", fontFamily: "Playfair Display, Georgia, serif" }}
              >
                Loved by Readers
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
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.id}
                variants={fadeInUp}
                className="flex flex-col gap-4 p-6 rounded-2xl"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.10)",
                }}
              >
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-[var(--accent)] text-[var(--accent)]"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p
                  className="text-sm leading-relaxed flex-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-9 h-9 rounded-full"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {t.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {t.location}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <Reveal>
        <section
          className="py-20 md:py-28 relative overflow-hidden"
          style={{ background: "var(--accent)" }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 0%, transparent 60%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)",
            }}
          />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <BookOpen
              className="w-12 h-12 mx-auto mb-6"
              style={{ color: "var(--primary)" }}
              aria-hidden="true"
            />
            <h2
              className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-balance"
              style={{ color: "var(--primary)", fontFamily: "Playfair Display, Georgia, serif" }}
            >
              Start Your Next Chapter
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: "rgba(26,26,46,0.75)" }}>
              Join over 120,000 readers who trust PageTurner for their next great read. Free shipping on orders over ${FREE_SHIPPING_THRESHOLD}.
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: "var(--primary)", color: "white" }}
            >
              Browse the Catalog
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
