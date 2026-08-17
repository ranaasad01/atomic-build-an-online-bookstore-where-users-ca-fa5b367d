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

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
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
      </span>
    </div>
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

        <StarRating rating={book.rating} />

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-display text-lg font-bold text-[var(--foreground)]">
            ${book.price.toFixed(2)}
          </span>
          <AddToCartButton book={book} />
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

// ─── Book Card (List) ─────────────────────────────────────────────────────────

function BookCardList({ book }: { book: Book }) {
  return (
    <motion.article
      variants={cardVariants}
      className="group flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.14)]"
    >
      {/* Cover */}
      <Link
        href={`/book-detail?id=${book.id}`}
        className="shrink-0 relative w-20 aspect-[2/3] overflow-hidden rounded-xl bg-[var(--accent-light)]"
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

        <StarRating rating={book.rating} />

        <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
          {book.description}
        </p>

        <div className="mt-auto flex items-center gap-3 pt-1">
          <AddToCartButton book={book} />
          {book.is_bestseller && (
            <span className="rounded-full bg-[var(--accent-light)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
              Bestseller
            </span>
          )}
          {book.stock_quantity === 0 && (
            <span className="text-xs text-[var(--muted-foreground)]">
              Out of stock
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const t = useTranslations();

  // ── Filter / sort / pagination state ──────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("bestsellers");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // ── Data state ────────────────────────────────────────────────────────────
  const [books, setBooks] = useState<Book[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Debounced search ──────────────────────────────────────────────────────
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 350);
  }, []);

  // ── Fetch from Supabase ───────────────────────────────────────────────────
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
            "id,title,author,genre,price,rating,cover_image,is_bestseller,is_featured,stock_quantity,description",
            { count: "exact", head: false }
          );

        // Genre filter
        if (selectedGenre) {
          query = query.eq("genre", selectedGenre);
        }

        // Search filter
        const term = debouncedSearch.trim();
        if (term) {
          query = query.or(
            `title.ilike.%${term}%,author.ilike.%${term}%`
          );
        }

        // Price range filter (client-side friendly via gte/lte)
        if (selectedPriceRange !== null) {
          const range = PRICE_RANGES[selectedPriceRange];
          if (range) {
            query = query.gte("price", range.min);
            if (range.max !== Infinity) {
              query = query.lte("price", range.max);
            }
          }
        }

        // Sorting
        switch (sortBy) {
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
          setError(sbError.message);
          setBooks([]);
          setTotalCount(0);
          return;
        }

        setBooks((data as Book[]) ?? []);
        setTotalCount(count ?? 0);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load books.");
          setBooks([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBooks();
    return () => { cancelled = true; };
  }, [selectedGenre, debouncedSearch, selectedPriceRange, sortBy, currentPage]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasActiveFilters = !!selectedGenre || !!debouncedSearch || selectedPriceRange !== null;

  const clearFilters = useCallback(() => {
    setSelectedGenre("");
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedPriceRange(null);
    setSortBy("bestsellers");
    setCurrentPage(1);
  }, []);

  const handleGenreChange = useCallback((genre: string) => {
    setSelectedGenre(genre);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
    setCurrentPage(1);
  }, []);

  const handlePriceRangeChange = useCallback((idx: number | null) => {
    setSelectedPriceRange(idx);
    setCurrentPage(1);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* ── Hero banner ── */}
      <section
        className="border-b"
        style={{
          backgroundColor: "var(--primary)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <Reveal>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--accent)" }}
            >
              {t("catalog.eyebrow")}
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3"
              style={{ fontFamily: "Playfair Display, Georgia, serif" }}
            >
              {t("catalog.heading")}
            </h1>
            <p className="text-white/60 text-lg max-w-xl">
              {t("catalog.subheading")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Sidebar filters ── */}
          <aside className="lg:w-60 shrink-0">
            {/* Mobile filter toggle */}
            <button
              className="lg:hidden flex items-center gap-2 mb-4 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--card)",
                color: "var(--foreground)",
              }}
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="h-4 w-4" />
              {t("catalog.filters")}
              {hasActiveFilters && (
                <span
                  className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--primary)",
                  }}
                >
                  !
                </span>
              )}
            </button>

            <div
              className={cn(
                "space-y-6",
                showFilters ? "block" : "hidden lg:block"
              )}
            >
              {/* Genre filter */}
              <div>
                <h3
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {t("catalog.filterGenre")}
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleGenreChange("")}
                    className={cn(
                      "w-full text-left rounded-lg px-3 py-2 text-sm transition-colors",
                      !selectedGenre
                        ? "font-semibold"
                        : "hover:bg-[var(--accent-light)]"
                    )}
                    style={{
                      backgroundColor: !selectedGenre
                        ? "var(--accent-light)"
                        : undefined,
                      color: !selectedGenre
                        ? "var(--foreground)"
                        : "var(--muted-foreground)",
                    }}
                  >
                    {t("catalog.allGenres")}
                  </button>
                  {GENRES.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => handleGenreChange(genre)}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2 text-sm transition-colors",
                        selectedGenre === genre
                          ? "font-semibold"
                          : "hover:bg-[var(--accent-light)]"
                      )}
                      style={{
                        backgroundColor:
                          selectedGenre === genre
                            ? "var(--accent-light)"
                            : undefined,
                        color:
                          selectedGenre === genre
                            ? "var(--foreground)"
                            : "var(--muted-foreground)",
                      }}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range filter */}
              <div>
                <h3
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {t("catalog.filterPrice")}
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handlePriceRangeChange(null)}
                    className={cn(
                      "w-full text-left rounded-lg px-3 py-2 text-sm transition-colors",
                      selectedPriceRange === null
                        ? "font-semibold"
                        : "hover:bg-[var(--accent-light)]"
                    )}
                    style={{
                      backgroundColor:
                        selectedPriceRange === null
                          ? "var(--accent-light)"
                          : undefined,
                      color:
                        selectedPriceRange === null
                          ? "var(--foreground)"
                          : "var(--muted-foreground)",
                    }}
                  >
                    {t("catalog.anyPrice")}
                  </button>
                  {PRICE_RANGES.map((range, idx) => (
                    <button
                      key={range.label}
                      onClick={() => handlePriceRangeChange(idx)}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2 text-sm transition-colors",
                        selectedPriceRange === idx
                          ? "font-semibold"
                          : "hover:bg-[var(--accent-light)]"
                      )}
                      style={{
                        backgroundColor:
                          selectedPriceRange === idx
                            ? "var(--accent-light)"
                            : undefined,
                        color:
                          selectedPriceRange === idx
                            ? "var(--foreground)"
                            : "var(--muted-foreground)",
                      }}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                  style={{ color: "var(--accent)" }}
                >
                  <X className="h-3.5 w-3.5" />
                  {t("catalog.clearFilters")}
                </button>
              )}

              {/* Free shipping nudge */}
              <div
                className="rounded-xl border p-4 text-sm"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--accent-light)",
                  color: "var(--foreground)",
                }}
              >
                <p className="font-semibold mb-1" style={{ color: "var(--accent)" }}>
                  Free Shipping
                </p>
                <p style={{ color: "var(--muted-foreground)" }}>
                  On orders over ${FREE_SHIPPING_THRESHOLD}
                </p>
              </div>
            </div>
          </aside>

          {/* ── Main area ── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Search */}
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={t("catalog.searchPlaceholder")}
                  className="w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--card)",
                    color: "var(--foreground)",
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    aria-label="Clear search"
                  >
                    <X
                      className="h-4 w-4"
                      style={{ color: "var(--muted-foreground)" }}
                    />
                  </button>
                )}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal
                  className="h-4 w-4 shrink-0"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  className="rounded-xl border px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2 cursor-pointer"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--card)",
                    color: "var(--foreground)",
                  }}
                >
                  <option value="bestsellers">{t("catalog.sortBestsellers")}</option>
                  <option value="newest">{t("catalog.sortNewest")}</option>
                  <option value="price-low">{t("catalog.sortPriceLow")}</option>
                  <option value="price-high">{t("catalog.sortPriceHigh")}</option>
                  <option value="rating">{t("catalog.sortRating")}</option>
                </select>
              </div>

              {/* View mode */}
              <div
                className="flex items-center rounded-xl border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
              >
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label={t("catalog.gridView")}
                  className={cn(
                    "flex items-center justify-center h-10 w-10 transition-colors",
                    viewMode === "grid"
                      ? "bg-[var(--accent)] text-[var(--primary)]"
                      : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--accent-light)]"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  aria-label={t("catalog.listView")}
                  className={cn(
                    "flex items-center justify-center h-10 w-10 transition-colors",
                    viewMode === "list"
                      ? "bg-[var(--accent)] text-[var(--primary)]"
                      : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--accent-light)]"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Results count */}
            {!loading && !error && (
              <p
                className="text-sm mb-5"
                style={{ color: "var(--muted-foreground)" }}
              >
                {t("catalog.showing")}{" "}
                <span
                  className="font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalCount)}–
                  {Math.min(currentPage * PAGE_SIZE, totalCount)}
                </span>{" "}
                {t("catalog.of")}{" "}
                <span
                  className="font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {totalCount.toLocaleString("en-US")}
                </span>{" "}
                {t("catalog.books")}
              </p>
            )}

            {/* Error state */}
            {error && (
              <div
                className="rounded-2xl border p-8 text-center"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--card)",
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Failed to load books. Please try again.
                </p>
              </div>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5"
                    : "flex flex-col gap-4"
                )}
              >
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <BookCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Books grid/list */}
            {!loading && !error && books.length > 0 && (
              <motion.div
                key={`${selectedGenre}-${debouncedSearch}-${sortBy}-${currentPage}`}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5"
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

            {/* Empty state */}
            {!loading && !error && books.length === 0 && (
              <div
                className="rounded-2xl border p-12 text-center"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--card)",
                }}
              >
                <p
                  className="font-display text-xl font-bold mb-2"
                  style={{ color: "var(--foreground)" }}
                >
                  {t("catalog.noResults")}
                </p>
                <p
                  className="text-sm mb-5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {t("catalog.noResultsHint")}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "var(--primary)",
                    }}
                  >
                    {t("catalog.clearFilters")}
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label={t("catalog.previous")}
                  className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--card)",
                    color: "var(--foreground)",
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("catalog.previous")}
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 7) {
                      page = i + 1;
                    } else if (currentPage <= 4) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      page = totalPages - 6 + i;
                    } else {
                      page = currentPage - 3 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "h-9 w-9 rounded-xl text-sm font-medium transition-all duration-200",
                          currentPage === page
                            ? "font-bold"
                            : "hover:bg-[var(--accent-light)]"
                        )}
                        style={{
                          backgroundColor:
                            currentPage === page
                              ? "var(--accent)"
                              : undefined,
                          color:
                            currentPage === page
                              ? "var(--primary)"
                              : "var(--muted-foreground)",
                        }}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label={t("catalog.next")}
                  className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--card)",
                    color: "var(--foreground)",
                  }}
                >
                  {t("catalog.next")}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
