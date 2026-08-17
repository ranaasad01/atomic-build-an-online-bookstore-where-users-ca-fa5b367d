"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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

        <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
          {book.description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-lg font-bold text-[var(--foreground)]">
            ${book.price.toFixed(2)}
          </span>
          <span
            className={cn(
              "text-xs font-medium",
              book.stock_quantity > 5
                ? "text-emerald-600"
                : book.stock_quantity > 0
                ? "text-amber-600"
                : "text-red-500"
            )}
          >
            {book.stock_quantity === 0
              ? "Out of stock"
              : book.stock_quantity <= 5
              ? `Only ${book.stock_quantity} left`
              : "In stock"}
          </span>
        </div>

        <button
          onClick={() => onAddToCart(book)}
          disabled={outOfStock || isAdded}
          className={cn(
            "mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
            outOfStock
              ? "cursor-not-allowed bg-[var(--border)] text-[var(--muted-foreground)]"
              : isAdded
              ? "bg-emerald-600 text-white"
              : "bg-[var(--primary)] text-white hover:bg-[var(--accent)] hover:text-[var(--primary)]"
          )}
        >
          {isAdded ? (
            <>
              <BookOpen className="h-4 w-4" />
              Added to Cart
            </>
          ) : outOfStock ? (
            "Out of Stock"
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrowseCatalogPage() {
  const t = useTranslations();

  // ── Data state ──
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Filter / sort state ──
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortOption>("bestsellers");
  const [maxPrice, setMaxPrice] = useState<number>(50);
  const [showFilters, setShowFilters] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  // ── Fetch from Supabase ──
  useEffect(() => {
    const supabase = createClient();
    async function fetchBooks() {
      setLoading(true);
      setFetchError(null);
      try {
        const { data, error } = await supabase.from("books").select("*");
        if (error) throw new Error(error.message);
        setBooks((data as Book[]) ?? []);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Failed to load books.");
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  // ── Cart helper ──
  const handleAddToCart = useCallback((book: Book) => {
    try {
      const raw = localStorage.getItem("pageturner_cart");
      const cart = raw ? JSON.parse(raw) : [];
      const existing = cart.find(
        (i: { bookId: string; format: string }) => i.bookId === book.id && i.format === "Paperback"
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
      setAddedId(book.id);
      setTimeout(() => setAddedId(null), 1800);
    } catch {
      // ignore storage errors
    }
  }, []);

  // ── Derived / filtered list ──
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

    if (selectedGenre !== "All") {
      result = result.filter((b) => b.genre === selectedGenre);
    }

    result = result.filter((b) => b.price <= maxPrice);

    switch (sortBy) {
      case "bestsellers":
        result = result.sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
        break;
      case "price-asc":
        result = result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result = result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result = result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        // keep insertion order as proxy for newest
        break;
    }

    return result;
  }, [books, search, selectedGenre, sortBy, maxPrice]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setSelectedGenre("All");
    setSortBy("bestsellers");
    setMaxPrice(50);
  }, []);

  const hasActiveFilters =
    search.trim() !== "" || selectedGenre !== "All" || maxPrice < 50;

  // ── Render ──
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Hero ── */}
      <Reveal>
        <section className="bg-[var(--primary)] py-14 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                Our Collection
              </p>
              <h1
                className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl"
                style={{ fontFamily: "Playfair Display, Georgia, serif" }}
              >
                Browse Every Title
              </h1>
              <p className="mt-4 text-base leading-relaxed text-white/70">
                Thousands of books across every genre. Use the filters below to find your next great read.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Search + Controls ── */}
      <div className="sticky top-16 z-30 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, author, or genre…"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-9 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all duration-200"
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

            {/* Genre select */}
            <div className="relative">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--card)] py-2.5 pl-4 pr-9 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all duration-200 cursor-pointer"
              >
                <option value="All">All Genres</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            </div>

            {/* Sort select */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--card)] py-2.5 pl-4 pr-9 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all duration-200 cursor-pointer"
              >
                <option value="bestsellers">Bestsellers</option>
                <option value="rating">Top Rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            </div>

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
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[9px] font-bold text-[var(--primary)]">
                  !
                </span>
              )}
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="border-t border-[var(--border)] py-4">
              <div className="flex flex-wrap items-end gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Max Price: ${maxPrice}
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={1}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-48 accent-[var(--accent)]"
                  />
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:border-red-300 hover:text-red-500 transition-colors duration-200"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Result count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            {loading ? (
              "Loading books…"
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span>
                {" "}of{" "}
                <span className="font-semibold text-[var(--foreground)]">{books.length}</span>
                {" "}books
              </>
            )}
          </p>
          {hasActiveFilters && !loading && (
            <button
              onClick={clearFilters}
              className="text-xs text-[var(--accent)] hover:underline transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--accent)]" />
              <p className="text-sm text-[var(--muted-foreground)]">Loading books…</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && fetchError && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
            <BookOpen className="h-12 w-12 text-[var(--border)]" />
            <p className="text-base font-semibold text-[var(--foreground)]">Could not load books</p>
            <p className="text-sm text-[var(--muted-foreground)]">{fetchError}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && filtered.length === 0 && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
            <Filter className="h-12 w-12 text-[var(--border)]" />
            <p className="text-base font-semibold text-[var(--foreground)]">No books match your filters</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Try adjusting your genre, price range, or search term.
            </p>
            <button
              onClick={clearFilters}
              className="mt-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent)] hover:text-[var(--primary)] transition-all duration-200"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Book grid */}
        {!loading && !fetchError && filtered.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          >
            {filtered.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onAddToCart={handleAddToCart}
                addedId={addedId}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
