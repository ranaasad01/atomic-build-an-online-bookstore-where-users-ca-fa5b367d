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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_BOOKS = [
  {
    id: "1",
    title: "The Midnight Library",
    author: "Matt Haig",
    genre: "Fiction",
    price: 16.99,
    rating: 4.7,
    coverImage: "/images/book-midnight-library.jpg",
    isBestseller: true,
    isFeatured: true,
    stockQuantity: 24,
    description:
      "Between life and death there is a library, and within that library, the shelves go on forever.",
  },
  {
    id: "2",
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Self-Help",
    price: 18.99,
    rating: 4.9,
    coverImage: "/images/book-atomic-habits.jpg",
    isBestseller: true,
    isFeatured: true,
    stockQuantity: 50,
    description:
      "Tiny changes, remarkable results. An easy and proven way to build good habits and break bad ones.",
  },
  {
    id: "3",
    title: "Project Hail Mary",
    author: "Andy Weir",
    genre: "Science Fiction",
    price: 17.99,
    rating: 4.8,
    coverImage: "/images/book-project-hail-mary.jpg",
    isBestseller: true,
    isFeatured: false,
    stockQuantity: 18,
    description:
      "A lone astronaut must save the earth from disaster in this propulsive science-fiction thriller.",
  },
  {
    id: "4",
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    genre: "Fantasy",
    price: 15.99,
    rating: 4.6,
    coverImage: "/images/book-name-of-the-wind.jpg",
    isBestseller: false,
    isFeatured: true,
    stockQuantity: 12,
    description:
      "The tale of Kvothe, a legendary figure who grew from a gifted young man to a notorious wizard.",
  },
  {
    id: "5",
    title: "Gone Girl",
    author: "Gillian Flynn",
    genre: "Mystery & Thriller",
    price: 14.99,
    rating: 4.4,
    coverImage: "/images/book-gone-girl.jpg",
    isBestseller: true,
    isFeatured: false,
    stockQuantity: 30,
    description:
      "On a warm summer morning in North Carthage, Missouri, it is Nick and Amy Dunne's fifth wedding anniversary.",
  },
  {
    id: "6",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    genre: "History",
    price: 19.99,
    rating: 4.7,
    coverImage: "/images/book-sapiens.jpg",
    isBestseller: true,
    isFeatured: true,
    stockQuantity: 40,
    description:
      "A brief history of humankind, from the Stone Age to the twenty-first century.",
  },
  {
    id: "7",
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    genre: "Literary Fiction",
    price: 15.99,
    rating: 4.8,
    coverImage: "/images/book-evelyn-hugo.jpg",
    isBestseller: true,
    isFeatured: false,
    stockQuantity: 22,
    description:
      "A reclusive Hollywood icon finally tells her story to an unknown journalist.",
  },
  {
    id: "8",
    title: "Educated",
    author: "Tara Westover",
    genre: "Memoir",
    price: 16.99,
    rating: 4.7,
    coverImage: "/images/book-educated.jpg",
    isBestseller: false,
    isFeatured: false,
    stockQuantity: 15,
    description:
      "A memoir about a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD.",
  },
  {
    id: "9",
    title: "The Hitchhiker's Guide to the Galaxy",
    author: "Douglas Adams",
    genre: "Science Fiction",
    price: 13.99,
    rating: 4.8,
    coverImage: "/images/book-hitchhikers-guide.jpg",
    isBestseller: false,
    isFeatured: false,
    stockQuantity: 35,
    description:
      "Seconds before Earth is demolished for a hyperspace bypass, Arthur Dent is whisked off the planet.",
  },
  {
    id: "10",
    title: "Normal People",
    author: "Sally Rooney",
    genre: "Literary Fiction",
    price: 14.99,
    rating: 4.3,
    coverImage: "/images/book-normal-people.jpg",
    isBestseller: false,
    isFeatured: false,
    stockQuantity: 20,
    description:
      "Connell and Marianne grow up in the same small town in rural Ireland, but the similarities end there.",
  },
  {
    id: "11",
    title: "Becoming",
    author: "Michelle Obama",
    genre: "Memoir",
    price: 19.99,
    rating: 4.9,
    coverImage: "/images/book-becoming.jpg",
    isBestseller: true,
    isFeatured: false,
    stockQuantity: 45,
    description:
      "An intimate, powerful, and inspiring memoir by the former First Lady of the United States.",
  },
  {
    id: "12",
    title: "The Alchemist",
    author: "Paulo Coelho",
    genre: "Fiction",
    price: 13.99,
    rating: 4.5,
    coverImage: "/images/book-the-alchemist.jpg",
    isBestseller: true,
    isFeatured: false,
    stockQuantity: 60,
    description:
      "A magical story about following your dreams and listening to your heart.",
  },
  {
    id: "13",
    title: "Dune",
    author: "Frank Herbert",
    genre: "Science Fiction",
    price: 18.99,
    rating: 4.8,
    coverImage: "/images/book-dune.jpg",
    isBestseller: true,
    isFeatured: true,
    stockQuantity: 28,
    description:
      "Set in the distant future amidst a feudal interstellar society, Dune tells the story of young Paul Atreides.",
  },
  {
    id: "14",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Literary Fiction",
    price: 11.99,
    rating: 4.2,
    coverImage: "/images/book-great-gatsby.jpg",
    isBestseller: false,
    isFeatured: false,
    stockQuantity: 55,
    description:
      "A portrait of the Jazz Age in all of its decadence and excess, set against the backdrop of the American Dream.",
  },
  {
    id: "15",
    title: "Think Again",
    author: "Adam Grant",
    genre: "Self-Help",
    price: 17.99,
    rating: 4.5,
    coverImage: "/images/book-think-again.jpg",
    isBestseller: false,
    isFeatured: false,
    stockQuantity: 33,
    description:
      "The power of knowing what you don't know. A book about the benefit of doubt.",
  },
  {
    id: "16",
    title: "Rebecca",
    author: "Daphne du Maurier",
    genre: "Mystery & Thriller",
    price: 13.99,
    rating: 4.6,
    coverImage: "/images/book-rebecca.jpg",
    isBestseller: false,
    isFeatured: false,
    stockQuantity: 18,
    description:
      "Last night I dreamt I went to Manderley again. A gothic masterpiece of suspense and romance.",
  },
];

const BOOKS_PER_PAGE = 9;

const PRICE_RANGES = [
  { label: "Under $15", min: 0, max: 15 },
  { label: "$15 to $18", min: 15, max: 18 },
  { label: "$18 and above", min: 18, max: Infinity },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "title", label: "Title A-Z" },
];

const CATALOG_GENRES = [
  "All",
  ...new Set(MOCK_BOOKS.map((b) => b.genre)),
] as string[];

const CATALOG_AUTHORS = [
  ...new Set(MOCK_BOOKS.map((b) => b.author)),
].sort();

// ─── Cart helpers (localStorage) ─────────────────────────────────────────────

function getCart(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("pt_cart") ?? "{}");
  } catch {
    return {};
  }
}

function saveCart(cart: Record<string, number>) {
  localStorage.setItem("pt_cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-[var(--accent)] text-[var(--accent)]" />
      <span className="text-xs font-medium text-[hsl(var(--foreground))]">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

interface BookCardGridProps {
  book: (typeof MOCK_BOOKS)[0];
  onAddToCart: (id: string) => void;
  addedId: string | null;
  t: ReturnType<typeof useTranslations>;
}

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function BookCardGrid({ book, onAddToCart, addedId, t }: BookCardGridProps) {
  const added = addedId === book.id;
  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative flex flex-col rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_12px_32px_-8px_rgba(0,0,0,0.14)] transition-shadow duration-300"
    >
      {book.isBestseller && (
        <span className="absolute top-3 left-3 z-10 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
          {t("catalog.badge.bestseller")}
        </span>
      )}
      <Link href={`/book/${book.id}`} className="block overflow-hidden">
        <div className="relative h-52 w-full bg-[hsl(var(--muted))]">
          <img
            src={book.coverImage}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                `https://picsum.photos/seed/${book.id}/300/400`;
            }}
          />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/book/${book.id}`}>
              <h3 className="font-semibold text-sm leading-snug text-[hsl(var(--foreground))] line-clamp-2 hover:text-[var(--accent)] transition-colors">
                {book.title}
              </h3>
            </Link>
            <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
              {book.author}
            </p>
          </div>
          <StarRating rating={book.rating} />
        </div>
        <span className="inline-block self-start rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
          {book.genre}
        </span>
        <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 leading-relaxed flex-1">
          {book.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-[hsl(var(--border))]">
          <span className="text-base font-bold text-[hsl(var(--foreground))]">
            ${book.price.toFixed(2)}
          </span>
          <button
            onClick={() => onAddToCart(book.id)}
            disabled={book.stockQuantity === 0}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200",
              added
                ? "bg-green-500 text-white"
                : book.stockQuantity === 0
                ? "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
                : "bg-[var(--accent)] text-black hover:opacity-90 active:scale-95"
            )}
            aria-label={`Add ${book.title} to cart`}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" />
                {t("catalog.button.added")}
              </>
            ) : book.stockQuantity === 0 ? (
              t("catalog.button.outOfStock")
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                {t("catalog.button.addToCart")}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface BookCardListProps {
  book: (typeof MOCK_BOOKS)[0];
  onAddToCart: (id: string) => void;
  addedId: string | null;
  t: ReturnType<typeof useTranslations>;
}

function BookCardList({ book, onAddToCart, addedId, t }: BookCardListProps) {
  const added = addedId === book.id;
  return (
    <motion.div
      variants={cardVariant}
      className="group flex gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_12px_32px_-8px_rgba(0,0,0,0.14)] transition-shadow duration-300"
    >
      <Link href={`/book/${book.id}`} className="shrink-0">
        <div className="relative h-28 w-20 overflow-hidden rounded-xl bg-[hsl(var(--muted))]">
          <img
            src={book.coverImage}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                `https://picsum.photos/seed/${book.id}/200/280`;
            }}
          />
          {book.isBestseller && (
            <span className="absolute top-1.5 left-1.5 rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
              {t("catalog.badge.bestseller")}
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/book/${book.id}`}>
              <h3 className="font-semibold text-sm leading-snug text-[hsl(var(--foreground))] hover:text-[var(--accent)] transition-colors line-clamp-1">
                {book.title}
              </h3>
            </Link>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {book.author}
            </p>
          </div>
          <StarRating rating={book.rating} />
        </div>
        <span className="inline-block self-start rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
          {book.genre}
        </span>
        <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 leading-relaxed flex-1">
          {book.description}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold text-[hsl(var(--foreground))]">
            ${book.price.toFixed(2)}
          </span>
          <button
            onClick={() => onAddToCart(book.id)}
            disabled={book.stockQuantity === 0}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200",
              added
                ? "bg-green-500 text-white"
                : book.stockQuantity === 0
                ? "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
                : "bg-[var(--accent)] text-black hover:opacity-90 active:scale-95"
            )}
            aria-label={`Add ${book.title} to cart`}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" />
                {t("catalog.button.added")}
              </>
            ) : book.stockQuantity === 0 ? (
              t("catalog.button.outOfStock")
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                {t("catalog.button.addToCart")}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const t = useTranslations();

  // Filter state
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounce(searchRaw, 280);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(
    null
  );
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAddToCart = useCallback((bookId: string) => {
    const cart = getCart();
    cart[bookId] = (cart[bookId] ?? 0) + 1;
    saveCart(cart);
    setAddedId(bookId);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAddedId(null), 1800);
  }, []);

  // Filtering
  const filtered = useMemo(() => {
    let books = [...MOCK_BOOKS];

    if (search.trim()) {
      const q = search.toLowerCase();
      books = books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.genre.toLowerCase().includes(q)
      );
    }

    if (selectedGenres.length > 0) {
      books = books.filter((b) => selectedGenres.includes(b.genre));
    }

    if (selectedAuthors.length > 0) {
      books = books.filter((b) => selectedAuthors.includes(b.author));
    }

    if (selectedPriceRange !== null) {
      const range = PRICE_RANGES[selectedPriceRange];
      books = books.filter(
        (b) => b.price >= range.min && b.price < range.max
      );
    }

    switch (sortBy) {
      case "price-asc":
        books.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        books.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        books.sort((a, b) => b.rating - a.rating);
        break;
      case "title":
        books.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        books.sort(
          (a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)
        );
    }

    return books;
  }, [search, selectedGenres, selectedAuthors, selectedPriceRange, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / BOOKS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * BOOKS_PER_PAGE,
    safePage * BOOKS_PER_PAGE
  );

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, selectedGenres, selectedAuthors, selectedPriceRange, sortBy]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleAuthor = (author: string) => {
    setSelectedAuthors((prev) =>
      prev.includes(author)
        ? prev.filter((a) => a !== author)
        : [...prev, author]
    );
  };

  const clearAll = () => {
    setSearchRaw("");
    setSelectedGenres([]);
    setSelectedAuthors([]);
    setSelectedPriceRange(null);
    setSortBy("featured");
    setPage(1);
  };

  const hasFilters =
    selectedGenres.length > 0 ||
    selectedAuthors.length > 0 ||
    selectedPriceRange !== null ||
    search.trim().length > 0;

  // ─── Sidebar ────────────────────────────────────────────────────────────────

  const FilterPanel = (
    <aside className="flex flex-col gap-6">
      {/* Genre */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
          {t("catalog.filter.genre")}
        </h3>
        <div className="flex flex-col gap-1.5">
          {CATALOG_GENRES.filter((g) => g !== "All").map((genre) => (
            <label
              key={genre}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                  selectedGenres.includes(genre)
                    ? "border-[var(--accent)] bg-[var(--accent)]"
                    : "border-[hsl(var(--border))] bg-transparent"
                )}
              >
                {selectedGenres.includes(genre) && (
                  <Check className="h-2.5 w-2.5 text-black" />
                )}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={selectedGenres.includes(genre)}
                onChange={() => toggleGenre(genre)}
                aria-label={genre}
              />
              <span className="text-sm text-[hsl(var(--foreground))]">
                {genre}
              </span>
              <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">
                {MOCK_BOOKS.filter((b) => b.genre === genre).length}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
          {t("catalog.filter.price")}
        </h3>
        <div className="flex flex-col gap-1.5">
          {PRICE_RANGES.map((range, i) => (
            <label
              key={range.label}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selectedPriceRange === i
                    ? "border-[var(--accent)] bg-[var(--accent)]"
                    : "border-[hsl(var(--border))] bg-transparent"
                )}
              >
                {selectedPriceRange === i && (
                  <span className="h-1.5 w-1.5 rounded-full bg-black" />
                )}
              </span>
              <input
                type="radio"
                className="sr-only"
                checked={selectedPriceRange === i}
                onChange={() =>
                  setSelectedPriceRange(selectedPriceRange === i ? null : i)
                }
                aria-label={range.label}
              />
              <span className="text-sm text-[hsl(var(--foreground))]">
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Authors */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
          {t("catalog.filter.author")}
        </h3>
        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
          {CATALOG_AUTHORS.map((author) => (
            <label
              key={author}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                  selectedAuthors.includes(author)
                    ? "border-[var(--accent)] bg-[var(--accent)]"
                    : "border-[hsl(var(--border))] bg-transparent"
                )}
              >
                {selectedAuthors.includes(author) && (
                  <Check className="h-2.5 w-2.5 text-black" />
                )}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={selectedAuthors.includes(author)}
                onChange={() => toggleAuthor(author)}
                aria-label={author}
              />
              <span className="text-sm text-[hsl(var(--foreground))] truncate">
                {author}
              </span>
            </label>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] px-3 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          {t("catalog.filter.clearAll")}
        </button>
      )}
    </aside>
  );

  return (
    <main className="min-h-screen bg-[hsl(var(--background))]">
      {/* Page Header */}
      <Reveal>
        <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-10 md:py-14">
          <div className="mx-auto max-w-7xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
              {t("catalog.header.eyebrow")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] md:text-4xl">
              {t("catalog.header.title")}
            </h1>
            <p className="mt-2 text-[hsl(var(--muted-foreground))] max-w-xl">
              {t("catalog.header.subtitle")}
            </p>
            {/* Free shipping banner */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5 text-sm font-medium text-[hsl(var(--foreground))]">
              <ShoppingCart className="h-4 w-4 text-[var(--accent)]" />
              {t("catalog.header.freeShipping", {
                threshold: FREE_SHIPPING_THRESHOLD,
              })}
            </div>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Search + Controls Row */}
        <Reveal>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="search"
                value={searchRaw}
                onChange={(e) => setSearchRaw(e.target.value)}
                placeholder={t("catalog.search.placeholder")}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2.5 pl-9 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 transition-shadow"
              />
              {searchRaw && (
                <button
                  onClick={() => setSearchRaw("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setSidebarOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] lg:hidden hover:bg-[hsl(var(--muted))] transition-colors"
                aria-label="Toggle filters"
              >
                <Filter className="h-4 w-4" />
                {t("catalog.controls.filters")}
                {hasFilters && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[9px] font-bold text-black">
                    {selectedGenres.length +
                      selectedAuthors.length +
                      (selectedPriceRange !== null ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 cursor-pointer"
                aria-label="Sort books"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* View toggle */}
              <div className="flex rounded-xl border border-[hsl(var(--border))] overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2.5 transition-colors",
                    viewMode === "grid"
                      ? "bg-[var(--accent)] text-black"
                      : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                  )}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2.5 transition-colors",
                    viewMode === "list"
                      ? "bg-[var(--accent)] text-black"
                      : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                  )}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Active filter chips */}
        {hasFilters && (
          <Reveal>
            <div className="mb-5 flex flex-wrap gap-2">
              {search.trim() && (
                <span className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs font-medium text-[hsl(var(--foreground))]">
                  &ldquo;{search}&rdquo;
                  <button
                    onClick={() => setSearchRaw("")}
                    aria-label="Remove search filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedGenres.map((g) => (
                <span
                  key={g}
                  className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs font-medium text-[hsl(var(--foreground))]"
                >
                  {g}
                  <button onClick={() => toggleGenre(g)} aria-label={`Remove ${g} filter`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {selectedPriceRange !== null && (
                <span className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs font-medium text-[hsl(var(--foreground))]">
                  {PRICE_RANGES[selectedPriceRange].label}
                  <button
                    onClick={() => setSelectedPriceRange(null)}
                    aria-label="Remove price filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedAuthors.map((a) => (
                <span
                  key={a}
                  className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs font-medium text-[hsl(var(--foreground))]"
                >
                  {a}
                  <button onClick={() => toggleAuthor(a)} aria-label={`Remove ${a} filter`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </Reveal>
        )}

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="absolute left-0 top-0 bottom-0 w-72 overflow-y-auto bg-[hsl(var(--card))] p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-semibold text-[hsl(var(--foreground))]">
                  {t("catalog.filter.title")}
                </h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-1 hover:bg-[hsl(var(--muted))] transition-colors"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                </button>
              </div>
              {FilterPanel}
            </motion.div>
          </div>
        )}

        {/* Main layout: sidebar + grid */}
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  {t("catalog.filter.title")}
                </h2>
                {hasFilters && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  >
                    {t("catalog.filter.clearAll")}
                  </button>
                )}
              </div>
              {FilterPanel}
            </div>
          </div>

          {/* Book grid / list */}
          <div className="flex-1 min-w-0">
            {/* Results count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {filtered.length === 0
                  ? t("catalog.results.none")
                  : t("catalog.results.count", { count: filtered.length })}
              </p>
              {totalPages > 1 && (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {t("catalog.pagination.pageOf", {
                    page: safePage,
                    total: totalPages,
                  })}
                </p>
              )}
            </div>

            {/* Empty state */}
            {paginated.length === 0 ? (
              <Reveal>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] py-20 text-center">
                  <Search className="mb-4 h-10 w-10 text-[hsl(var(--muted-foreground))]" />
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                    {t("catalog.empty.title")}
                  </h3>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))] max-w-xs">
                    {t("catalog.empty.subtitle")}
                  </p>
                  <button
                    onClick={clearAll}
                    className="mt-5 rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
                  >
                    {t("catalog.empty.clearFilters")}
                  </button>
                </div>
              </Reveal>
            ) : viewMode === "grid" ? (
              <motion.div
                key={`grid-${safePage}-${sortBy}-${selectedGenres.join()}-${search}`}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
              >
                {paginated.map((book) => (
                  <BookCardGrid
                    key={book.id}
                    book={book}
                    onAddToCart={handleAddToCart}
                    addedId={addedId}
                    t={t}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key={`list-${safePage}-${sortBy}-${selectedGenres.join()}-${search}`}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-4"
              >
                {paginated.map((book) => (
                  <BookCardList
                    key={book.id}
                    book={book}
                    onAddToCart={handleAddToCart}
                    addedId={addedId}
                    t={t}
                  />
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Reveal>
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="flex items-center gap-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm font-medium text-[hsl(var(--foreground))] disabled:opacity-40 hover:bg-[hsl(var(--muted))] transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("catalog.pagination.prev")}
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={cn(
                            "h-9 w-9 rounded-xl text-sm font-medium transition-colors",
                            p === safePage
                              ? "bg-[var(--accent)] text-black"
                              : "border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                          )}
                          aria-label={`Page ${p}`}
                          aria-current={p === safePage ? "page" : undefined}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="flex items-center gap-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm font-medium text-[hsl(var(--foreground))] disabled:opacity-40 hover:bg-[hsl(var(--muted))] transition-colors"
                    aria-label="Next page"
                  >
                    {t("catalog.pagination.next")}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}