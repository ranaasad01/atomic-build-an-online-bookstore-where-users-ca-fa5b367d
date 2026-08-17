"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart, BookOpen } from 'lucide-react';
import { useTranslations } from "next-intl";
import { navLinks, APP_NAME } from "@/lib/data";
import { useCart } from "@/hooks/useCart";

export default function Navbar() {
  const t = useTranslations();
  const navT = t.raw("nav") as Record<string, string>;
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { totalItems } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      if (pathname === "/") {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const getHref = (href: string) => {
    if (href.startsWith("#")) {
      return pathname === "/" ? href : "/" + href;
    }
    return href;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--primary)] shadow-[0_2px_20px_rgba(26,26,46,0.2)]"
          : "bg-[var(--primary)]"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label={`${APP_NAME} — Home`}
          >
            <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--accent)] flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
              <BookOpen className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />
            </div>
            <span
              className="font-display text-xl font-700 text-white tracking-tight"
              style={{ fontFamily: "Playfair Display, Georgia, serif", fontWeight: 700 }}
            >
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks
              .filter((link) => link.key !== "cart")
              .map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.key}
                    href={getHref(link.href)}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`relative px-4 py-2 text-sm font-medium rounded-[var(--radius)] transition-all duration-200 ${
                      isActive
                        ? "text-[var(--accent)]"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {navT[link.key] ?? link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute bottom-0 left-4 right-4 h-0.5 bg-[var(--accent)] rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center w-10 h-10 rounded-[var(--radius)] text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
              aria-label={`Shopping cart, ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
            >
              <ShoppingCart className="w-5 h-5" aria-hidden="true" />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent)] text-[var(--primary)] text-xs font-bold flex items-center justify-center leading-none"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </motion.span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-[var(--radius)] text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden overflow-hidden border-t border-white/10"
          >
            <div className="px-4 py-3 space-y-1 bg-[var(--primary)]">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.key}
                    href={getHref(link.href)}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`flex items-center px-4 py-3 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white/10 text-[var(--accent)]"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {navT[link.key] ?? link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}