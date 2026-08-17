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
    isBestseller: false,
    rating: 4.6,
    pages: 288,
  },
  {
    id: "4",
    title: "Inheritance of Storms",
    author: "Callum Reyes",
    description:
      "Set across three generations of a Basque fishing family, this is a novel about loyalty, loss, and the sea's long memory. A richly atmospheric historical epic that confirms Reyes as one of the most important voices in contemporary fiction.",
    genre: "Historical Fiction",
    price: 19.99,
    coverImage: "/images/book-inheritance-storms-historical.jpg",
    isbn: "978-0-593-31089-4",
    publisher: "Penguin Press",
    publishedAt: "2023-01-17",
    stockQuantity: 33,
    isFeatured: true,
    isBestseller: false,
    rating: 4.8,
    pages: 448,
  },
  {
    id: "5",
    title: "How to Think Like a Naturalist",
    author: "Dr. Priya Anand",
    description:
      "A field guide to slowing down and reading the living world around you, from a celebrated wildlife biologist. Part memoir, part manifesto, this book will change the way you walk through the world.",
    genre: "Nature & Science",
    price: 22.99,
    coverImage: "/images/book-think-like-naturalist-science.jpg",
    isbn: "978-0-316-70284-1",
    publisher: "Little, Brown and Company",
    publishedAt: "2023-04-11",
    stockQuantity: 19,
    isFeatured: true,
    isBestseller: false,
    rating: 4.9,
    pages: 256,
  },
  {
    id: "6",
    title: "The Midnight Archivist",
    author: "Saoirse Flynn",
    description:
      "A Dublin librarian stumbles upon a decades-old murder hidden inside a returned book's annotations. A gripping mystery that celebrates the power of books and the secrets they keep. Over 12,000 copies sold.",
    genre: "Mystery & Thriller",
    price: 15.99,
    coverImage: "/images/book-midnight-archivist-mystery.jpg",
    isbn: "978-1-982-18234-9",
    publisher: "Simon & Schuster",
    publishedAt: "2022-11-01",
    stockQuantity: 67,
    isFeatured: false,
    isBestseller: true,
    rating: 4.8,
    pages: 368,
  },
  {
    id: "7",
    title: "Borrowed Light",
    author: "Theo Nakamura",
    description:
      "A quiet, devastating novel about two estranged siblings who reconnect while clearing out their childhood home. Staff favourite for three months running, this is a book about grief, forgiveness, and the objects we leave behind.",
    genre: "Contemporary Fiction",
    price: 13.99,
    coverImage: "/images/book-borrowed-light-contemporary.jpg",
    isbn: "978-0-374-60234-8",
    publisher: "Farrar, Straus and Giroux",
    publishedAt: "2023-02-28",
    stockQuantity: 44,
    isFeatured: false,
    isBestseller: true,
    rating: 4.6,
    pages: 272,
  },
  {
    id: "8",
    title: "Empire of Roots",
    author: "Adaeze Obi",
    description:
      "A richly imagined epic following a West African botanist whose plant specimens reshape the course of colonial-era science. A triumphant novel about knowledge, power, and who gets to write history.",
    genre: "Historical Fiction",
    price: 17.99,
    coverImage: "/images/book-empire-roots-historical.jpg",
    isbn: "978-0-593-44521-3",
    publisher: "Knopf",
    publishedAt: "2022-08-16",
    stockQuantity: 38,
    isFeatured: false,
    isBestseller: true,
    rating: 4.7,
    pages: 512,
  },
  {
    id: "9",
    title: "The Pragmatist's Guide to Almost Everything",
    author: "Harriet Bloom",
    description:
      "Sharp, funny, and genuinely useful — the rare self-help book that respects your intelligence. Bloom dismantles the platitudes of the wellness industry and replaces them with evidence-based strategies that actually work.",
    genre: "Self-Help",
    price: 12.99,
    coverImage: "/images/book-pragmatist-guide-selfhelp.jpg",
    isbn: "978-1-250-78901-2",
    publisher: "St. Martin's Press",
    publishedAt: "2023-05-09",
    stockQuantity: 82,
    isFeatured: false,
    isBestseller: true,
    rating: 4.5,
    pages: 224,
  },
  {
    id: "10",
    title: "Children of the Slow River",
    author: "Yusuf Demirel",
    description:
      "Longlisted for the International Booker Prize, this novel follows four strangers whose lives converge on a single night in Istanbul. A masterwork of quiet devastation that asks what connects us across the divides of language and culture.",
    genre: "Literary Fiction",
    price: 16.99,
    coverImage: "/images/book-children-slow-river-literary.jpg",
    isbn: "978-0-374-60891-3",
    publisher: "Farrar, Straus and Giroux",
    publishedAt: "2022-10-04",
    stockQuantity: 29,
    isFeatured: false,
    isBestseller: true,
    rating: 4.7,
    pages: 304,
  },
  {
    id: "11",
    title: "Starfall Academy: The Obsidian Gate",
    author: "Cassidy Park",
    description:
      "The third instalment in the beloved Starfall series — darker, bolder, and impossible to read in one sitting. The stakes have never been higher as our heroes face a threat that could unravel the fabric of the Academy itself.",
    genre: "Young Adult",
    price: 11.99,
    coverImage: "/images/book-starfall-academy-ya-fantasy.jpg",
    isbn: "978-0-525-70123-6",
    publisher: "Delacorte Press",
    publishedAt: "2023-07-11",
    stockQuantity: 91,
    isFeatured: false,
    isBestseller: true,
    rating: 4.8,
    pages: 416,
  },
  {
    id: "12",
    title: "The Midnight Library",
    author: "Matt Haig",
    description:
      "A dazzling novel about all the lives we could have lived, and the one that matters most. Between life and death there is a library, and within that library, the shelves go on forever.",
    genre: "Fiction",
    price: 14.99,
    coverImage: "/images/book-midnight-library-fiction.jpg",
    isbn: "978-0-525-55947-4",
    publisher: "Viking",
    publishedAt: "2020-09-29",
    stockQuantity: 74,
    isFeatured: false,
    isBestseller: false,
    rating: 4.7,
    pages: 304,
  },
  {
    id: "13",
    title: "Educated",
    author: "Tara Westover",
    description:
      "A memoir of a woman who grew up in the mountains of Idaho and went on to earn a PhD from Cambridge. An unforgettable testament to the power of education to transform and liberate.",
    genre: "Biography",
    price: 13.99,
    coverImage: "/images/book-educated-memoir-biography.jpg",
    isbn: "978-0-399-59050-4",
    publisher: "Random House",
    publishedAt: "2018-02-20",
    stockQuantity: 88,
    isFeatured: false,
    isBestseller: false,
    rating: 4.8,
    pages: 352,
  },
  {
    id: "14",
    title: "Project Hail Mary",
    author: "Andy Weir",
    description:
      "A lone astronaut must save Earth from disaster in this propulsive, feel-good thriller. Ryland Grace wakes up alone on a spacecraft with no memory of how he got there — and the fate of humanity resting on his shoulders.",
    genre: "Science Fiction",
    price: 16.99,
    coverImage: "/images/book-project-hail-mary-scifi.jpg",
    isbn: "978-0-593-13520-4",
    publisher: "Ballantine Books",
    publishedAt: "2021-05-04",
    stockQuantity: 63,
    isFeatured: false,
    isBestseller: false,
    rating: 4.9,
    pages: 476,
  },
  {
    id: "15",
    title: "Atomic Habits",
    author: "James Clear",
    description:
      "Tiny changes, remarkable results: a proven framework for building good habits and breaking bad ones. Clear distills the most fundamental information about habit formation into a practical guide that will reshape the way you think about progress.",
    genre: "Self-Help",
    price: 17.99,
    coverImage: "/images/book-atomic-habits-selfhelp.jpg",
    isbn: "978-0-735-21129-2",
    publisher: "Avery",
    publishedAt: "2018-10-16",
    stockQuantity: 120,
    isFeatured: false,
    isBestseller: false,
    rating: 4.8,
    pages: 320,
  },
  {
    id: "16",
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    description:
      "The riveting first-person narrative of Kvothe, a legendary figure even in his own time. A tale of a young man who grows to be the most notorious wizard his world has ever seen.",
    genre: "Fantasy",
    price: 15.99,
    coverImage: "/images/book-name-of-wind-fantasy.jpg",
    isbn: "978-0-756-40407-1",
    publisher: "DAW Books",
    publishedAt: "2007-03-27",
    stockQuantity: 47,
    isFeatured: false,
    isBestseller: false,
    rating: 4.6,
    pages: 662,
  },
  {
    id: "17",
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    description:
      "A bold, panoramic view of the history of our species from the Stone Age to the twenty-first century. Harari explores the ways in which biology and history have defined us and enhanced our understanding of what it means to be human.",
    genre: "History",
    price: 15.99,
    coverImage: "/images/book-sapiens-history-humankind.jpg",
    isbn: "978-0-062-31609-7",
    publisher: "Harper",
    publishedAt: "2015-02-10",
    stockQuantity: 95,
    isFeatured: false,
    isBestseller: false,
    rating: 4.7,
    pages: 443,
  },
  {
    id: "18",
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    description:
      "A haunting tale of a young woman who raised herself in the marshes of North Carolina. Part coming-of-age story, part love story, part mystery — a novel that will stay with you long after the final page.",
    genre: "Mystery & Thriller",
    price: 13.99,
    coverImage: "/images/book-crawdads-sing-mystery.jpg",
    isbn: "978-0-735-22454-4",
    publisher: "G.P. Putnam's Sons",
    publishedAt: "2018-08-14",
    stockQuantity: 76,
    isFeatured: false,
    isBestseller: false,
    rating: 4.6,
    pages: 384,
  },
  {
    id: "19",
    title: "Dune",
    author: "Frank Herbert",
    description:
      "The epic saga of politics, religion, and survival on the desert planet Arrakis — the greatest science fiction novel ever written. Set in the far future amidst a feudal interstellar society, Dune tells the story of young Paul Atreides.",
    genre: "Science Fiction",
    price: 14.99,
    coverImage: "/images/book-dune-scifi-classic.jpg",
    isbn: "978-0-441-01359-7",
    publisher: "Ace Books",
    publishedAt: "1965-08-01",
    stockQuantity: 58,
    isFeatured: false,
    isBestseller: false,
    rating: 4.8,
    pages: 688,
  },
  {
    id: "20",
    title: "Circe",
    author: "Madeline Miller",
    description:
      "The spellbinding story of the witch of Greek myth — her origins, her powers, and her place in a world of gods and monsters. A bold and subversive retelling that asks what it means to be a woman in a world ruled by men.",
    genre: "Fantasy",
    price: 14.99,
    coverImage: "/images/book-circe-fantasy-mythology.jpg",
    isbn: "978-0-316-55634-7",
    publisher: "Little, Brown and Company",
    publishedAt: "2018-04-10",
    stockQuantity: 52,
    isFeatured: false,
    isBestseller: false,
    rating: 4.7,
    pages: 393,
  },
  {
    id: "21",
    title: "The Covenant of Water",
    author: "Abraham Verghese",
    description:
      "Spanning seventy-seven years and three generations of a family in South India, this is a luminous novel about love, faith, and the bonds that hold us together across time and distance.",
    genre: "Literary Fiction",
    price: 17.99,
    coverImage: "/images/book-covenant-water-literary.jpg",
    isbn: "978-0-802-16097-2",
    publisher: "Grove Press",
    publishedAt: "2023-05-02",
    stockQuantity: 34,
    isFeatured: false,
    isBestseller: false,
    rating: 4.8,
    pages: 736,
  },
  {
    id: "22",
    title: "Tomorrow, and Tomorrow, and Tomorrow",
    author: "Gabrielle Zevin",
    description:
      "A dazzling novel about two friends who build video games together over thirty years. A story about love, creativity, identity, failure, and the ways in which a work of art can outlast us all.",
    genre: "Literary Fiction",
    price: 15.99,
    coverImage: "/images/book-tomorrow-tomorrow-literary.jpg",
    isbn: "978-0-593-32122-7",
    publisher: "Knopf",
    publishedAt: "2022-07-05",
    stockQuantity: 41,
    isFeatured: false,
    isBestseller: false,
    rating: 4.6,
    pages: 401,
  },
  {
    id: "23",
    title: "Demon Copperhead",
    author: "Barbara Kingsolver",
    description:
      "Winner of the Pulitzer Prize, this is a retelling of David Copperfield set in the mountains of Appalachia. A searing indictment of the opioid crisis told through the eyes of a boy who refuses to be broken.",
    genre: "Literary Fiction",
    price: 16.99,
    coverImage: "/images/book-demon-copperhead-literary.jpg",
    isbn: "978-0-063-23201-2",
    publisher: "Harper",
    publishedAt: "2022-10-18",
    stockQuantity: 39,
    isFeatured: false,
    isBestseller: false,
    rating: 4.7,
    pages: 560,
  },
  {
    id: "24",
    title: "Lessons in Chemistry",
    author: "Bonnie Garmus",
    description:
      "A chemist turned cooking show host in the 1960s inspires a nation of housewives to think for themselves. A witty, warm, and fiercely feminist novel that became one of the most beloved debuts of the decade.",
    genre: "Literary Fiction",
    price: 14.99,
    coverImage: "/images/book-lessons-chemistry-literary.jpg",
    isbn: "978-0-385-54734-9",
    publisher: "Doubleday",
    publishedAt: "2022-04-05",
    stockQuantity: 66,
    isFeatured: false,
    isBestseller: false,
    rating: 4.6,
    pages: 390,
  },
];