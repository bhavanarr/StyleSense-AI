import { productById } from "@/data/products";
import type { CartLine, Product } from "@/types";

/**
 * Pure cart + wishlist logic: no React, no browser APIs. That makes it unit-testable
 * (scripts/test-cart.ts) and means corrupted localStorage can never crash the UI.
 */
export const MAX_QTY = 10;
export const CART_KEY = "stylesense.cart.v1";
export const WISHLIST_KEY = "stylesense.wishlist.v1";

/** Returns a user-facing reason the item can't be added, or null if it can. */
export function validateAdd(productId: string, size: string | null): string | null {
  const p = productById(productId);
  if (!p) return "This product is no longer available.";
  if (!p.inStock) return "This item is sold out.";
  if (!size) return "Choose a size first.";
  if (!p.sizes.includes(size)) return "That size isn't available for this item.";
  return null;
}

const same = (l: CartLine, id: string, size: string) => l.productId === id && l.size === size;
const clamp = (n: number) => Math.max(1, Math.min(MAX_QTY, Math.floor(n)));

export function addLine(lines: CartLine[], productId: string, size: string, qty = 1): CartLine[] {
  if (validateAdd(productId, size)) return lines;
  const existing = lines.find((l) => same(l, productId, size));
  if (existing) return lines.map((l) => (l === existing ? { ...l, qty: clamp(l.qty + qty) } : l));
  return [...lines, { productId, size, qty: clamp(qty) }];
}

/** qty <= 0 removes the line. */
export function setQty(lines: CartLine[], productId: string, size: string, qty: number): CartLine[] {
  if (!Number.isFinite(qty) || qty <= 0) return removeLine(lines, productId, size);
  return lines.map((l) => (same(l, productId, size) ? { ...l, qty: clamp(qty) } : l));
}

export const removeLine = (lines: CartLine[], productId: string, size: string): CartLine[] =>
  lines.filter((l) => !same(l, productId, size));

export interface DetailedLine extends CartLine { product: Product; lineTotal: number }

export function cartTotals(lines: CartLine[]) {
  const detailed: DetailedLine[] = [];
  for (const l of lines) {
    const product = productById(l.productId);
    if (product) detailed.push({ ...l, product, lineTotal: product.price * l.qty });
  }
  const count = detailed.reduce((n, l) => n + l.qty, 0);
  const subtotal = detailed.reduce((n, l) => n + l.lineTotal, 0);
  const mrpTotal = detailed.reduce((n, l) => n + l.product.mrp * l.qty, 0);
  return { lines: detailed, count, subtotal, mrpTotal, savings: mrpTotal - subtotal };
}

/** Defensive parse: anything malformed, unknown or tampered with is dropped, never thrown. */
export function parseCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return []; }
  if (!Array.isArray(data)) return [];
  let out: CartLine[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const { productId, size, qty } = item as Record<string, unknown>;
    if (typeof productId !== "string" || typeof size !== "string" || typeof qty !== "number") continue;
    const p = productById(productId);
    if (!p || !p.sizes.includes(size) || !Number.isFinite(qty) || qty < 1) continue;
    const existing = out.find((l) => same(l, productId, size));
    out = existing
      ? out.map((l) => (l === existing ? { ...l, qty: clamp(l.qty + qty) } : l))
      : [...out, { productId, size, qty: clamp(qty) }];
  }
  return out;
}

export function parseWishlist(raw: string | null): string[] {
  if (!raw) return [];
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return []; }
  if (!Array.isArray(data)) return [];
  return Array.from(new Set(data.filter((id): id is string => typeof id === "string" && Boolean(productById(id)))));
}

export const toggleId = (list: string[], id: string): string[] =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
