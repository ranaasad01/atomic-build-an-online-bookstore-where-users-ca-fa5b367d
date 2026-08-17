"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
            {outOfStock ? "Out of stock" : isAdded ? "Added!" : "Add"}
          </button>
        </div>

        {book.stock_quantity > 0 && book.stock_quantity <= 5 && (
          <p className="text-[10px] text-red-500 font-medium">
            Only {book.stock_quantity} left
          </p>
        )}
      </div>
    </motion.article>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BookCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden animate-pulse">
      <div className="aspect-[2/3] bg-[var(--accent-light)]" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-[var(--accent-light)] rounded w-1/3" />
        <div className="h-4 bg-[var(--accent-light)] rounded w-3/4" />
        <div className="h-3 bg-[var(--accent-light)] rounded w-1/2" />
        <div className="h-3 bg-[var(--accent-light)] rounded w-1/4" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 bg-[var(--accent-light)] rounded w-16" />
          <div className="h-8 bg-[var(--accent-light)] rounded-xl w-20" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BrowseCatalogPage() {
  const t = useTranslations();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search term that triggers the query
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 350);
  }, []);

  // ─── Supabase fetch ──────────────────────────────────────────────────────

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

      // Search: match title OR author
      if (debouncedSearch.trim()) {
        const term = `%${debouncedSearch.trim()}%`;
        query = query.or(`title.ilike.${term},author.ilike.${term}`);
      }

      // Genre filter
      if (selectedGenre) {
        query = query.eq("genre", selectedGenre);
      }

      // Sort
      switch (sortBy) {
        case "bestsellers":
          query = query.eq("is_bestseller", true).order("rating", { ascending: false });
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
        default:
          query = query.order("created_at", { ascending: false });
          break;
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw new Error(supabaseError.message);
      setBooks((data as Book[]) ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load books";
      setError(message);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedGenre, sortBy]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // ─── Add to cart (localStorage) ──────────────────────────────────────────

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

  // ─── Clear filters ────────────────────────────────────────────────────────

  const clearFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedGenre("");
    setSortBy("newest");
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const hasActiveFilters = debouncedSearch || selectedGenre || sortBy !== "newest";

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: t("catalog.sortNewest") },
    { value: "bestsellers", label: t("catalog.sortBestsellers") },
    { value: "rating", label: t("catalog.sortRating") },
    { value: "price-asc", label: t("catalog.sortPriceLow") },
    { value: "price-desc", label: t("catalog.sortPriceHigh") },
  ];

  return (
    <main className="min-h-screen bg-[var(--background)] pb-24">
      {/* ── Hero / Header ── */}
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
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/20 px-3 py-1">
                  <BookOpen className="h-3.5 w-3.5 text-[var(--accent)]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                    {t("catalog.eyebrow")}
                  </span>
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
                  {t("catalog.heading")}
                </h1>
                <p className="mt-2 text-base text-white/60 max-w-xl">
                  {t("catalog.subheading")}
                </p>
              </div>

              {/* Search bar */}
              <div className="relative w-full md:w-80 lg:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={t("catalog.searchPlaceholder")}
                  className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/40 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 transition-all duration-200"
                />
                {search && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Filters bar ── */}
      <div className="sticky top-16 z-30 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3 overflow-x-auto scrollbar-none">
            {/* Genre pills */}
            <button
              onClick={() => setSelectedGenre("")}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                !selectedGenre
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--accent-light)] text-[var(--foreground)] hover:bg-[var(--border)]"
              )}
            >
              {t("catalog.allGenres")}
            </button>

            {GENRES.slice(0, 8).map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(selectedGenre === genre ? "" : genre)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                  selectedGenre === genre
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--accent-light)] text-[var(--foreground)] hover:bg-[var(--border)]"
                )}
              >
                {genre}
              </button>
            ))}

            {/* More genres toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 border",
                showFilters
                  ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--foreground)]"
                  : "border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:border-[var(--accent)]"
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              {t("catalog.filters")}
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  showFilters && "rotate-180"
                )}
              />
            </button>

            {/* Sort */}
            <div className="ml-auto shrink-0 relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--card)] py-1.5 pl-3 pr-8 text-xs font-semibold text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 cursor-pointer transition-all duration-200"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="shrink-0 flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                {t("catalog.clearFilters")}
              </button>
            )}
          </div>

          {/* Expanded genre panel */}
          {showFilters && (
            <div className="pb-3">
              <div className="flex flex-wrap gap-2">
                {GENRES.slice(8).map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(selectedGenre === genre ? "" : genre)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                      selectedGenre === genre
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--accent-light)] text-[var(--foreground)] hover:bg-[var(--border)]"
                    )}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Book grid ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Result count */}
        {!loading && !error && (
          <p className="mb-6 text-sm text-[var(--muted-foreground)]">
            {books.length === 0
              ? t("catalog.noResults")
              : `${books.length} ${t("catalog.books").toLowerCase()}`}
          </p>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-[var(--muted-foreground)] text-sm">{error}</p>
            <button
              onClick={fetchBooks}
              className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Books grid */}
        {!loading && !error && books.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
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
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-[var(--accent)]" />
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-bold text-[var(--foreground)]">
                {t("catalog.noResults")}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {t("catalog.noResultsHint")}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors"
              >
                {t("catalog.clearFilters")}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
