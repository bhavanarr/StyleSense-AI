"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartLine } from "@/types";
import { addLine, CART_KEY, parseCart, parseWishlist, removeLine, setQty as setQtyPure, toggleId, validateAdd, WISHLIST_KEY } from "./cart";

/**
 * Client-side store for cart + wishlist, persisted in localStorage.
 *  - `ready` is false until localStorage has been read, so pages show a skeleton instead of
 *    flashing an empty cart (and server and client HTML always match).
 *  - Reads are validated through parseCart/parseWishlist; writes never throw (private mode / quota).
 *  - Changes sync across browser tabs through the "storage" event.
 */
interface ShopContextValue {
  ready: boolean;
  storageError: boolean;
  cart: CartLine[];
  wishlist: string[];
  cartCount: number;
  /** Returns an error message, or null on success. */
  addToCart: (productId: string, size: string | null, qty?: number) => string | null;
  setQty: (productId: string, size: string, qty: number) => void;
  removeFromCart: (productId: string, size: string) => void;
  clearCart: () => void;
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (id: string) => void;
  addManyToWishlist: (ids: string[]) => number;
  clearWishlist: () => void;
  notify: (message: string) => void;
}

const Ctx = createContext<ShopContextValue | null>(null);

export function useShop(): ShopContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useShop must be used inside <ShopProvider>");
  return v;
}

export default function ShopProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load once on the client.
  useEffect(() => {
    try {
      setCart(parseCart(localStorage.getItem(CART_KEY)));
      setWishlist(parseWishlist(localStorage.getItem(WISHLIST_KEY)));
    } catch {
      setStorageError(true);
    }
    setReady(true);
  }, []);

  // Persist after the initial load.
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [cart, wishlist, ready]);

  // Keep other open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setCart(parseCart(e.newValue));
      if (e.key === WISHLIST_KEY) setWishlist(parseWishlist(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const value = useMemo<ShopContextValue>(() => ({
    ready,
    storageError,
    cart,
    wishlist,
    cartCount: cart.reduce((n, l) => n + l.qty, 0),
    addToCart: (productId, size, qty = 1) => {
      const err = validateAdd(productId, size);
      if (err) return err;
      setCart((prev) => addLine(prev, productId, size as string, qty));
      return null;
    },
    setQty: (productId, size, qty) => setCart((prev) => setQtyPure(prev, productId, size, qty)),
    removeFromCart: (productId, size) => setCart((prev) => removeLine(prev, productId, size)),
    clearCart: () => setCart([]),
    isWishlisted: (id) => wishlist.includes(id),
    toggleWishlist: (id) => {
      const adding = !wishlist.includes(id);
      setWishlist((prev) => toggleId(prev, id));
      notify(adding ? "Saved to wishlist" : "Removed from wishlist");
    },
    addManyToWishlist: (ids) => {
      const fresh = ids.filter((id) => !wishlist.includes(id));
      if (fresh.length) setWishlist((prev) => [...prev, ...fresh.filter((id) => !prev.includes(id))]);
      notify(fresh.length ? `Saved ${fresh.length} ${fresh.length === 1 ? "item" : "items"} to wishlist` : "Already in your wishlist");
      return fresh.length;
    },
    clearWishlist: () => setWishlist([]),
    notify,
  }), [ready, storageError, cart, wishlist, notify]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-6">
        {toast && <p className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white shadow-lg">{toast}</p>}
      </div>
    </Ctx.Provider>
  );
}
