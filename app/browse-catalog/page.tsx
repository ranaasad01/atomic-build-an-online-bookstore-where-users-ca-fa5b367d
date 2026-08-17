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
            {outOfStock ? "Out of stock" : isAdded ? "Added!" : "Add to cart"}
          </button>
        </div>
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
          <div className="h-8 bg-[var(--accent-light)] rounded-xl w-24" />
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

  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("bestsellers");
  const [showFilters, setShowFilters] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  // Debounce search input by 400ms
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  // Fetch books from Supabase
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
            "id, title, author, genre, price, rating, rating_count, cover_image, is_bestseller, is_featured, description, stock_quantity"
          );

        if (searchQuery.trim()) {
          query = query.or(
            `title.ilike.%${searchQuery.trim()}%,author.ilike.%${searchQuery.trim()}%`
          );
        }

        if (selectedGenre) {
          query = query.eq("genre", selectedGenre);
        }

        switch (sortOption) {
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

        const { data, error: sbError } = await query;

        if (cancelled) return;

        if (sbError) {
          setError("Failed to load books. Please try again.");
          setBooks([]);
        } else {
          setBooks((data as Book[]) ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError("An unexpected error occurred.");
          setBooks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBooks();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, selectedGenre, sortOption]);

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
      // ignore
    }
    setAddedId(book.id);
    setTimeout(() => setAddedId(null), 1800);
  }, []);

  const clearSearch = () => {
    setInputValue("");
    setSearchQuery("");
  };

  const clearGenre = () => setSelectedGenre("");

  const activeFilterCount = (selectedGenre ? 1 : 0);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <Reveal>
        <section className="bg-[var(--primary)] py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[var(--accent)] text-sm font-semibold uppercase tracking-widest mb-2">
                  {t("catalog.browseLabel") || "Browse"}
                </p>
                <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
                  {t("catalog.title") || "Our Collection"}
                </h1>
                <p className="mt-2 text-white/60 text-sm">
                  {loading
                    ? "Loading books..."
                    : `${books.length.toLocaleString("en-US")} book${books.length !== 1 ? "s" : ""} found`}
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                <input
                  type="search"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Search titles or authors..."
                  className="w-full rounded-xl border border-white/20 bg-white/10 pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 transition-all duration-200"
                />
                {inputValue && (
                  <button
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Filters + Sort bar */}
      <div className="sticky top-16 z-30 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3 overflow-x-auto scrollbar-none">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200",
                showFilters
                  ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--foreground)]"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
              )}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[9px] font-bold text-[var(--primary)]">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Genre pills */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={clearGenre}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                  !selectedGenre
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
                )}
              >
                All
              </button>
              {GENRES.slice(0, 8).map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre === selectedGenre ? "" : genre)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    selectedGenre === genre
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--primary)]"
                      : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
                  )}
                >
                  {genre}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="ml-auto shrink-0 relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--card)] pl-3 pr-8 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all duration-200 cursor-pointer"
              >
                <option value="bestsellers">Bestsellers</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            </div>
          </div>

          {/* Expanded filter panel */}
          {showFilters && (
            <div className="border-t border-[var(--border)] py-4">
              <div className="flex flex-wrap gap-2">
                <p className="w-full text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
                  Genre
                </p>
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre === selectedGenre ? "" : genre)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                      selectedGenre === genre
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
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

      {/* Active filters summary */}
      {(selectedGenre || searchQuery) && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)] font-medium">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-light)] border border-[var(--accent)]/30 px-2.5 py-1 text-xs font-medium text-[var(--foreground)]">
                Search: "{searchQuery}"
                <button onClick={clearSearch} aria-label="Remove search filter">
                  <X className="h-3 w-3 ml-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
                </button>
              </span>
            )}
            {selectedGenre && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-light)] border border-[var(--accent)]/30 px-2.5 py-1 text-xs font-medium text-[var(--foreground)]">
                {selectedGenre}
                <button onClick={clearGenre} aria-label="Remove genre filter">
                  <X className="h-3 w-3 ml-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Book grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-12 w-12 text-[var(--border)] mb-4" />
            <p className="text-[var(--foreground)] font-semibold mb-1">Something went wrong</p>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">{error}</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setInputValue("");
                setSelectedGenre("");
                setSortOption("bestsellers");
              }}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors duration-200"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && !error && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-12 w-12 text-[var(--border)] mb-4" />
            <p className="text-[var(--foreground)] font-semibold mb-1">No books found</p>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Try adjusting your search or filters.
            </p>
            <button
              onClick={() => {
                clearSearch();
                clearGenre();
              }}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-hover)] transition-colors duration-200"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Books grid */}
        {!loading && !error && books.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
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
      </div>
    </div>
  );
}
