"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, SlidersHorizontal, Star, ShoppingCart, X, ChevronDown, BookOpen, Filter } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { GENRES } from "@/lib/data";

const BOOKS = [
  {
    id: "1",
    title: "The Midnight Library",
    author: "Matt Haig",
    genre: "Fiction",
    price: 16.99,
    rating: 4.7,
    ratingCount: 2841,
    coverImage: "/images/midnight-library-book-cover.jpg",
    isBestseller: true,
    isFeatured: false,
    description: "Between life and death there is a library, and within that library, the shelves go on forever.",
    stockQuantity: 24,
  },
  {
    id: "2",
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Self-Help",
    price: 18.99,
    rating: 4.9,
    ratingCount: 5120,
    coverImage: "/images/atomic-habits-book-cover.jpg",
    isBestseller: true,
    isFeatured: true,
    description: "An easy and proven way to build good habits and break bad ones.",
    stockQuantity: 40,
  },
  {
    id: "3",
    title: "Project Hail Mary",
    author: "Andy Weir",
    genre: "Science Fiction",
    price: 17.99,
    rating: 4.8,
    ratingCount: 3302,
    coverImage: "/images/project-hail-mary-book-cover.jpg",
    isBestseller: false,
    isFeatured: true,
    description: "A lone astronaut must save the earth from disaster in this propulsive science thriller.",
    stockQuantity: 18,
  },
  {
    id: "4",
    title: "The Thursday Murder Club",
    author: "Richard Osman",
    genre: "Mystery & Thriller",
    price: 14.99,
    rating: 4.5,
    ratingCount: 1987,
    coverImage: "/images/thursday-murder-club-book-cover.jpg",
    isBestseller: false,
    isFeatured: false,
    description: "Four unlikely friends meet weekly to investigate cold cases. Then a real murder occurs.",
    stockQuantity: 12,
  },
  {
    id: "5",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    genre: "History",
    price: 19.99,
    rating: 4.6,
    ratingCount: 4450,
    coverImage: "/images/sapiens-history-book-cover.jpg",
    isBestseller: true,
    isFeatured: false,
    description: "A brief history of humankind, from the Stone Age to the twenty-first century.",
    stockQuantity: 30,
  },
  {
    id: "6",
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    genre: "Fantasy",
    price: 15.99,
    rating: 4.8,
    ratingCount: 3780,
    coverImage: "/images/name-of-the-wind-fantasy-book.jpg",
    isBestseller: false,
    isFeatured: true,
    description: "The riveting first-person narrative of Kvothe, a legendary figure in a world of magic.",
    stockQuantity: 9,
  },
  {
    id: "7",
    title: "Educated",
    author: "Tara Westover",
    genre: "Memoir",
    price: 16.49,
    rating: 4.7,
    ratingCount: 3100,
    coverImage: "/images/educated-memoir-book-cover.jpg",
    isBestseller: true,
    isFeatured: false,
    description: "A memoir about a young woman who, kept out of school, leaves her survivalist family.",
    stockQuantity: 22,
  },
  {
    id: "8",
    title: "The Hitchhiker's Guide to the Galaxy",
    author: "Douglas Adams",
    genre: "Science Fiction",
    price: 13.99,
    rating: 4.8,
    ratingCount: 6200,
    coverImage: "/images/hitchhikers-guide-galaxy-book.jpg",
    isBestseller: false,
    isFeatured: false,
    description: "Seconds before Earth is demolished, Arthur Dent is whisked off into space.",
    stockQuantity: 35,
  },
  {
    id: "9",
    title: "Normal People",
    author: "Sally Rooney",
    genre: "Literary Fiction",
    price: 15.49,
    rating: 4.3,
    ratingCount: 2200,
    coverImage: "/images/normal-people-literary-fiction.jpg",
    isBestseller: false,
    isFeatured: false,
    description: "A story of mutual fascination, friendship and love between two young people in Ireland.",
    stockQuantity: 16,
  },
  {
    id: "10",
    title: "Becoming",
    author: "Michelle Obama",
    genre: "Biography",
    price: 21.99,
    rating: 4.9,
    ratingCount: 7800,
    coverImage: "/images/becoming-michelle-obama-biography.jpg",
    isBestseller: true,
    isFeatured: true,
    description: "An intimate, powerful, and inspiring memoir by the former First Lady of the United States.",
    stockQuantity: 28,
  },
  {
    id: "11",
    title: "The Alchemist",
    author: "Paulo Coelho",
    genre: "Fiction",
    price: 12.99,
    rating: 4.6,
    ratingCount: 9100,
    coverImage: "/images/the-alchemist-paulo-coelho.jpg",
    isBestseller: true,
    isFeatured: false,
    description: "A magical story about following your dreams and listening to your heart.",
    stockQuantity: 50,
  },
  {
    id: "12",
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    genre: "Mystery & Thriller",
    price: 17.49,
    rating: 4.7,
    ratingCount: 5500,
    coverImage: "/images/where-crawdads-sing-mystery.jpg",
    isBestseller: true,
    isFeatured: true,
    description: "A coming-of-age story and a murder mystery set in the marshes of North Carolina.",
    stockQuantity: 20,
  },
  {
    id: "13",
    title: "Dune",
    author: "Frank Herbert",
    genre: "Science Fiction",
    price: 18.49,
    rating: 4.8,
    ratingCount: 8400,
    coverImage: "/images/dune-frank-herbert-scifi.jpg",
    isBestseller: true,
    isFeatured: false,
    description: "Set in the distant future, a noble family becomes embroiled in a war for a desert planet.",
    stockQuantity: 33,
  },
  {
    id: "14",
    title: "The Body Keeps the Score",
    author: "Bessel van der Kolk",
    genre: "Non-Fiction",
    price: 20.99,
    rating: 4.8,
    ratingCount: 4100,
    coverImage: "/images/body-keeps-score-nonfiction.jpg",
    isBestseller: false,
    isFeatured: false,
    description: "How trauma reshapes body and brain, and innovative treatments for recovery.",
    stockQuantity: 14,
  },
  {
    id: "15",
    title: "A Court of Thorns and Roses",
    author: "Sarah J. Maas",
    genre: "Fantasy",
    price: 16.99,
    rating: 4.6,
    ratingCount: 6700,
    coverImage: "/images/court-thorns-roses-fantasy.jpg",
    isBestseller: true,
    isFeatured: false,
    description: "A young huntress is taken to a magical land after killing a wolf in the woods.",
    stockQuantity: 27,
  },
  {
    id: "16",
    title: "The Great Alone",
    author: "Kristin Hannah",
    genre: "Historical Fiction",
    price: 15.99,
    rating: 4.6,
    ratingCount: 2900,
    coverImage: "/images/the-great-alone-historical-fiction.jpg",
    isBestseller: false,
    isFeatured: false,
    description: "A family moves to the Alaskan wilderness, where isolation tests their bonds.",
    stockQuantity: 11,
  },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "bestseller", label: "Bestsellers" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "title", label: "Title A-Z" },
];

const PRICE_RANGES = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under $15", min: 0, max: 15 },
  { label: "$15 to $18", min: 15, max: 18 },
  { label: "$18 and above", min: 18, max: Infinity },
];

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-3.5 w-3.5",
              star <= Math.round(rating)
                ? "fill-[var(--brand-accent)] text-[var(--brand-accent)]"
                : "fill-transparent text-[hsl(var(--muted-foreground))]"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-[hsl(var(--muted-foreground))]">
        {rating.toFixed(1)} ({count.toLocaleString("en-US")})
      </span>
    </div>
  );
}

function BookCard({ book, onAddToCart }: { book: typeof BOOKS[0]; onAddToCart: (book: typeof BOOKS[0]) => void }) {
  const t = useTranslations();
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 40px -8px rgba(0,0,0,0.18)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative flex flex-col rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]"
    >
      {(book.isBestseller || book.isFeatured) && (
        <div className="absolute top-3 left-3 z-10 flex gap-1.5">
          {book.isBestseller && (
            <span className="rounded-full bg-[var(--brand-accent)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black">
              {t("catalog.badge.bestseller")}
            </span>
          )}
          {book.isFeatured && (
            <span className="rounded-full bg-[hsl(var(--primary))] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--primary-foreground))]">
              {t("catalog.badge.featured")}
            </span>
          )}
        </div>
      )}

      <Link href={`/book/${book.id}`} className="block overflow-hidden bg-[hsl(var(--muted))]">
        <div className="relative h-56 w-full overflow-hidden">
          <img
            src={book.coverImage}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.classList.add("flex", "items-center", "justify-center");
                const placeholder = document.createElement("div");
                placeholder.className = "flex flex-col items-center gap-2 text-[hsl(var(--muted-foreground))]";
                placeholder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><span style="font-size:12px">${book.title}</span>`;
                parent.appendChild(placeholder);
              }
            }}
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          <span className="mb-1.5 inline-block rounded-full border border-[hsl(var(--border))] px-2.5 py-0.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
            {book.genre}
          </span>
          <Link href={`/book/${book.id}`}>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[hsl(var(--foreground))] hover:text-[var(--brand-accent)] transition-colors">
              {book.title}
            </h3>
          </Link>
          <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{book.author}</p>
        </div>

        <StarRating rating={book.rating} count={book.ratingCount} />

        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-[hsl(var(--foreground))]">
            ${book.price.toFixed(2)}
          </span>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => onAddToCart(book)}
            disabled={book.stockQuantity === 0}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200",
              book.stockQuantity === 0
                ? "cursor-not-allowed bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                : "bg-[var(--brand-accent)] text-black hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2"
            )}
            aria-label={t("catalog.addToCart")}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {book.stockQuantity === 0 ? t("catalog.outOfStock") : t("catalog.addToCart")}
          </motion.button>
        </div>

        {book.stockQuantity > 0 && book.stockQuantity <= 10 && (
          <p className="text-[10px] font-medium text-orange-500">
            {t("catalog.lowStock", { count: book.stockQuantity })}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function BrowseCatalogPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [priceRangeIndex, setPriceRangeIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [addedBookId, setAddedBookId] = useState<string | null>(null);

  const CATALOG_GENRES = ["All", ...GENRES.filter((g) =>
    BOOKS.some((b) => b.genre === g)
  )];

  const handleAddToCart = useCallback((book: typeof BOOKS[0]) => {
    setCartCount((prev) => prev + 1);
    setAddedBookId(book.id);
    setTimeout(() => setAddedBookId(null), 1500);
  }, []);

  const filtered = useMemo(() => {
    let result = [...BOOKS];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.genre.toLowerCase().includes(q)
      );
    }

    if (activeGenre !== "All") {
      result = result.filter((b) => b.genre === activeGenre);
    }

    const range = PRICE_RANGES[priceRangeIndex];
    result = result.filter((b) => b.price >= range.min && b.price < range.max);

    switch (sortBy) {
      case "bestseller":
        result = result.filter((b) => b.isBestseller).concat(result.filter((b) => !b.isBestseller));
        break;
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "featured":
      default:
        result = result.filter((b) => b.isFeatured).concat(result.filter((b) => !b.isFeatured));
        break;
    }

    return result;
  }, [searchQuery, activeGenre, sortBy, priceRangeIndex]);

  return (
    <main className="min-h-screen bg-[hsl(var(--background))]">
      {/* Page Header */}
      <Reveal>
        <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-12 md:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-widest">
                    {t("catalog.eyebrow")}
                  </span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] md:text-5xl">
                  {t("catalog.heading")}
                </h1>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {t("catalog.subheading")}
                </p>
              </div>
              <Link
                href="/cart"
                className="relative mt-4 inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-all hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)] md:mt-0"
              >
                <ShoppingCart className="h-4 w-4" />
                {t("catalog.viewCart")}
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-accent)] text-[10px] font-bold text-black"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Search + Sort Bar */}
        <Reveal>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("catalog.searchPlaceholder")}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2.5 pl-10 pr-10 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[var(--brand-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  aria-label={t("catalog.clearSearch")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                  showFilters
                    ? "border-[var(--brand-accent)] bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:border-[var(--brand-accent)]"
                )}
              >
                <Filter className="h-4 w-4" />
                {t("catalog.filters")}
              </button>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2.5 pl-4 pr-9 text-sm font-medium text-[hsl(var(--foreground))] focus:border-[var(--brand-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20 transition-all cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              </div>
            </div>
          </div>
        </Reveal>

        {/* Filter Panel */}
        {showFilters && (
          <Reveal>
            <div className="mb-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]">
              <div className="flex flex-col gap-5 md:flex-row md:gap-10">
                <div className="flex-1">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                    {t("catalog.filterByPrice")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PRICE_RANGES.map((range, i) => (
                      <button
                        key={range.label}
                        onClick={() => setPriceRangeIndex(i)}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                          priceRangeIndex === i
                            ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-black"
                            : "border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:border-[var(--brand-accent)]"
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => {
                      setActiveGenre("All");
                      setPriceRangeIndex(0);
                      setSearchQuery("");
                      setSortBy("featured");
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--foreground))] hover:text-[hsl(var(--foreground))] transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                    {t("catalog.clearFilters")}
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {/* Genre Tabs */}
        <Reveal>
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATALOG_GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200",
                  activeGenre === genre
                    ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-black"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:border-[var(--brand-accent)] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {genre}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Results Count */}
        <Reveal>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {filtered.length === 0
                ? t("catalog.noResults")
                : t("catalog.resultCount", { count: filtered.length })}
            </p>
            {(activeGenre !== "All" || searchQuery || priceRangeIndex !== 0) && (
              <div className="flex flex-wrap items-center gap-2">
                {activeGenre !== "All" && (
                  <span className="flex items-center gap-1 rounded-full bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/30 px-3 py-1 text-xs font-medium text-[var(--brand-accent)]">
                    {activeGenre}
                    <button onClick={() => setActiveGenre("All")} aria-label={t("catalog.removeFilter")}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {priceRangeIndex !== 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/30 px-3 py-1 text-xs font-medium text-[var(--brand-accent)]">
                    {PRICE_RANGES[priceRangeIndex].label}
                    <button onClick={() => setPriceRangeIndex(0)} aria-label={t("catalog.removeFilter")}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </Reveal>

        {/* Book Grid */}
        {filtered.length === 0 ? (
          <Reveal>
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] py-24 text-center">
              <BookOpen className="h-12 w-12 text-[hsl(var(--muted-foreground))]" />
              <div>
                <p className="text-lg font-semibold text-[hsl(var(--foreground))]">
                  {t("catalog.emptyTitle")}
                </p>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  {t("catalog.emptyBody")}
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveGenre("All");
                  setPriceRangeIndex(0);
                }}
                className="rounded-xl bg-[var(--brand-accent)] px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
              >
                {t("catalog.clearFilters")}
              </button>
            </div>
          </Reveal>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filtered.map((book, i) => (
              <motion.div key={book.id} variants={fadeInUp}>
                <div className="relative">
                  <BookCard book={book} onAddToCart={handleAddToCart} />
                  {addedBookId === book.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2 rounded-full bg-[var(--brand-accent)] px-4 py-2 text-sm font-semibold text-black">
                        <ShoppingCart className="h-4 w-4" />
                        {t("catalog.addedToCart")}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Bottom CTA */}
        {filtered.length > 0 && (
          <Reveal>
            <div className="mt-16 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]">
              <p className="text-sm font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                {t("catalog.ctaEyebrow")}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                {t("catalog.ctaHeading")}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                {t("catalog.ctaBody")}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-accent)] px-6 py-3 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {t("catalog.viewCart")}
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-6 py-3 text-sm font-medium text-[hsl(var(--foreground))] hover:border-[var(--brand-accent)] transition-colors"
                >
                  {t("catalog.backHome")}
                </Link>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </main>
  );
}