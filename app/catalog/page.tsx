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
        t("catalog.outOfStock")
      ) : (
        <><ShoppingCart className="h-3.5 w-3.5" />{t("catalog.addToCart")}</>
      )}
    </button>
  );
}

// ─── Star rating ──────────────────────────────────────────────────────────────

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

// ─── Book card (grid) ─────────────────────────────────────────────────────────

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

        <StarRating rating={book.rating} />

        <div className="mt-auto flex items-center justify-between pt-2">
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

// ─── Book card (list) ─────────────────────────────────────────────────────────

function BookCardList({ book }: { book: Book }) {
  return (
    <motion.article
      variants={cardVariants}
      className="group flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.14)]"
    >
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

      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div>
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

        <StarRating rating={book.rating} />

        <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
          {book.description}
        </p>

        <div className="mt-auto flex items-center gap-4">
          <span className="font-display text-lg font-bold text-[var(--foreground)]">
            ${book.price.toFixed(2)}
          </span>
          <AddToCartButton book={book} />
          {book.is_bestseller && (
            <span className="rounded-full bg-[var(--accent-light)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
              Bestseller
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("bestsellers");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Data state ────────────────────────────────────────────────────────────
  const [books, setBooks] = useState<Book[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search to avoid firing on every keystroke
  const searchRef = useRef(searchQuery);
  searchRef.current = searchQuery;
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchRef.current), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 whenever filters/sort/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGenre, selectedPriceRange, debouncedSearch, sortBy]);

  // ── Supabase fetch ────────────────────────────────────────────────────────
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
            { count: "exact" }
          );

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

        // Search filter
        if (debouncedSearch.trim()) {
          const term = debouncedSearch.trim();
          query = query.or(`title.ilike.%${term}%,author.ilike.%${term}%`);
        }

        // Sort
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

        const { data, count, error: supabaseError } = await query;

        if (cancelled) return;

        if (supabaseError) {
          throw new Error(supabaseError.message);
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
    return () => { cancelled = true; };
  }, [selectedGenre, selectedPriceRange, debouncedSearch, sortBy, currentPage]);

  // ── Derived values ────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasActiveFilters = !!selectedGenre || selectedPriceRange !== null || !!debouncedSearch.trim();

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedGenre("");
    setSelectedPriceRange(null);
    setSortBy("bestsellers");
    setCurrentPage(1);
  }, []);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "bestsellers", label: t("catalog.sortBestsellers") },
    { value: "newest", label: t("catalog.sortNewest") },
    { value: "price-low", label: t("catalog.sortPriceLow") },
    { value: "price-high", label: t("catalog.sortPriceHigh") },
    { value: "rating", label: t("catalog.sortRating") },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
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
            <h1 className="font-display text-3xl font-bold text-white md:text-4xl lg:text-5xl tracking-tight">
              {t("catalog.heading")}
            </h1>
            <p className="mt-3 text-white/70 text-base md:text-lg max-w-xl">
              {t("catalog.subheading")}
            </p>
            {/* Search bar */}
            <div className="mt-6 relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("catalog.searchPlaceholder")}
                className="w-full rounded-2xl border border-white/20 bg-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/50 hover:text-white transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* ── Sidebar ── */}
          <aside
            className={cn(
              "shrink-0 w-64 hidden lg:block",
            )}
          >
            <div className="sticky top-24 space-y-6">
              {/* Genre filter */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider mb-3">
                  Genre
                </h3>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => setSelectedGenre("")}
                      className={cn(
                        "w-full text-left rounded-xl px-3 py-2 text-sm transition-colors duration-150",
                        !selectedGenre
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
                        onClick={() => setSelectedGenre(genre === selectedGenre ? "" : genre)}
                        className={cn(
                          "w-full text-left rounded-xl px-3 py-2 text-sm transition-colors duration-150",
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

              {/* Price range filter */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider mb-3">
                  {t("catalog.priceRange")}
                </h3>
                <ul className="space-y-1">
                  {PRICE_RANGES.map((range, idx) => (
                    <li key={range.label}>
                      <button
                        onClick={() =>
                          setSelectedPriceRange(selectedPriceRange === idx ? null : idx)
                        }
                        className={cn(
                          "w-full text-left rounded-xl px-3 py-2 text-sm transition-colors duration-150 flex items-center justify-between",
                          selectedPriceRange === idx
                            ? "bg-[var(--accent-light)] text-[var(--foreground)] font-semibold"
                            : "text-[var(--muted-foreground)] hover:bg-[var(--accent-light)] hover:text-[var(--foreground)]"
                        )}
                      >
                        {range.label}
                        {selectedPriceRange === idx && (
                          <Check className="h-3.5 w-3.5 text-[var(--accent)]" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors font-medium"
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
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent-light)] transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  {t("catalog.filters")}
                  {hasActiveFilters && (
                    <span className="ml-1 rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                      !
                    </span>
                  )}
                </button>

                {/* Result count */}
                {!loading && (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {t("catalog.showing")}{" "}
                    <span className="font-semibold text-[var(--foreground)]">
                      {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalCount)}–
                      {Math.min(currentPage * PAGE_SIZE, totalCount)}
                    </span>{" "}
                    {t("catalog.of")}{" "}
                    <span className="font-semibold text-[var(--foreground)]">{totalCount}</span>{" "}
                    {t("catalog.books")}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--card)] py-2 pl-3 pr-8 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all cursor-pointer"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                </div>

                {/* View toggle */}
                <div className="flex rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-label={t("catalog.gridView")}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === "grid"
                        ? "bg-[var(--accent)] text-[var(--primary)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--accent-light)]"
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label={t("catalog.listView")}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === "list"
                        ? "bg-[var(--accent)] text-[var(--primary)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--accent-light)]"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile sidebar drawer */}
            {sidebarOpen && (
              <div className="lg:hidden mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--foreground)]">{t("catalog.filters")}</h3>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-full p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Genre */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Genre</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedGenre("")}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        !selectedGenre
                          ? "bg-[var(--accent)] text-[var(--primary)]"
                          : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
                      )}
                    >
                      All
                    </button>
                    {GENRES.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => setSelectedGenre(genre === selectedGenre ? "" : genre)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                          selectedGenre === genre
                            ? "bg-[var(--accent)] text-[var(--primary)]"
                            : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
                        )}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                    {t("catalog.priceRange")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PRICE_RANGES.map((range, idx) => (
                      <button
                        key={range.label}
                        onClick={() => setSelectedPriceRange(selectedPriceRange === idx ? null : idx)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                          selectedPriceRange === idx
                            ? "bg-[var(--accent)] text-[var(--primary)]"
                            : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={() => { clearFilters(); setSidebarOpen(false); }}
                    className="text-sm text-[var(--accent)] font-medium hover:text-[var(--accent-hover)] transition-colors"
                  >
                    {t("catalog.clearFilters")}
                  </button>
                )}
              </div>
            )}

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedGenre && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-light)] border border-[var(--accent)]/30 px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                    {selectedGenre}
                    <button onClick={() => setSelectedGenre("")} aria-label="Remove genre filter">
                      <X className="h-3 w-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
                    </button>
                  </span>
                )}
                {selectedPriceRange !== null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-light)] border border-[var(--accent)]/30 px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                    {PRICE_RANGES[selectedPriceRange]?.label}
                    <button onClick={() => setSelectedPriceRange(null)} aria-label="Remove price filter">
                      <X className="h-3 w-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
                    </button>
                  </span>
                )}
                {debouncedSearch.trim() && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-light)] border border-[var(--accent)]/30 px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                    &ldquo;{debouncedSearch.trim()}&rdquo;
                    <button onClick={() => setSearchQuery("")} aria-label="Remove search filter">
                      <X className="h-3 w-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center mb-6">
                <p className="text-sm text-red-600 font-medium">{error}</p>
                <button
                  onClick={() => setCurrentPage((p) => p)}
                  className="mt-3 text-xs text-red-500 underline hover:text-red-700"
                >
                  Try again
                </button>
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

            {/* Empty state */}
            {!loading && !error && books.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-4 rounded-full bg-[var(--accent-light)] p-5">
                  <Search className="h-8 w-8 text-[var(--accent)]" />
                </div>
                <h3 className="font-display text-xl font-bold text-[var(--foreground)] mb-2">
                  {t("catalog.noResults")}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] max-w-xs">
                  {t("catalog.noResultsHint")}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-5 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    {t("catalog.clearFilters")}
                  </button>
                )}
              </div>
            )}

            {/* Book grid / list */}
            {!loading && !error && books.length > 0 && (
              <motion.div
                key={`${currentPage}-${sortBy}-${selectedGenre}-${selectedPriceRange}-${debouncedSearch}`}
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

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label={t("catalog.previous")}
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent-light)] disabled:opacity-40 disabled:cursor-not-allowed"
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
                      if (idx > 0 && (page as number) - (arr[idx - 1] as number) > 1) {
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
                          aria-current={currentPage === item ? "page" : undefined}
                          className={cn(
                            "h-9 w-9 rounded-xl text-sm font-medium transition-colors",
                            currentPage === item
                              ? "bg-[var(--accent)] text-[var(--primary)] font-bold"
                              : "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent-light)]"
                          )}
                        >
                          {item}
                        </button>
                      )
                    )}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label={t("catalog.next")}
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent-light)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t("catalog.next")}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Free shipping nudge */}
            <Reveal className="mt-12">
              <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-light)] p-5 flex items-center gap-4">
                <div className="shrink-0 rounded-full bg-[var(--accent)] p-3">
                  <ShoppingCart className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Free shipping on orders over ${FREE_SHIPPING_THRESHOLD}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Add books to your cart and enjoy free delivery on qualifying orders.
                  </p>
                </div>
                <Link
                  href="/cart"
                  className="ml-auto shrink-0 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent)] hover:text-[var(--primary)] transition-colors"
                >
                  {t("catalog.viewCart")}
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
