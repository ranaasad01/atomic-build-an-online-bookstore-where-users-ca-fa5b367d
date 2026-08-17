"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, SlidersHorizontal, Star, ShoppingCart, X, ChevronDown, BookOpen, Filter } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { GENRES } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  price: number;
  rating: number;
  rating_count?: number;
  cover_image: string;
  is_bestseller: boolean;
  is_featured: boolean;
  description: string;
  stock_quantity: number;
}

type SortOption = "bestsellers" | "price-asc" | "price-desc" | "rating" | "newest";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3.5 w-3.5",
            star <= Math.round(rating)
              ? "fill-[var(--accent)] text-[var(--accent)]"
              : "fill-transparent text-[var(--border)]"
          )}
        />
      ))}
      <span className="ml-1 text-xs text-[var(--muted-foreground)]">
        {rating.toFixed(1)}
        {count !== undefined && (
          <span className="ml-0.5">({count.toLocaleString("en-US")})</span>
        )}
      </span>
    </div>
  );
}

function BookCard({ book, onAddToCart, addedId }: { book: Book; onAddToCart: (book: Book) => void; addedId: string | null }) {
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
      <Link href={`/book-detail?id=${book.id}`} className="block relative aspect-[2/3] overflow-hidden bg-[var(--accent-light)]">
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
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
            {book.genre}
          </span>
          <Link href={`/book-detail?id=${book.id}`}>
            <h3 className="mt-0.5 font-display text-base font-bold leading-snug text-[var(--foreground)] line-clamp-2 hover:text-[var(--accent)] transition-colors duration-200">
              {book.title}
            </h3>
          </Link>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{book.author}</p>
        </div>

        <StarRating rating={book.rating} count={book.rating_count} />

        <div className="mt-auto flex items-center justify-between pt-2">
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
            {outOfStock ? "Out of Stock" : isAdded ? "Added!" : "Add to Cart"}
          </button>
        </div>

        {book.stock_quantity > 0 && book.stock_quantity <= 5 && (
          <p className="text-[10px] text-amber-600 font-medium">
            Only {book.stock_quantity} left
          </p>
        )}
      </div>
    </motion.article>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function BookCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden animate-pulse">
      <div className="aspect-[2/3] bg-[var(--accent-light)]" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-[var(--accent-light)] rounded w-1/3" />
        <div className="h-4 bg-[var(--accent-light)] rounded w-3/4" />
        <div className="h-3 bg-[var(--accent-light)] rounded w-1/2" />
        <div className="h-3 bg-[var(--accent-light)] rounded w-1/4" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 bg-[var(--accent-light)] rounded w-12" />
          <div className="h-8 bg-[var(--accent-light)] rounded-xl w-24" />
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrowseCatalogPage() {
  const t = useTranslations();

  // ── Filter state ──
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("bestsellers");
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(9999);
  const [showFilters, setShowFilters] = useState(false);

  // ── Data state ──
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  // ── Fetch from Supabase ───────────────────────────────────────────────────
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      let query = supabase
        .from("books")
        .select(
          "id, title, author, genre, price, rating, rating_count, cover_image, is_bestseller, is_featured, description, stock_quantity"
        );

      // Genre filter
      if (selectedGenre) {
        query = query.eq("genre", selectedGenre);
      }

      // Search filter
      if (search.trim()) {
        const q = search.trim();
        query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
      }

      // Price range filter
      if (priceMin > 0) {
        query = query.gte("price", priceMin);
      }
      if (priceMax < 9999) {
        query = query.lte("price", priceMax);
      }

      // Sort
      switch (sortBy) {
        case "bestsellers":
          query = query.order("is_bestseller", { ascending: false });
          break;
        case "price-asc":
          query = query.order("price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("price", { ascending: false });
          break;
        case "rating":
          query = query.order("rating", { ascending: false });
          break;
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setBooks((data as Book[]) ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load books";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [search, selectedGenre, sortBy, priceMin, priceMax]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // ── Add to cart (localStorage) ────────────────────────────────────────────
  const handleAddToCart = useCallback((book: Book) => {
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

  // ── Price range presets ───────────────────────────────────────────────────
  const PRICE_PRESETS = [
    { label: "Any price", min: 0, max: 9999 },
    { label: "Under $10", min: 0, max: 10 },
    { label: "$10 – $15", min: 10, max: 15 },
    { label: "$15 – $20", min: 15, max: 20 },
    { label: "Over $20", min: 20, max: 9999 },
  ];

  const activePriceLabel =
    PRICE_PRESETS.find((p) => p.min === priceMin && p.max === priceMax)?.label ?? "Custom";

  const clearFilters = () => {
    setSearch("");
    setSelectedGenre("");
    setSortBy("bestsellers");
    setPriceMin(0);
    setPriceMax(9999);
  };

  const hasActiveFilters =
    search !== "" ||
    selectedGenre !== "" ||
    sortBy !== "bestsellers" ||
    priceMin !== 0 ||
    priceMax !== 9999;

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "bestsellers", label: "Bestsellers" },
    { value: "rating", label: "Top Rated" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "newest", label: "Newest" },
  ];

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* ── Hero banner ── */}
      <Reveal>
        <section className="relative overflow-hidden bg-[var(--primary)] py-14 md:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 0%, transparent 60%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]">
                <BookOpen className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
                Browse Catalog
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold text-white md:text-5xl tracking-tight text-balance">
              Find Your Next Great Read
            </h1>
            <p className="mt-3 max-w-xl text-white/70 leading-relaxed">
              Thousands of titles across every genre. Use the filters below to discover your perfect book.
            </p>
          </div>
        </section>
      </Reveal>

      {/* ── Filters bar ── */}
      <div className="sticky top-16 z-30 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or author…"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] pl-9 pr-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition-all duration-200"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Genre select */}
            <div className="relative">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--card)] pl-3 pr-8 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition-all duration-200 cursor-pointer"
              >
                <option value="">All Genres</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            </div>

            {/* Sort select */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--card)] pl-3 pr-8 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition-all duration-200 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200",
                showFilters
                  ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--foreground)]"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[9px] font-bold text-[var(--primary)]">
                  !
                </span>
              )}
            </button>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Expanded price filter */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-wrap gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] self-center mr-1">
                Price:
              </span>
              {PRICE_PRESETS.map((preset) => {
                const isActive = priceMin === preset.min && priceMax === preset.max;
                return (
                  <button
                    key={preset.label}
                    onClick={() => { setPriceMin(preset.min); setPriceMax(preset.max); }}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium border transition-all duration-200",
                      isActive
                        ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--primary)]"
                        : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Result count */}
        {!loading && !error && (
          <p className="mb-6 text-sm text-[var(--muted-foreground)]">
            {books.length === 0
              ? "No books found"
              : `Showing ${books.length} book${books.length !== 1 ? "s" : ""}`}
            {selectedGenre && ` in ${selectedGenre}`}
            {search && ` matching "${search}"`}
          </p>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-400">
              <Filter className="h-7 w-7" />
            </div>
            <h2 className="font-display text-xl font-bold text-[var(--foreground)] mb-2">
              Failed to load books
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-sm">
              {error}
            </p>
            <button
              onClick={fetchBooks}
              className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors duration-200"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && <SkeletonGrid />}

        {/* Books grid */}
        {!loading && !error && books.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onAddToCart={handleAddToCart}
                addedId={addedId}
              />
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && !error && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-light)]">
              <BookOpen className="h-7 w-7 text-[var(--accent)]" />
            </div>
            <h2 className="font-display text-xl font-bold text-[var(--foreground)] mb-2">
              No books found
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-sm">
              Try adjusting your filters or search term to discover more titles.
            </p>
            <button
              onClick={clearFilters}
              className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors duration-200"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
