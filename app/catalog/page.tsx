"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, type Variants } from "framer-motion";
import { Search, X, SlidersHorizontal, LayoutGrid, List, Star, ShoppingCart, ChevronLeft, ChevronRight, Check, Filter } from 'lucide-react';
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { GENRES, FREE_SHIPPING_THRESHOLD } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  price: number;
  rating: number;
  cover_image: string;
  is_bestseller: boolean;
  is_featured: boolean;
  stock_quantity: number;
  description: string;
}

type SortOption = "bestsellers" | "newest" | "price-low" | "price-high" | "rating";
type ViewMode = "grid" | "list";

const PRICE_RANGES = [
  { label: "Under $10", min: 0, max: 10 },
  { label: "$10 – $15", min: 10, max: 15 },
  { label: "$15 – $20", min: 15, max: 20 },
  { label: "Over $20", min: 20, max: Infinity },
];

const PAGE_SIZE = 12;

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

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

// ─── Add-to-cart button ───────────────────────────────────────────────────────

function AddToCartButton({ book }: { book: Book }) {
  const t = useTranslations();
  const [added, setAdded] = useState(false);

  const handleAdd = useCallback(() => {
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

  const outOfStock = book.stock_quantity === 0;

  return (
    <button
      onClick={handleAdd}
      disabled={outOfStock || added}
      aria-label={`Add ${book.title} to cart`}
      className={cn(
        "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200",
        outOfStock
          ? "bg-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed"
          : added
          ? "bg-green-600 text-white"
          : "bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent-hover)] hover:text-white"
      )}
    >
      {added ? (
        <>
          <Check className="h-3.5 w-3.5" />
          {t("catalog.added")}
        </>
      ) : outOfStock ? (
        t("catalog.outOfStock")
      ) : (
        <>
          <ShoppingCart className="h-3.5 w-3.5" />
          {t("catalog.addToCart")}
        </>
      )}
    </button>
  );
}

// ─── Book card (grid) ─────────────────────────────────────────────────────────

function BookCardGrid({ book }: { book: Book }) {
  const t = useTranslations();
  const outOfStock = book.stock_quantity === 0;

  return (
    <motion.article
      variants={cardVariants}
      className="group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.14)] overflow-hidden"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {book.is_bestseller && (
          <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">
            {t("catalog.bestseller")}
          </span>
        )}
        {book.is_featured && !book.is_bestseller && (
          <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            {t("catalog.featured")}
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
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--foreground)]">
              {t("catalog.outOfStock")}
            </span>
          </div>
        )}
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

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="font-display text-lg font-bold text-[var(--foreground)]">
            ${book.price.toFixed(2)}
          </span>
          <AddToCartButton book={book} />
        </div>
      </div>
    </motion.article>
  );
}

// ─── Book card (list) ─────────────────────────────────────────────────────────

function BookCardList({ book }: { book: Book }) {
  const t = useTranslations();
  const outOfStock = book.stock_quantity === 0;

  return (
    <motion.article
      variants={cardVariants}
      className="group flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.14)]"
    >
      {/* Cover */}
      <Link
        href={`/book-detail?id=${book.id}`}
        className="shrink-0 relative w-20 aspect-[2/3] rounded-xl overflow-hidden bg-[var(--accent-light)]"
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
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              {book.genre}
            </span>
            <Link href={`/book-detail?id=${book.id}`}>
              <h3 className="font-display text-base font-bold leading-snug text-[var(--foreground)] line-clamp-1 hover:text-[var(--accent)] transition-colors duration-200">
                {book.title}
              </h3>
            </Link>
            <p className="text-sm text-[var(--muted-foreground)]">{book.author}</p>
          </div>
          <span className="shrink-0 font-display text-lg font-bold text-[var(--foreground)]">
            ${book.price.toFixed(2)}
          </span>
        </div>

        <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
          {book.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2">
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
          <div className="flex items-center gap-2">
            {book.is_bestseller && (
              <span className="rounded-full bg-[var(--accent-light)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                {t("catalog.bestseller")}
              </span>
            )}
            {outOfStock && (
              <span className="text-xs text-[var(--muted-foreground)]">
                {t("catalog.outOfStock")}
              </span>
            )}
            <AddToCartButton book={book} />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const t = useTranslations();

  // ── Filter / sort state ──────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("bestsellers");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);

  // ── Pagination state ─────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ── Data state ───────────────────────────────────────────────────────────
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Debounce search ──────────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  // ── Reset page on filter/sort change ────────────────────────────────────
  const handleGenreChange = useCallback((genre: string) => {
    setSelectedGenre(genre);
    setCurrentPage(1);
  }, []);

  const handlePriceChange = useCallback((idx: number | null) => {
    setSelectedPriceRange(idx);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortOption(sort);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedGenre("");
    setSelectedPriceRange(null);
    setSortOption("bestsellers");
    setCurrentPage(1);
  }, []);

  // ── Fetch from Supabase ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchBooks() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const offset = (currentPage - 1) * PAGE_SIZE;

        let query = supabase
          .from("books")
          .select(
            "id, title, author, genre, price, rating, cover_image, is_bestseller, is_featured, stock_quantity, description",
            { count: "exact", head: false }
          );

        // Search filter
        if (debouncedSearch.trim()) {
          const term = debouncedSearch.trim();
          query = query.or(
            `title.ilike.%${term}%,author.ilike.%${term}%,genre.ilike.%${term}%`
          );
        }

        // Genre filter
        if (selectedGenre) {
          query = query.eq("genre", selectedGenre);
        }

        // Price range filter
        if (selectedPriceRange !== null) {
          const range = PRICE_RANGES[selectedPriceRange];
          if (range) {
            query = query.gte("price", range.min);
            if (range.max !== Infinity) {
              query = query.lte("price", range.max);
            }
          }
        }

        // Sort
        switch (sortOption) {
          case "bestsellers":
            query = query.order("is_bestseller", { ascending: false });
            break;
          case "newest":
            query = query.order("created_at", { ascending: false });
            break;
          case "price-low":
            query = query.order("price", { ascending: true });
            break;
          case "price-high":
            query = query.order("price", { ascending: false });
            break;
          case "rating":
            query = query.order("rating", { ascending: false });
            break;
        }

        // Pagination
        query = query.range(offset, offset + PAGE_SIZE - 1);

        const { data, error: sbError, count } = await query;

        if (cancelled) return;

        if (sbError) {
          throw new Error(sbError.message);
        }

        setBooks((data as Book[]) ?? []);
        setTotalCount(count ?? 0);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load books");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBooks();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, selectedGenre, selectedPriceRange, sortOption, currentPage]);

  // ── Derived values ───────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasActiveFilters =
    debouncedSearch.trim() !== "" ||
    selectedGenre !== "" ||
    selectedPriceRange !== null ||
    sortOption !== "bestsellers";

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "bestsellers", label: t("catalog.sortBestsellers") },
    { value: "newest", label: t("catalog.sortNewest") },
    { value: "price-low", label: t("catalog.sortPriceLow") },
    { value: "price-high", label: t("catalog.sortPriceHigh") },
    { value: "rating", label: t("catalog.sortRating") },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Hero header ── */}
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
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
              {t("catalog.eyebrow")}
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
              {t("catalog.heading")}
            </h1>
            <p className="mt-3 max-w-xl text-base text-white/70 leading-relaxed">
              {t("catalog.subheading")}
            </p>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Search + controls bar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("catalog.searchPlaceholder")}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] pl-9 pr-9 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort */}
            <select
              value={sortOption}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition-all duration-200 cursor-pointer"
              aria-label="Sort books"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200",
                showFilters
                  ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--foreground)]"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--accent)]"
              )}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("catalog.filters")}
              {hasActiveFilters && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[9px] font-bold text-[var(--primary)]">
                  !
                </span>
              )}
            </button>

            {/* View mode */}
            <div className="flex rounded-xl border border-[var(--border)] overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center justify-center px-3 py-2.5 transition-colors duration-200",
                  viewMode === "grid"
                    ? "bg-[var(--accent)] text-[var(--primary)]"
                    : "bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
                aria-label={t("catalog.gridView")}
                aria-pressed={viewMode === "grid"}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center justify-center px-3 py-2.5 transition-colors duration-200",
                  viewMode === "list"
                    ? "bg-[var(--accent)] text-[var(--primary)]"
                    : "bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
                aria-label={t("catalog.listView")}
                aria-pressed={viewMode === "list"}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:gap-8">
              {/* Genre filter */}
              <div className="flex-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {t("catalog.filterGenre")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleGenreChange("")}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
                      selectedGenre === ""
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--primary)]"
                        : "border-[var(--border)] bg-transparent text-[var(--foreground)] hover:border-[var(--accent)]"
                    )}
                  >
                    {t("catalog.allGenres")}
                  </button>
                  {GENRES.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => handleGenreChange(genre)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
                        selectedGenre === genre
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--primary)]"
                          : "border-[var(--border)] bg-transparent text-[var(--foreground)] hover:border-[var(--accent)]"
                      )}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price filter */}
              <div className="sm:w-48">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {t("catalog.filterPrice")}
                </p>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => handlePriceChange(null)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium text-left transition-all duration-200",
                      selectedPriceRange === null
                        ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--foreground)]"
                        : "border-[var(--border)] bg-transparent text-[var(--foreground)] hover:border-[var(--accent)]"
                    )}
                  >
                    {t("catalog.anyPrice")}
                  </button>
                  {PRICE_RANGES.map((range, idx) => (
                    <button
                      key={range.label}
                      onClick={() => handlePriceChange(idx)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium text-left transition-all duration-200",
                        selectedPriceRange === idx
                          ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--foreground)]"
                          : "border-[var(--border)] bg-transparent text-[var(--foreground)] hover:border-[var(--accent)]"
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("catalog.clearFilters")}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Results count ── */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            {loading ? (
              <span className="inline-block h-4 w-32 animate-pulse rounded bg-[var(--accent-light)]" />
            ) : (
              <>
                {t("catalog.showing")}{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalCount)}–
                  {Math.min(currentPage * PAGE_SIZE, totalCount)}
                </span>{" "}
                {t("catalog.of")}{" "}
                <span className="font-semibold text-[var(--foreground)]">{totalCount}</span>{" "}
                {t("catalog.books")}
              </>
            )}
          </p>
          {hasActiveFilters && !loading && (
            <button
              onClick={clearFilters}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors duration-200"
            >
              {t("catalog.clearFilters")}
            </button>
          )}
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <button
              onClick={() => setCurrentPage((p) => p)}
              className="mt-3 text-xs text-red-500 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Book grid / list ── */}
        {loading ? (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6"
                : "flex flex-col gap-4"
            )}
          >
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-light)]">
              <Filter className="h-7 w-7 text-[var(--accent)]" />
            </div>
            <h3 className="font-display text-xl font-bold text-[var(--foreground)]">
              {t("catalog.noResults")}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-xs">
              {t("catalog.noResultsHint")}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors duration-200"
              >
                {t("catalog.clearFilters")}
              </button>
            )}
          </div>
        ) : (
          <motion.div
            key={`${currentPage}-${sortOption}-${selectedGenre}-${selectedPriceRange}-${debouncedSearch}`}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6"
                : "flex flex-col gap-4"
            )}
          >
            {books.map((book) =>
              viewMode === "grid" ? (
                <BookCardGrid key={book.id} book={book} />
              ) : (
                <BookCardList key={book.id} book={book} />
              )
            )}
          </motion.div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                currentPage === 1
                  ? "border-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed opacity-50"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              )}
              aria-label={t("catalog.previous")}
            >
              <ChevronLeft className="h-4 w-4" />
              {t("catalog.previous")}
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                )
                .reduce<(number | "...")[]>((acc, page, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === "number" && (page as number) - (arr[idx - 1] as number) > 1) {
                    acc.push("...");
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-sm text-[var(--muted-foreground)]"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium transition-all duration-200",
                        currentPage === item
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--primary)]"
                          : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      )}
                      aria-label={`Page ${item}`}
                      aria-current={currentPage === item ? "page" : undefined}
                    >
                      {item}
                    </button>
                  )
                )}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                currentPage === totalPages
                  ? "border-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed opacity-50"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              )}
              aria-label={t("catalog.next")}
            >
              {t("catalog.next")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Free shipping nudge ── */}
        <Reveal className="mt-12">
          <div className="rounded-2xl border border-[var(--accent-light)] bg-[var(--accent-light)] px-6 py-5 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">
              {t("catalog.freeShippingNudge")}
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
