export interface NavLink {
  label: string;
  href: string;
  key: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  genre: string;
  price: number;
  coverImage: string;
  isbn?: string;
  publisher?: string;
  publishedAt?: string;
  stockQuantity: number;
  isFeatured: boolean;
  isBestseller: boolean;
  rating: number;
  pages?: number;
}

export interface CartItem {
  bookId: string;
  title: string;
  author: string;
  price: number;
  coverImage: string;
  quantity: number;
  format: string;
}

export interface OrderData {
  id: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingName: string;
  shippingEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingMethod: string;
  createdAt: string;
}

export const APP_NAME = "PageTurner";
export const APP_TAGLINE = "Every great story begins with a single page.";
export const APP_EMAIL = "hello@pageturner.store";
export const FREE_SHIPPING_THRESHOLD = 40;
export const STANDARD_SHIPPING = 4.99;
export const EXPRESS_SHIPPING = 12.99;
export const TAX_RATE = 0.08;

export const navLinks: NavLink[] = [
  { label: "Home", href: "/", key: "home" },
  { label: "Browse", href: "/catalog", key: "catalog" },
  { label: "Cart", href: "/cart", key: "cart" },
  { label: "Login", href: "/login", key: "login" },
  { label: "Sign Up", href: "/signup", key: "signup" },
];

export const GENRES = [
  "Fiction",
  "Non-Fiction",
  "Mystery & Thriller",
  "Science Fiction",
  "Fantasy",
  "Biography",
  "History",
  "Self-Help",
  "Science",
  "Romance",
  "Young Adult",
  "Memoir",
  "Nature & Science",
  "Historical Fiction",
  "Literary Fiction",
  "Contemporary Fiction",
];

export const BOOKS: Book[] = [
  {
    id: "1",
    title: "The Cartographer of Lost Hours",
    author: "Elena Vasquez",
    description:
      "A sweeping debut about a mapmaker who discovers her late grandmother's secret correspondence hidden inside antique atlases. A sweeping, intimate novel set across three generations of a family navigating love, loss, and the quiet courage it takes to begin again. Shortlisted for the Booker Prize and praised by critics as 'the most affecting debut of the decade,' this is a book that lingers long after the final page.",
    genre: "Literary Fiction",
    price: 18.99,
    coverImage: "/images/book-cartographer-lost-hours.jpg",
    isbn: "978-0-385-54734-2",
    publisher: "Knopf Doubleday Publishing Group",
    publishedAt: "2023-03-14",
    stockQuantity: 42,
    isFeatured: true,
    isBestseller: false,
    rating: 4.7,
    pages: 336,
  },
  {
    id: "2",
    title: "Quiet Algorithms",
    author: "James Okafor",
    description:
      "A near-future thriller exploring what happens when an AI trained on humanity's greatest novels begins writing its own. A propulsive, thought-provoking novel that asks what it means to be human in an age of machine creativity.",
    genre: "Science Fiction",
    price: 16.99,
    coverImage: "/images/book-quiet-algorithms-scifi.jpg",
    isbn: "978-0-525-55360-5",
    publisher: "Riverhead Books",
    publishedAt: "2023-06-20",
    stockQuantity: 28,
    isFeatured: true,
    isBestseller: false,
    rating: 4.5,
    pages: 312,
  },
  {
    id: "3",
    title: "The Bread & Salt Diaries",
    author: "Mira Holst",
    description:
      "A James Beard Award-winning chef traces her family's migration through the recipes that survived every border crossing. A memoir of food, memory, and belonging that will make you hungry and homesick in equal measure.",
    genre: "Memoir",
    price: 14.99,
    coverImage: "/images/book-bread-salt-diaries-memoir.jpg",
    isbn: "978-1-250-31456-7",
    publisher: "Flatiron Books",
    publishedAt: "2022-09-06",
    stockQuantity: 55,
    isFeatured: true,
    isBestseller: true,
    rating: 4.8,
    pages: 288,
  },
  {
    id: "4",
    title: "The Midnight Theorem",
    author: "Alistair Crane",
    description:
      "A brilliant mathematician receives an anonymous proof that could upend modern physics — and a death threat if she publishes it. A taut, cerebral thriller that races from Cambridge to Kyoto.",
    genre: "Mystery & Thriller",
    price: 15.99,
    coverImage: "/images/book-midnight-theorem-thriller.jpg",
    isbn: "978-0-593-31089-4",
    publisher: "Penguin Press",
    publishedAt: "2023-01-17",
    stockQuantity: 33,
    isFeatured: false,
    isBestseller: true,
    rating: 4.6,
    pages: 368,
  },
  {
    id: "5",
    title: "Roots of the Sky",
    author: "Amara Diallo",
    description:
      "An epic multigenerational saga following a West African family from the colonial era to the present day, told through the eyes of five women across five decades.",
    genre: "Historical Fiction",
    price: 17.99,
    coverImage: "/images/book-roots-sky-historical.jpg",
    isbn: "978-0-374-60012-3",
    publisher: "Farrar, Straus and Giroux",
    publishedAt: "2022-11-01",
    stockQuantity: 19,
    isFeatured: true,
    isBestseller: false,
    rating: 4.9,
    pages: 512,
  },
  {
    id: "6",
    title: "The Habit Architect",
    author: "Dr. Lena Park",
    description:
      "A neuroscientist distills a decade of research into a practical, compassionate guide to building habits that actually stick — without relying on willpower.",
    genre: "Self-Help",
    price: 13.99,
    coverImage: "/images/book-habit-architect-selfhelp.jpg",
    isbn: "978-0-593-44821-0",
    publisher: "Crown Publishing",
    publishedAt: "2023-04-04",
    stockQuantity: 78,
    isFeatured: false,
    isBestseller: true,
    rating: 4.4,
    pages: 256,
  },
  {
    id: "7",
    title: "Starfall",
    author: "Cora Nightingale",
    description:
      "In a world where stars are living gods, a young astronomer discovers she can hear them dying — and that someone is silencing them one by one. A luminous, inventive fantasy debut.",
    genre: "Fantasy",
    price: 16.99,
    coverImage: "/images/book-starfall-fantasy.jpg",
    isbn: "978-1-250-88234-1",
    publisher: "Tor Books",
    publishedAt: "2023-07-11",
    stockQuantity: 41,
    isFeatured: true,
    isBestseller: false,
    rating: 4.7,
    pages: 448,
  },
  {
    id: "8",
    title: "The Last Beekeeper",
    author: "Thomas Wren",
    description:
      "As colony collapse disorder wipes out the world's bees, one stubborn apiarist in rural Vermont refuses to give up. A quiet, devastating novel about loss, community, and what we owe the natural world.",
    genre: "Contemporary Fiction",
    price: 15.99,
    coverImage: "/images/book-last-beekeeper-fiction.jpg",
    isbn: "978-0-385-54901-8",
    publisher: "Doubleday",
    publishedAt: "2022-08-23",
    stockQuantity: 24,
    isFeatured: false,
    isBestseller: false,
    rating: 4.3,
    pages: 304,
  },
];
