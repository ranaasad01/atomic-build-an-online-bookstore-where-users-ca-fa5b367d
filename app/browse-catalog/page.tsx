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
          <p className="text-[10px] text-orange-500 font-medium">
            Only {book.stock_quantity} left
          </p>
        )}
      </div>
    </motion.article>
  );
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrowseCatalogPage() {
  const t = useTranslations();

  // ── Filter / sort state ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("bestsellers");
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(200);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // ── Data state ───────────────────────────────────────────────────────────
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const sortMenuRef = useRef<HTMLDivElement>(null);

  // ── Debounce search ──────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Fetch from Supabase ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchBooks() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        let query = supabase
          .from("books")
          .select(
            "id,title,author,genre,price,rating,rating_count,cover_image,is_bestseller,is_featured,description,stock_quantity"
          );

        // Genre filter — server-side
        if (selectedGenre) {
          query = query.eq("genre", selectedGenre);
        }

        // Search filter — server-side (title OR author)
        if (debouncedSearch) {
          query = query.or(
            `title.ilike.%${debouncedSearch}%,author.ilike.%${debouncedSearch}%`
          );
        }

        // Sorting — server-side
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

        // Price range — server-side
        if (priceMin > 0) {
          query = query.gte("price", priceMin);
        }
        if (priceMax < 200) {
          query = query.lte("price", priceMax);
        }

        const { data, error: fetchError } = await query;

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError.message);
          setBooks([]);
        } else {
          setBooks((data as Book[]) ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load books.");
          setBooks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBooks();
    return () => { cancelled = true; };
  }, [selectedGenre, debouncedSearch, sortBy, priceMin, priceMax]);

  // ── Close sort menu on outside click ────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Add to cart ──────────────────────────────────────────────────────────
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

  // ── Sort label ───────────────────────────────────────────────────────────
  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "bestsellers", label: "Bestsellers" },
    { value: "rating", label: "Top Rated" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "newest", label: "Newest" },
  ];

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Sort";

  const hasActiveFilters =
    selectedGenre !== "" || priceMin > 0 || priceMax < 200;

  function clearFilters() {
    setSelectedGenre("");
    setPriceMin(0);
    setPriceMax(200);
    setSearchQuery("");
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* ── Hero bar ── */}
      <section
        className="border-b"
        style={{
          backgroundColor: "var(--primary)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  {t("catalog.eyebrow")}
                </p>
                <h1
                  className="text-4xl md:text-5xl font-bold tracking-tight text-white"
                  style={{ fontFamily: "Playfair Display, Georgia, serif" }}
                >
                  {t("catalog.heading")}
                </h1>
                <p className="mt-2 text-white/60 text-base">
                  {t("catalog.subheading")}
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "var(--accent)" }}
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("catalog.searchPlaceholder")}
                  className="w-full rounded-xl border bg-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)]/50"
                  style={{ borderColor: "rgba(255,255,255,0.15)" }}
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
          </Reveal>
        </div>
      </section>

      {/* ── Toolbar ── */}
      <div
        className="sticky top-16 z-30 border-b backdrop-blur-md"
        style={{
          backgroundColor: "rgba(245,240,232,0.92)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3 overflow-x-auto scrollbar-none">
            {/* Genre pills */}
            <button
              onClick={() => setSelectedGenre("")}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200",
                selectedGenre === ""
                  ? "bg-[var(--primary)] text-white"
                  : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
              )}
            >
              All
            </button>
            {GENRES.slice(0, 8).map((genre) => (
              <button
                key={genre}
                onClick={() =>
                  setSelectedGenre(selectedGenre === genre ? "" : genre)
                }
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200",
                  selectedGenre === genre
                    ? "bg-[var(--accent)] text-[var(--primary)]"
                    : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                )}
              >
                {genre}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2 shrink-0">
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                  showFilters || hasActiveFilters
                    ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--foreground)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[8px] font-bold text-[var(--primary)]">
                    !
                  </span>
                )}
              </button>

              {/* Sort dropdown */}
              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={() => setShowSortMenu((v) => !v)}
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:border-[var(--accent)] transition-all duration-200"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {currentSortLabel}
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      showSortMenu && "rotate-180"
                    )}
                  />
                </button>
                {showSortMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.14)] z-50 overflow-hidden"
                    style={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                    }}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortBy(opt.value);
                          setShowSortMenu(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-xs font-medium transition-colors duration-150",
                          sortBy === opt.value
                            ? "bg-[var(--accent-light)] text-[var(--foreground)] font-semibold"
                            : "text-[var(--muted-foreground)] hover:bg-[var(--accent-light)] hover:text-[var(--foreground)]"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expanded filter panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t py-4"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex flex-wrap items-end gap-6">
                {/* Genre select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Genre
                  </label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                  >
                    <option value="">All Genres</option>
                    {GENRES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price range */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Price Range
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={priceMax}
                      value={priceMin}
                      onChange={(e) => setPriceMin(Number(e.target.value))}
                      className="w-20 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                      placeholder="Min"
                    />
                    <span className="text-[var(--muted-foreground)] text-sm">–</span>
                    <input
                      type="number"
                      min={priceMin}
                      max={500}
                      value={priceMax === 200 ? "" : priceMax}
                      onChange={(e) =>
                        setPriceMax(
                          e.target.value === "" ? 200 : Number(e.target.value)
                        )
                      }
                      className="w-20 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                      placeholder="Max"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors duration-200"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Result count */}
        {!loading && !error && (
          <p className="mb-6 text-sm text-[var(--muted-foreground)]">
            {books.length === 0
              ? "No books found"
              : `${books.length.toLocaleString("en-US")} book${
                  books.length === 1 ? "" : "s"
                } found`}
            {selectedGenre && (
              <span>
                {" "}in{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  {selectedGenre}
                </span>
              </span>
            )}
          </p>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen
              className="h-12 w-12 mb-4"
              style={{ color: "var(--border)" }}
            />
            <p className="text-lg font-semibold text-[var(--foreground)] mb-1">
              Failed to load books
            </p>
            <p className="text-sm text-[var(--muted-foreground)] max-w-xs">
              {error}
            </p>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen
              className="h-12 w-12 mb-4"
              style={{ color: "var(--border)" }}
            />
            <p className="text-lg font-semibold text-[var(--foreground)] mb-1">
              {t("catalog.noResults")}
            </p>
            <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-xs">
              {t("catalog.noResultsHint")}
            </p>
            <button
              onClick={clearFilters}
              className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors duration-200"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Book grid */}
        {!loading && !error && books.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"
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
      </main>
    </div>
  );
}
