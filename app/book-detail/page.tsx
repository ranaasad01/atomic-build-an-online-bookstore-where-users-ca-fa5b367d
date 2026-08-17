"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Star, ShoppingCart, Heart, Share2, ChevronRight, BookOpen, Award, Truck, RotateCcw, Check, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import type { Book } from "@/lib/data";

const FEATURED_BOOK: Book = {
  id: "the-midnight-library",
  title: "The Midnight Library",
  author: "Matt Haig",
  description:
    "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be if you had made other choices. Would you have done anything different, if you had the chance to undo your regrets? A dazzling novel about all the choices that go into a life well lived, from the internationally bestselling author of Reasons to Stay Alive and How To Stop Time.",
  genre: "Fiction",
  price: 16.99,
  coverImage: "/images/midnight-library-book-cover.jpg",
  isbn: "978-0525559474",
  publisher: "Viking",
  publishedAt: "2020-09-29",
  stockQuantity: 42,
  isFeatured: true,
  isBestseller: true,
  rating: 4.4,
};

const RELATED_BOOKS: Book[] = [
  {
    id: "anxious-people",
    title: "Anxious People",
    author: "Fredrik Backman",
    description: "A bank robber, a hostage situation, and a bridge. A story about the human condition.",
    genre: "Fiction",
    price: 14.99,
    coverImage: "/images/anxious-people-book-cover.jpg",
    stockQuantity: 18,
    isFeatured: false,
    isBestseller: true,
    rating: 4.3,
  },
  {
    id: "a-man-called-ove",
    title: "A Man Called Ove",
    author: "Fredrik Backman",
    description: "A grumpy yet loveable man finds his solitary world turned on its head when a young family moves in next door.",
    genre: "Fiction",
    price: 13.99,
    coverImage: "/images/a-man-called-ove-book-cover.jpg",
    stockQuantity: 25,
    isFeatured: false,
    isBestseller: false,
    rating: 4.6,
  },
  {
    id: "the-alchemist",
    title: "The Alchemist",
    author: "Paulo Coelho",
    description: "A magical story about following your dreams and listening to your heart.",
    genre: "Fiction",
    price: 12.99,
    coverImage: "/images/the-alchemist-book-cover.jpg",
    stockQuantity: 55,
    isFeatured: true,
    isBestseller: true,
    rating: 4.2,
  },
  {
    id: "piranesi",
    title: "Piranesi",
    author: "Susanna Clarke",
    description: "A mysterious man lives in a labyrinthine house with infinite halls and tidal seas.",
    genre: "Fantasy",
    price: 15.99,
    coverImage: "/images/piranesi-book-cover.jpg",
    stockQuantity: 12,
    isFeatured: false,
    isBestseller: false,
    rating: 4.5,
  },
];

const REVIEWS = [
  {
    id: "r1",
    name: "Sarah M.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah%20M.",
    rating: 5,
    date: "March 12, 2024",
    title: "A life-changing read",
    body: "This book arrived at exactly the right moment in my life. Haig's writing is both profound and accessible, weaving philosophy into a story that genuinely moved me to tears. I finished it in two sittings and immediately bought copies for three friends.",
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
    body: "I read this in one sitting on a rainy Sunday. The premise sounds simple but the depth Haig brings to each alternate life Nora explores is remarkable. It made me appreciate my own choices in a completely new way.",
  },
];

const BOOK_DETAILS = [
  { label: "ISBN", value: "978-0525559474" },
  { label: "Publisher", value: "Viking" },
  { label: "Published", value: "September 29, 2020" },
  { label: "Pages", value: "304" },
  { label: "Language", value: "English" },
  { label: "Genre", value: "Fiction" },
];

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const starSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            starSize,
            star <= Math.floor(rating)
              ? "fill-[var(--accent)] text-[var(--accent)]"
              : star - 0.5 <= rating
              ? "fill-[var(--accent)]/50 text-[var(--accent)]"
              : "fill-transparent text-[hsl(var(--muted-foreground))]"
          )}
        />
      ))}
    </div>
  );
}

export default function BookDetailPage() {
  const t = useTranslations();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "details" | "reviews">("description");

  const book = FEATURED_BOOK;

  function handleAddToCart() {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  function incrementQty() {
    setQuantity((q) => Math.min(q + 1, book.stockQuantity));
  }

  function decrementQty() {
    setQuantity((q) => Math.max(q - 1, 1));
  }

  return (
    <main className="min-h-screen bg-[hsl(var(--background))]">
      {/* Breadcrumb */}
      <Reveal>
        <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
              <Link href="/" className="hover:text-[hsl(var(--foreground))] transition-colors">
                {t("bookDetail.breadcrumb.home")}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href="/catalog" className="hover:text-[hsl(var(--foreground))] transition-colors">
                {t("bookDetail.breadcrumb.browse")}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href="/catalog?genre=Fiction" className="hover:text-[hsl(var(--foreground))] transition-colors">
                {t("bookDetail.breadcrumb.fiction")}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-[hsl(var(--foreground))] font-medium truncate max-w-[200px]">
                {book.title}
              </span>
            </nav>
          </div>
        </div>
      </Reveal>

      {/* Main Product Section */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
          {/* Cover Image */}
          <Reveal className="flex flex-col gap-4">
            <motion.div
              className="relative mx-auto w-full max-w-[320px] lg:max-w-none"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {book.isBestseller && (
                <div className="absolute -top-3 -right-3 z-10 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-black shadow-md">
                  {t("bookDetail.badge.bestseller")}
                </div>
              )}
              <div className="overflow-hidden rounded-2xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.28)] ring-1 ring-black/10">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full object-cover aspect-[2/3]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop";
                  }}
                />
              </div>
            </motion.div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Truck, label: t("bookDetail.trust.shipping") },
                { icon: RotateCcw, label: t("bookDetail.trust.returns") },
                { icon: Award, label: t("bookDetail.trust.authentic") },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3"
                >
                  <Icon className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                  <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Book Info & Purchase */}
          <Reveal delay={0.1}>
            <div className="flex flex-col gap-6">
              {/* Genre pill */}
              <div>
                <span className="inline-block rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)] tracking-wide uppercase">
                  {book.genre}
                </span>
              </div>

              {/* Title & Author */}
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl leading-tight">
                  {book.title}
                </h1>
                <p className="mt-2 text-lg text-[hsl(var(--muted-foreground))]">
                  {t("bookDetail.byAuthor", { author: book.author })}
                </p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <StarRating rating={book.rating} size="lg" />
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  {book.rating.toFixed(1)}
                </span>
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  {t("bookDetail.reviewCount", { count: REVIEWS.length })}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-[hsl(var(--foreground))]">
                  ${book.price.toFixed(2)}
                </span>
                <span className="text-base text-[hsl(var(--muted-foreground))] line-through">
                  ${(book.price * 1.25).toFixed(2)}
                </span>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  {t("bookDetail.discount", { pct: "20%" })}
                </span>
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    book.stockQuantity > 10
                      ? "bg-green-500"
                      : book.stockQuantity > 0
                      ? "bg-amber-500"
                      : "bg-red-500"
                  )}
                />
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  {book.stockQuantity > 10
                    ? t("bookDetail.stock.inStock")
                    : book.stockQuantity > 0
                    ? t("bookDetail.stock.lowStock", { count: book.stockQuantity })
                    : t("bookDetail.stock.outOfStock")}
                </span>
              </div>

              {/* Quantity + Add to Cart */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Quantity selector */}
                <div className="flex items-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
                  <button
                    onClick={decrementQty}
                    disabled={quantity <= 1}
                    aria-label={t("bookDetail.qty.decrease")}
                    className="flex h-11 w-11 items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-[hsl(var(--foreground))]">
                    {quantity}
                  </span>
                  <button
                    onClick={incrementQty}
                    disabled={quantity >= book.stockQuantity}
                    aria-label={t("bookDetail.qty.increase")}
                    className="flex h-11 w-11 items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Add to Cart */}
                <motion.button
                  onClick={handleAddToCart}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300",
                    addedToCart
                      ? "bg-green-600 text-white"
                      : "bg-[var(--accent)] text-black hover:brightness-110"
                  )}
                >
                  {addedToCart ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t("bookDetail.cta.added")}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      {t("bookDetail.cta.addToCart")}
                    </>
                  )}
                </motion.button>

                {/* Wishlist */}
                <motion.button
                  onClick={() => setWishlisted((w) => !w)}
                  whileTap={{ scale: 0.92 }}
                  aria-label={t("bookDetail.cta.wishlist")}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-colors hover:border-rose-400"
                >
                  <Heart
                    className={cn(
                      "h-5 w-5 transition-colors",
                      wishlisted ? "fill-rose-500 text-rose-500" : "text-[hsl(var(--muted-foreground))]"
                    )}
                  />
                </motion.button>

                {/* Share */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  aria-label={t("bookDetail.cta.share")}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-colors hover:border-[var(--accent)]/50"
                >
                  <Share2 className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                </motion.button>
              </div>

              {/* Buy Now */}
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-[hsl(var(--foreground))]/20 bg-transparent px-6 py-3 text-sm font-semibold text-[hsl(var(--foreground))] transition-all hover:border-[hsl(var(--foreground))]/50 hover:bg-[hsl(var(--muted))]/30"
              >
                {t("bookDetail.cta.buyNow")}
              </Link>

              {/* Shipping note */}
              <p className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <Truck className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                {t("bookDetail.shippingNote")}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Tabs: Description / Details / Reviews */}
      <Reveal>
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          {/* Tab bar */}
          <div className="flex gap-1 border-b border-[hsl(var(--border))] mb-8">
            {(["description", "details", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px",
                  activeTab === tab
                    ? "border-[var(--accent)] text-[hsl(var(--foreground))]"
                    : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {t(`bookDetail.tabs.${tab}`)}
              </button>
            ))}
          </div>

          {/* Description */}
          {activeTab === "description" && (
            <motion.div
              key="description"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="max-w-3xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
                  {t("bookDetail.description.heading")}
                </h2>
              </div>
              <p className="text-[hsl(var(--muted-foreground))] leading-relaxed text-base">
                {book.description}
              </p>
              <p className="mt-4 text-[hsl(var(--muted-foreground))] leading-relaxed text-base">
                {t("bookDetail.description.extra")}
              </p>
            </motion.div>
          )}

          {/* Details */}
          {activeTab === "details" && (
            <motion.div
              key="details"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="max-w-xl"
            >
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4">
                {t("bookDetail.details.heading")}
              </h2>
              <dl className="divide-y divide-[hsl(var(--border))] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
                {BOOK_DETAILS.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-3.5">
                    <dt className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{label}</dt>
                    <dd className="text-sm font-semibold text-[hsl(var(--foreground))]">{value}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          )}

          {/* Reviews */}
          {activeTab === "reviews" && (
            <motion.div
              key="reviews"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="max-w-3xl"
            >
              {/* Summary */}
              <div className="mb-8 flex items-center gap-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                <div className="text-center">
                  <p className="text-5xl font-bold text-[hsl(var(--foreground))]">
                    {book.rating.toFixed(1)}
                  </p>
                  <StarRating rating={book.rating} size="sm" />
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    {t("bookDetail.reviews.basedOn", { count: REVIEWS.length })}
                  </p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = REVIEWS.filter((r) => r.rating === star).length;
                    const pct = Math.round((count / REVIEWS.length) * 100);
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="w-3 text-xs text-[hsl(var(--muted-foreground))]">{star}</span>
                        <Star className="h-3 w-3 fill-[var(--accent)] text-[var(--accent)]" aria-hidden="true" />
                        <div className="flex-1 h-1.5 rounded-full bg-[hsl(var(--muted))]/40 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--accent)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-6 text-xs text-[hsl(var(--muted-foreground))]">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual reviews */}
              <div className="space-y-5">
                {REVIEWS.map((review, i) => (
                  <motion.article
                    key={review.id}
                    variants={fadeInUp}
                    className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-[hsl(var(--border))]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=random`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-semibold text-[hsl(var(--foreground))]">{review.name}</p>
                          <time className="text-xs text-[hsl(var(--muted-foreground))]">{review.date}</time>
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                        <h3 className="mt-2 font-semibold text-[hsl(var(--foreground))] text-sm">
                          {review.title}
                        </h3>
                        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                          {review.body}
                        </p>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          )}
        </section>
      </Reveal>

      {/* Related Books */}
      <Reveal>
        <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                {t("bookDetail.related.heading")}
              </h2>
              <Link
                href="/catalog"
                className="flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
              >
                {t("bookDetail.related.viewAll")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {RELATED_BOOKS.map((relBook) => (
                <motion.div key={relBook.id} variants={scaleIn}>
                  <Link href={`/book-detail`} className="group block">
                    <div className="overflow-hidden rounded-xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.15)] ring-1 ring-black/5 transition-shadow group-hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.22)]">
                      <img
                        src={relBook.coverImage}
                        alt={relBook.title}
                        className="w-full object-cover aspect-[2/3] transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop";
                        }}
                      />
                    </div>
                    <div className="mt-3 px-0.5">
                      <p className="font-semibold text-sm text-[hsl(var(--foreground))] leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                        {relBook.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                        {relBook.author}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <StarRating rating={relBook.rating} size="sm" />
                        <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                          ${relBook.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </Reveal>

      {/* Back to catalog */}
      <Reveal>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("bookDetail.backToCatalog")}
          </Link>
        </div>
      </Reveal>
    </main>
  );
}