"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Mail, Heart } from 'lucide-react';
import { useTranslations } from "next-intl";
import { APP_NAME, APP_EMAIL } from "@/lib/data";
import { Reveal } from "@/components/Reveal";

const footerLinks = {
  shop: [
    { label: "Browse Catalog", href: "/catalog", key: "catalog" },
    { label: "Cart", href: "/cart", key: "cart" },
  ],
  genres: [
    { label: "Fiction", href: "/catalog?genre=Fiction", key: "fiction" },
    { label: "Non-Fiction", href: "/catalog?genre=Non-Fiction", key: "nonfiction" },
    { label: "Mystery & Thriller", href: "/catalog?genre=Mystery+%26+Thriller", key: "mystery" },
    { label: "Science Fiction", href: "/catalog?genre=Science+Fiction", key: "scifi" },
    { label: "Biography", href: "/catalog?genre=Biography", key: "biography" },
  ],
};

export default function Footer() {
  const t = useTranslations();
  const navT = t.raw("nav") as Record<string, string>;
  const pathname = usePathname();

  const getHref = (href: string) => {
    if (href.startsWith("#")) {
      return pathname === "/" ? href : "/" + href;
    }
    return href;
  };

  return (
    <footer
      className="bg-[var(--primary)] text-white"
      role="contentinfo"
    >
      <Reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 mb-4 group"
                aria-label={`${APP_NAME} — Home`}
              >
                <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--accent)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                  <BookOpen className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />
                </div>
                <span
                  className="text-xl font-bold text-white tracking-tight"
                  style={{ fontFamily: "Playfair Display, Georgia, serif" }}
                >
                  {APP_NAME}
                </span>
              </Link>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs mb-4">
                {t("footer.tagline")}
              </p>
              <a
                href={`mailto:${APP_EMAIL}`}
                className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:text-white transition-colors duration-200"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                {APP_EMAIL}
              </a>
            </div>

            {/* Shop links */}
            <div>
              <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4">
                {t("footer.shopHeading")}
              </h3>
              <ul className="space-y-2">
                {footerLinks.shop.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={getHref(link.href)}
                      className="text-sm text-white/60 hover:text-[var(--accent)] transition-colors duration-200"
                    >
                      {navT[link.key] ?? link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Genre links */}
            <div>
              <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4">
                {t("footer.genresHeading")}
              </h3>
              <ul className="space-y-2">
                {footerLinks.genres.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-[var(--accent)] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40 flex items-center gap-1">
              {t("footer.copyright", { year: new Date().getFullYear(), name: APP_NAME })}
            </p>
            <p className="text-xs text-white/40 flex items-center gap-1">
              {t("footer.madeWith")}
              <Heart className="w-3 h-3 text-[var(--accent)] inline" aria-hidden="true" />
              {t("footer.forReaders")}
            </p>
          </div>
        </div>
      </Reveal>
    </footer>
  );
}