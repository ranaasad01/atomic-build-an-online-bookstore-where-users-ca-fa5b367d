"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
        <><Check className="h-3.5 w-3.5" /> Added</>
      ) : outOfStock ? (
        "Out of Stock"
      ) : (
        <><ShoppingCart className="h-3.5 w-3.5" /> Add to Cart</>
      )}
    </button>
  );
}

// ─── Book Card (grid) ─────────────────────────────────────────────────────────

function BookCardGrid({ book }: { book: Book }) {
  return (
    <motion.div
      variants={cardVariants}
      className="group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_-6px_rgba(0,0,0,0.14)] transition-shadow duration-300"
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {book.is_bestseller && (
          <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--primary)]">
            Bestseller
          </span>
        )}
        {book.is_featured && (
          <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Featured
          </span>
        )}
      </div>

      {/* Cover */}
      <Link href={`/book-detail?id=${book.id}`} className="block overflow-hidden">
        <div className="aspect-[2/3] overflow-hidden bg-[var(--accent-light)]">
          <img
            src={book.cover_image}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                `https://placehold.co/200x300/f0e6d3/5c5240?text=${encodeURIComponent(book.title)}`;
            }}
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
            {book.genre}
          </span>
          <Link href={`/book-detail?id=${book.id}`}>
            <h3 className="mt-0.5 font-display text-sm font-bold leading-snug text-[var(--foreground)] line-clamp-2 hover:text-[var(--accent)] transition-colors">
              {book.title}
            </h3>
          </Link>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{book.author}</p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-[var(--accent)] text-[var(--accent)]" />
          <span className="text-xs font-semibold text-[var(--foreground)]">{book.rating.toFixed(1)}</span>
        </div>

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="font-display text-base font-bold text-[var(--foreground)]">
            ${book.price.toFixed(2)}
          </span>
          <AddToCartButton book={book} />
        </div>

        {book.stock_quantity > 0 && book.stock_quantity <= 5 && (
          <p className="text-[10px] text-amber-600 font-medium">Only {book.stock_quantity} left</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Book Row (list) ──────────────────────────────────────────────────────────

function BookCardList({ book }: { book: Book }) {
  return (
    <motion.div
      variants={cardVariants}
      className="group flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_-6px_rgba(0,0,0,0.14)] transition-shadow duration-300"
    >
      <Link href={`/book-detail?id=${book.id}`} className="shrink-0">
        <div className="h-28 w-20 overflow-hidden rounded-xl bg-[var(--accent-light)]">
          <img
            src={book.cover_image}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                `https://placehold.co/80x112/f0e6d3/5c5240?text=${encodeURIComponent(book.title)}`;
            }}
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
          {book.genre}
        </span>
        <Link href={`/book-detail?id=${book.id}`}>
          <h3 className="font-display text-sm font-bold leading-snug text-[var(--foreground)] hover:text-[var(--accent)] transition-colors line-clamp-1">
            {book.title}
          </h3>
        </Link>
        <p className="text-xs text-[var(--muted-foreground)]">{book.author}</p>
        <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mt-0.5">{book.description}</p>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-display text-base font-bold text-[var(--foreground)]">
              ${book.price.toFixed(2)}
            </span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-[var(--accent)] text-[var(--accent)]" />
              <span className="text-xs font-semibold text-[var(--foreground)]">{book.rating.toFixed(1)}</span>
            </div>
          </div>
          <AddToCartButton book={book} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const t = useTranslations();

  // ── Supabase fetch ──────────────────────────────────────────────────────────
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("books")
      .select("*")
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to fetch books:", error);
          setFetchError(error.message);
        } else {
          setBooks((data as Book[]) ?? []);
        }
        setLoading(false);
      });
  }, []);

  // ── Filter / sort / search state ────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("bestsellers");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const searchRef = useRef<HTMLInputElement>(null);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, selectedGenre, selectedPriceRange, sortBy]);

  // ── Derived data ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...books];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.genre.toLowerCase().includes(q)
      );
    }

    if (selectedGenre !== "all") {
      result = result.filter((b) => b.genre === selectedGenre);
    }

    if (selectedPriceRange !== null) {
      const range = PRICE_RANGES[selectedPriceRange];
      result = result.filter((b) => b.price >= range.min && b.price < range.max);
    }

    switch (sortBy) {
      case "bestsellers":
        result.sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
        break;
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        // Without a date field, keep original order
        break;
    }

    return result;
  }, [books, search, selectedGenre, selectedPriceRange, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setSelectedGenre("all");
    setSelectedPriceRange(null);
    setSortBy("bestsellers");
    setPage(1);
  }, []);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedGenre !== "all" ||
    selectedPriceRange !== null ||
    sortBy !== "bestsellers";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Hero ── */}
      <Reveal>
        <section className="bg-[var(--primary)] py-14 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-3">
              Our Collection
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-white tracking-tight text-balance mb-4">
              Browse the Catalog
            </h1>
            <p className="text-white/60 text-base md:text-lg max-w-xl leading-relaxed">
              Thousands of titles across every genre. Free shipping on orders over ${FREE_SHIPPING_THRESHOLD}.
            </p>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* ── Search + Controls bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or genre…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] pl-9 pr-9 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition-all cursor-pointer"
            aria-label="Sort books"
          >
            <option value="bestsellers">Bestsellers</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
              showFilters
                ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--accent)]"
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

          {/* View toggle */}
          <div className="flex rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              className={cn(
                "flex items-center justify-center px-3 py-2.5 transition-colors",
                viewMode === "grid"
                  ? "bg-[var(--accent)] text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              aria-label="List view"
              className={cn(
                "flex items-center justify-center px-3 py-2.5 transition-colors",
                viewMode === "list"
                  ? "bg-[var(--accent)] text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
          >
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Genre */}
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                  Genre
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedGenre("all")}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-all",
                      selectedGenre === "all"
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--accent-light)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--primary)]"
                    )}
                  >
                    All
                  </button>
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGenre(g)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-all",
                        selectedGenre === g
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--accent-light)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--primary)]"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="sm:w-48">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                  Price Range
                </p>
                <div className="flex flex-col gap-1.5">
                  {PRICE_RANGES.map((range, idx) => (
                    <button
                      key={range.label}
                      onClick={() =>
                        setSelectedPriceRange(selectedPriceRange === idx ? null : idx)
                      }
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-left transition-all",
                        selectedPriceRange === idx
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--accent-light)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--primary)]"
                      )}
                    >
                      {selectedPriceRange === idx && <Check className="h-3 w-3" />}
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear all filters
              </button>
            )}
          </motion.div>
        )}

        {/* ── Results count ── */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-[var(--muted-foreground)]">
            {loading ? (
              "Loading books…"
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span>{" "}
                books
              </>
            )}
          </p>
          {hasActiveFilters && !loading && (
            <button
              onClick={clearFilters}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── Error state ── */}
        {fetchError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center mb-6">
            <p className="text-sm font-medium text-red-700">Failed to load books: {fetchError}</p>
            <p className="text-xs text-red-500 mt-1">Please try refreshing the page.</p>
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading && (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5"
                : "flex flex-col gap-4"
            )}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ── Book grid / list ── */}
        {!loading && !fetchError && (
          <>
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-4 text-5xl">📚</div>
                <h3 className="font-display text-xl font-bold text-[var(--foreground)] mb-2">
                  No Books Found
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-xs">
                  Try adjusting your filters or search term.
                </p>
                <button
                  onClick={clearFilters}
                  className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <motion.div
                key={`${page}-${viewMode}`}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5"
                    : "flex flex-col gap-4"
                )}
              >
                {paginated.map((book) =>
                  viewMode === "grid" ? (
                    <BookCardGrid key={book.id} book={book} />
                  ) : (
                    <BookCardList key={book.id} book={book} />
                  )
                )}
              </motion.div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] disabled:opacity-40 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  if (
                    p === 1 ||
                    p === totalPages ||
                    (p >= page - 1 && p <= page + 1)
                  ) {
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        aria-label={`Page ${p}`}
                        aria-current={p === page ? "page" : undefined}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition-all",
                          p === page
                            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--primary)]"
                            : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        )}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === page - 2 || p === page + 2) {
                    return (
                      <span key={p} className="text-[var(--muted-foreground)] text-sm">
                        …
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] disabled:opacity-40 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
