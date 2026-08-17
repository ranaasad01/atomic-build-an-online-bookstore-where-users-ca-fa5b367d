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

// ─── Inline mock data ────────────────────────────────────────────────────────

const FEATURED_BOOKS = [
  {
    id: "1",
    title: "The Midnight Library",
    author: "Matt Haig",
    price: 16.99,
    rating: 4.8,
    genre: "Fiction",
    coverImage: "/images/midnight-library-book-cover.jpg",
    isBestseller: true,
  },
  {
    id: "2",
    title: "Atomic Habits",
    author: "James Clear",
    price: 18.99,
    rating: 4.9,
    genre: "Self-Help",
    coverImage: "/images/atomic-habits-book-cover.jpg",
    isBestseller: true,
  },
  {
    id: "3",
    title: "Project Hail Mary",
    author: "Andy Weir",
    price: 15.99,
    rating: 4.9,
    genre: "Science Fiction",
    coverImage: "/images/project-hail-mary-book-cover.jpg",
    isBestseller: false,
  },
  {
    id: "4",
    title: "Lessons in Chemistry",
    author: "Bonnie Garmus",
    price: 17.99,
    rating: 4.7,
    genre: "Literary Fiction",
    coverImage: "/images/lessons-in-chemistry-book-cover.jpg",
    isBestseller: true,
  },
];

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
  { value: "200k+", label: "Happy readers" },
  { value: "98%", label: "On-time delivery" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3.5 w-3.5",
            star <= Math.round(rating)
              ? "fill-[var(--brand-amber)] text-[var(--brand-amber)]"
              : "fill-transparent text-[hsl(var(--muted-foreground))]"
          )}
        />
      ))}
      <span className="ml-1 text-xs text-[hsl(var(--muted-foreground))]">{rating}</span>
    </div>
  );
}

function BookCard({ book }: { book: (typeof FEATURED_BOOKS)[number] }) {
  const t = useTranslations();
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative flex flex-col rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.06),0_16px_40px_-12px_rgba(0,0,0,0.16)] transition-shadow duration-300"
    >
      {book.isBestseller && (
        <span className="absolute top-3 left-3 z-10 rounded-full bg-[var(--brand-primary)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          {t("home.bestseller")}
        </span>
      )}
      <Link href={`/book/${book.id}`} className="block aspect-[2/3] overflow-hidden bg-[hsl(var(--muted))]">
        <img
          src={book.coverImage}
          alt={book.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop";
          }}
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--brand-primary)]">
          {book.genre}
        </span>
        <Link href={`/book/${book.id}`}>
          <h3 className="font-semibold leading-snug text-[hsl(var(--foreground))] line-clamp-2 hover:text-[var(--brand-primary)] transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{book.author}</p>
        <StarRating rating={book.rating} />
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-[hsl(var(--foreground))]">
            ${book.price.toFixed(2)}
          </span>
          <Link
            href={`/book/${book.id}`}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--brand-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {t("home.addToCart")}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="flex flex-col">
      {/* ── Hero ── */}
      <Reveal>
        <section
          id="hero"
          className="relative overflow-hidden bg-[hsl(var(--background))] px-4 pb-20 pt-16 md:pb-28 md:pt-24"
        >
          {/* Background glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 60% 0%, var(--brand-glow) 0%, transparent 70%)",
            }}
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Copy */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              className="flex flex-col gap-6"
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/10 px-4 py-1.5 text-sm font-medium text-[var(--brand-primary)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("home.hero.badge")}
                </span>
              </motion.div>
              <motion.h1
                variants={fadeInUp}
                className="text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] text-balance md:text-5xl lg:text-6xl"
              >
                {t("home.hero.headline")}
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                className="max-w-lg text-lg leading-relaxed text-[hsl(var(--muted-foreground))] text-pretty"
              >
                {t("home.hero.subheadline")}
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-all duration-200 hover:bg-[var(--brand-primary-dark)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
                >
                  {t("home.hero.cta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-3 font-semibold text-[hsl(var(--foreground))] transition-all duration-200 hover:bg-[hsl(var(--muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2"
                >
                  {t("home.hero.secondary")}
                </Link>
              </motion.div>
              {/* Mini stats */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap gap-6 pt-2"
              >
                {STATS.map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <span className="text-2xl font-bold text-[hsl(var(--foreground))]">
                      {s.value}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {s.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero visual — stacked book covers */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              className="relative hidden lg:flex items-center justify-center"
            >
              <div className="relative h-[480px] w-[420px]">
                {FEATURED_BOOKS.slice(0, 3).map((book, i) => (
                  <motion.div
                    key={book.id}
                    whileHover={{ scale: 1.04, zIndex: 10 }}
                    transition={{ duration: 0.25 }}
                    className="absolute rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-white/10"
                    style={{
                      width: 180,
                      height: 270,
                      top: i === 0 ? 40 : i === 1 ? 120 : 200,
                      left: i === 0 ? 20 : i === 1 ? 130 : 220,
                      rotate: i === 0 ? -6 : i === 1 ? 2 : 8,
                      zIndex: i + 1,
                    }}
                  >
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop";
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── Featured Books ── */}
      <Reveal>
        <section
          id="featured"
          className="bg-[hsl(var(--muted))]/40 px-4 py-20 md:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <span className="mb-2 block text-sm font-semibold uppercase tracking-widest text-[var(--brand-primary)]">
                  {t("home.featured.eyebrow")}
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] md:text-4xl">
                  {t("home.featured.heading")}
                </h2>
              </div>
              <Link
                href="/catalog"
                className="hidden items-center gap-1 text-sm font-medium text-[var(--brand-primary)] hover:underline sm:flex"
              >
                {t("home.featured.viewAll")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {FEATURED_BOOKS.map((book, i) => (
                <motion.div key={book.id} variants={fadeInUp} custom={i}>
                  <BookCard book={book} />
                </motion.div>
              ))}
            </motion.div>
            <div className="mt-8 flex justify-center sm:hidden">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-primary)] hover:underline"
              >
                {t("home.featured.viewAll")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Genre Showcase ── */}
      <Reveal>
        <section
          id="genres"
          className="bg-[hsl(var(--background))] px-4 py-20 md:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <span className="mb-2 block text-sm font-semibold uppercase tracking-widest text-[var(--brand-primary)]">
                {t("home.genres.eyebrow")}
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] md:text-4xl">
                {t("home.genres.heading")}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-[hsl(var(--muted-foreground))]">
                {t("home.genres.subheading")}
              </p>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
            >
              {GENRES_SHOWCASE.map((genre, i) => (
                <motion.div key={genre.label} variants={scaleIn} custom={i}>
                  <Link
                    href={genre.href}
                    className="group flex flex-col items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-all duration-200 hover:border-[var(--brand-primary)]/40 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.14)] hover:-translate-y-1"
                  >
                    <span className="text-3xl" role="img" aria-label={genre.label}>
                      {genre.emoji}
                    </span>
                    <span className="text-sm font-semibold text-[hsl(var(--foreground))] leading-tight">
                      {genre.label}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {genre.count.toLocaleString("en-US")} {t("home.genres.titles")}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── Value Props ── */}
      <Reveal>
        <section
          id="about"
          className="bg-[var(--brand-primary)] px-4 py-20 md:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <span className="mb-2 block text-sm font-semibold uppercase tracking-widest text-white/70">
                {t("home.values.eyebrow")}
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                {t("home.values.heading")}
              </h2>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {VALUE_PROPS.map((vp, i) => (
                <motion.div
                  key={vp.title}
                  variants={fadeInUp}
                  custom={i}
                  className="flex flex-col gap-4 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                    <vp.icon className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-white">{vp.title}</h3>
                  <p className="text-sm leading-relaxed text-white/80">{vp.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── Testimonials ── */}
      <Reveal>
        <section
          id="testimonials"
          className="bg-[hsl(var(--muted))]/40 px-4 py-20 md:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <span className="mb-2 block text-sm font-semibold uppercase tracking-widest text-[var(--brand-primary)]">
                {t("home.testimonials.eyebrow")}
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] md:text-4xl">
                {t("home.testimonials.heading")}
              </h2>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 gap-6 md:grid-cols-3"
            >
              {TESTIMONIALS.map((t_item, i) => (
                <motion.div
                  key={t_item.id}
                  variants={fadeInUp}
                  custom={i}
                  className="flex flex-col gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]"
                >
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className="h-4 w-4 fill-[var(--brand-amber)] text-[var(--brand-amber)]"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                    &ldquo;{t_item.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 border-t border-[hsl(var(--border))] pt-4">
                    <img
                      src={t_item.avatar}
                      alt={t_item.name}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-[hsl(var(--border))]"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(t_item.name)}&background=random`;
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        {t_item.name}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {t_item.location}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* ── CTA Banner ── */}
      <Reveal>
        <section
          id="cta"
          className="bg-[hsl(var(--background))] px-4 py-20 md:py-28"
        >
          <div className="mx-auto max-w-3xl text-center">
            <div className="relative overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-8 py-14 shadow-[0_2px_4px_rgba(0,0,0,0.04),0_16px_48px_-12px_rgba(0,0,0,0.12)] md:px-16">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 60% at 50% 0%, var(--brand-glow) 0%, transparent 80%)",
                }}
              />
              <BookOpen
                className="mx-auto mb-5 h-12 w-12 text-[var(--brand-primary)]"
                aria-hidden="true"
              />
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] text-balance md:text-4xl">
                {t("home.cta.heading")}
              </h2>
              <p className="mb-8 text-[hsl(var(--muted-foreground))] text-pretty">
                {t("home.cta.body")}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-7 py-3 font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-all duration-200 hover:bg-[var(--brand-primary-dark)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
                >
                  {t("home.cta.button")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-5 text-xs text-[hsl(var(--muted-foreground))]">
                {t("home.cta.footnote")}
              </p>
            </div>
          </div>
        </section>
      </Reveal>
    </main>
  );
}