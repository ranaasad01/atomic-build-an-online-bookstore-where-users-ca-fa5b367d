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
        <><Check className="h-3.5 w-3.5" />{t("catalog.added")}</>
      ) : outOfStock ? (
        <>{t("catalog.outOfStock")}</>
      ) : (
        <><ShoppingCart className="h-3.5 w-3.5" />{t("catalog.addToCart")}</>
      )}
    </button>
  );
}

// ─── Book Card (Grid) ─────────────────────────────────────────────────────────

function BookCardGrid({ book }: { book: Book }) {
  return (
    <motion.article
      variants={cardVariants}
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
          <span className="ml-1 text-xs text-[var(--muted-foreground)]">{book.rating.toFixed(1)}</span>
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

// ─── Book Card (List) ─────────────────────────────────────────────────────────

function BookCardList({ book }: { book: Book }) {
  return (
    <motion.article
      variants={cardVariants}
      className="group flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.14)]"
    >
      {/* Cover */}
      <Link href={`/book-detail?id=${book.id}`} className="shrink-0">
        <div className="relative h-32 w-22 overflow-hidden rounded-xl bg-[var(--accent-light)]">
          <img
            src={book.cover_image}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ width: "88px", height: "128px" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/book-placeholder.jpg";
            }}
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              {book.genre}
            </span>
            <Link href={`/book-detail?id=${book.id}`}>
              <h3 className="font-display text-base font-bold leading-snug text-[var(--foreground)] hover:text-[var(--accent)] transition-colors duration-200 line-clamp-1">
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
            <span className="ml-1 text-xs text-[var(--muted-foreground)]">{book.rating.toFixed(1)}</span>
          </div>
          <AddToCartButton book={book} />
        </div>
      </div>
    </motion.article>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const t = useTranslations();

  // ── Filter / sort / pagination state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("bestsellers");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // ── Data state ──
  const [books, setBooks] = useState<Book[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Search debounce ──
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, [searchQuery]);

  // ── Fetch books from Supabase ──
  useEffect(() => {
    let cancelled = false;

    async function fetchBooks() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const offset = (currentPage - 1) * PAGE_SIZE;

        // ── Build base query ──
        let query = supabase
          .from("books")
          .select(
            "id, title, author, genre, price, rating, cover_image, is_bestseller, is_featured, stock_quantity, description"
          );

        // ── Genre filter ──
        if (selectedGenre) {
          query = query.eq("genre", selectedGenre);
        }

        // ── Price range filter ──
        if (selectedPriceRange !== null) {
          const range = PRICE_RANGES[selectedPriceRange];
          if (range) {
            query = query.gte("price", range.min);
            if (range.max !== Infinity) {
              query = query.lte("price", range.max);
            }
          }
        }

        // ── Search filter ──
        if (debouncedSearch.trim()) {
          query = query.or(
            `title.ilike.%${debouncedSearch.trim()}%,author.ilike.%${debouncedSearch.trim()}%`
          );
        }

        // ── Sort ──
        if (sortBy === "bestsellers") {
          query = query.eq("is_bestseller", true);
        } else if (sortBy === "newest") {
          query = query.order("created_at", { ascending: false });
        } else if (sortBy === "price-low") {
          query = query.order("price", { ascending: true });
        } else if (sortBy === "price-high") {
          query = query.order("price", { ascending: false });
        } else if (sortBy === "rating") {
          query = query.order("rating", { ascending: false });
        }

        // ── Pagination ──
        query = query.range(offset, offset + PAGE_SIZE - 1);

        // ── Count query (same filters, no pagination) ──
        let countQuery = supabase
          .from("books")
          .select("*", { count: "exact", head: true });

        if (selectedGenre) {
          countQuery = countQuery.eq("genre", selectedGenre);
        }
        if (selectedPriceRange !== null) {
          const range = PRICE_RANGES[selectedPriceRange];
          if (range) {
            countQuery = countQuery.gte("price", range.min);
            if (range.max !== Infinity) {
              countQuery = countQuery.lte("price", range.max);
            }
          }
        }
        if (debouncedSearch.trim()) {
          countQuery = countQuery.or(
            `title.ilike.%${debouncedSearch.trim()}%,author.ilike.%${debouncedSearch.trim()}%`
          );
        }
        if (sortBy === "bestsellers") {
          countQuery = countQuery.eq("is_bestseller", true);
        }

        const [{ data, error: fetchError }, { count, error: countError }] =
          await Promise.all([query, countQuery]);

        if (cancelled) return;

        if (fetchError) throw new Error(fetchError.message);
        if (countError) throw new Error(countError.message);

        setBooks((data as Book[]) ?? []);
        setTotalCount(count ?? 0);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load books. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBooks();

    return () => {
      cancelled = true;
    };
  }, [selectedGenre, selectedPriceRange, sortBy, currentPage, debouncedSearch]);

  // ── Reset page when filters change ──
  const handleGenreChange = useCallback((genre: string) => {
    setSelectedGenre(genre);
    setCurrentPage(1);
  }, []);

  const handlePriceRangeChange = useCallback((idx: number | null) => {
    setSelectedPriceRange(idx);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedGenre("");
    setSelectedPriceRange(null);
    setSearchQuery("");
    setDebouncedSearch("");
    setSortBy("bestsellers");
    setCurrentPage(1);
  }, []);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasActiveFilters =
    selectedGenre !== "" || selectedPriceRange !== null || debouncedSearch !== "";

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "bestsellers", label: t("catalog.sortBestsellers") },
    { value: "newest", label: t("catalog.sortNewest") },
    { value: "price-low", label: t("catalog.sortPriceLow") },
    { value: "price-high", label: t("catalog.sortPriceHigh") },
    { value: "rating", label: t("catalog.sortRating") },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Hero bar ── */}
      <Reveal>
        <section className="bg-[var(--primary)] py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">
                  {t("catalog.eyebrow")}
                </p>
                <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
                  {t("catalog.heading")}
                </h1>
                <p className="mt-2 text-white/60 text-sm">
                  {t("catalog.subheading")}
                </p>
              </div>
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="search"
                  placeholder={t("catalog.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* ── Sidebar filters (desktop) ── */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Genre */}
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                  {t("catalog.filterGenre")}
                </h2>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => handleGenreChange("")}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-1.5 text-sm transition-colors duration-150",
                        selectedGenre === ""
                          ? "bg-[var(--accent-light)] text-[var(--foreground)] font-semibold"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--accent-light)] hover:text-[var(--foreground)]"
                      )}
                    >
                      {t("catalog.allGenres")}
                    </button>
                  </li>
                  {GENRES.map((genre) => (
                    <li key={genre}>
                      <button
                        onClick={() => handleGenreChange(genre)}
                        className={cn(
                          "w-full text-left rounded-lg px-3 py-1.5 text-sm transition-colors duration-150",
                          selectedGenre === genre
                            ? "bg-[var(--accent-light)] text-[var(--foreground)] font-semibold"
                            : "text-[var(--muted-foreground)] hover:bg-[var(--accent-light)] hover:text-[var(--foreground)]"
                        )}
                      >
                        {genre}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price range */}
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                  {t("catalog.filterPrice")}
                </h2>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => handlePriceRangeChange(null)}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-1.5 text-sm transition-colors duration-150",
                        selectedPriceRange === null
                          ? "bg-[var(--accent-light)] text-[var(--foreground)] font-semibold"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--accent-light)] hover:text-[var(--foreground)]"
                      )}
                    >
                      {t("catalog.anyPrice")}
                    </button>
                  </li>
                  {PRICE_RANGES.map((range, idx) => (
                    <li key={range.label}>
                      <button
                        onClick={() => handlePriceRangeChange(idx)}
                        className={cn(
                          "w-full text-left rounded-lg px-3 py-1.5 text-sm transition-colors duration-150",
                          selectedPriceRange === idx
                            ? "bg-[var(--accent-light)] text-[var(--foreground)] font-semibold"
                            : "text-[var(--muted-foreground)] hover:bg-[var(--accent-light)] hover:text-[var(--foreground)]"
                        )}
                      >
                        {range.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors font-medium"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("catalog.clearFilters")}
                </button>
              )}
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                {/* Mobile filter toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  {t("catalog.filters")}
                  {hasActiveFilters && (
                    <span className="ml-1 rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                      !
                    </span>
                  )}
                </button>

                <p className="text-sm text-[var(--muted-foreground)]">
                  {loading ? (
                    <span className="inline-block h-4 w-24 bg-[var(--accent-light)] rounded animate-pulse" />
                  ) : (
                    <>{totalCount.toLocaleString("en-US")} {t("catalog.results")}</>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--card)] py-2 pl-3 pr-8 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 transition-all cursor-pointer"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                </div>

                {/* View mode */}
                <div className="flex rounded-xl border border-[var(--border)] overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid view"
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === "grid"
                        ? "bg-[var(--accent)] text-[var(--primary)]"
                        : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--accent-light)]"
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label="List view"
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === "list"
                        ? "bg-[var(--accent)] text-[var(--primary)]"
                        : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--accent-light)]"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile filters panel */}
            {showFilters && (
              <div className="lg:hidden mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-5">
                {/* Genre */}
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
                    {t("catalog.filterGenre")}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { handleGenreChange(""); setShowFilters(false); }}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                        selectedGenre === ""
                          ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--primary)]"
                          : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
                      )}
                    >
                      {t("catalog.allGenres")}
                    </button>
                    {GENRES.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => { handleGenreChange(genre); setShowFilters(false); }}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                          selectedGenre === genre
                            ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--primary)]"
                            : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
                        )}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
                    {t("catalog.filterPrice")}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { handlePriceRangeChange(null); setShowFilters(false); }}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                        selectedPriceRange === null
                          ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--primary)]"
                          : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
                      )}
                    >
                      {t("catalog.anyPrice")}
                    </button>
                    {PRICE_RANGES.map((range, idx) => (
                      <button
                        key={range.label}
                        onClick={() => { handlePriceRangeChange(idx); setShowFilters(false); }}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                          selectedPriceRange === idx
                            ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--primary)]"
                            : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={() => { clearFilters(); setShowFilters(false); }}
                    className="flex items-center gap-1.5 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors font-medium"
                  >
                    <X className="h-3.5 w-3.5" />
                    {t("catalog.clearFilters")}
                  </button>
                )}
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center mb-6">
                <p className="text-sm font-medium text-red-600">{error}</p>
                <button
                  onClick={() => setCurrentPage((p) => p)}
                  className="mt-3 text-sm text-red-500 underline hover:text-red-700 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Book grid / list */}
            {loading ? (
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "flex flex-col gap-4"
                )}
              >
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <BookCardSkeleton key={i} />
                ))}
              </div>
            ) : books.length === 0 && !error ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-light)]">
                  <Search className="h-7 w-7 text-[var(--accent)]" />
                </div>
                <h3 className="font-display text-xl font-bold text-[var(--foreground)] mb-2">
                  {t("catalog.noResults")}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-xs">
                  {t("catalog.noResultsHint")}
                </p>
                <button
                  onClick={clearFilters}
                  className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors"
                >
                  {t("catalog.clearFilters")}
                </button>
              </div>
            ) : (
              <motion.div
                key={`${selectedGenre}-${selectedPriceRange}-${sortBy}-${currentPage}-${debouncedSearch}`}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4"
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

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

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
                        className="flex h-9 w-9 items-center justify-center text-sm text-[var(--muted-foreground)]"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item as number)}
                        aria-label={`Page ${item}`}
                        aria-current={currentPage === item ? "page" : undefined}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-colors",
                          currentPage === item
                            ? "bg-[var(--accent)] text-[var(--primary)] font-bold"
                            : "border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                        )}
                      >
                        {item}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Free shipping nudge */}
            {!loading && books.length > 0 && (
              <Reveal>
                <div className="mt-10 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-light)] px-6 py-4 flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-[var(--accent)] shrink-0" />
                  <p className="text-sm text-[var(--foreground)]">
                    <span className="font-semibold">{t("catalog.freeShippingNudge", { threshold: FREE_SHIPPING_THRESHOLD })}</span>
                  </p>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
