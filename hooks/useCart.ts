"use client";

import { useState, useEffect, useCallback } from "react";
import type { CartItem } from "@/lib/data";

const CART_KEY = "pageturner_cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      saveCart(items);
    }
  }, [items, mounted]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.bookId === item.bookId && i.format === item.format
        );
        if (existing) {
          return prev.map((i) =>
            i.bookId === item.bookId && i.format === item.format
              ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
              : i
          );
        }
        return [...prev, { ...item, quantity: item.quantity ?? 1 }];
      });
    },
    []
  );

  const removeItem = useCallback((bookId: string, format: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.bookId === bookId && i.format === format))
    );
  }, []);

  const updateQuantity = useCallback(
    (bookId: string, format: string, quantity: number) => {
      if (quantity < 1) return;
      setItems((prev) =>
        prev.map((i) =>
          i.bookId === bookId && i.format === format ? { ...i, quantity } : i
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return {
    items,
    totalItems,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    mounted,
  };
}