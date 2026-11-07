import { brandById } from "@/data/brands";
import { products } from "@/data/products";
import { discountPct } from "./format";
import type { CatalogueQuery, Category, Gender, Occasion, Product, SortKey } from "@/types";

/**
 * Pure functions so the same logic can later run in the browser, on the server,
 * or against Supabase results without changes.
 */
export function queryProducts(query: CatalogueQuery, source: Product[] = products): Product[] {
  const tokens = (query.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);

  const result = source.filter((p) => {
    // "men" shows men's + unisex; "women" shows women's + unisex.
    if (query.gender && query.gender !== "all" && p.gender !== query.gender && p.gender !== "unisex") return false;
    if (query.category && p.category !== query.category) return false;
    if (query.brandId && p.brandId !== query.brandId) return false;
    if (query.occasion && !p.occasions.includes(query.occasion)) return false;
    if (query.maxPrice !== undefined && p.price > query.maxPrice) return false;
    if (tokens.length) {
      const haystack = [p.name, p.category, p.color.name, p.material, brandById(p.brandId)?.name ?? "", ...p.styles, ...p.occasions]
        .join(" ")
        .toLowerCase();
      if (!tokens.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });

  return sortProducts(result, query.sort ?? "featured");
}

export function sortProducts(list: Product[], sort: SortKey): Product[] {
  const copy = [...list];
  switch (sort) {
    case "price-asc": return copy.sort((a, b) => a.price - b.price);
    case "price-desc": return copy.sort((a, b) => b.price - a.price);
    case "discount": return copy.sort((a, b) => discountPct(b.price, b.mrp) - discountPct(a.price, a.mrp));
    default: // featured: in-stock first, otherwise keep curated order
      return copy.sort((a, b) => Number(b.inStock) - Number(a.inStock));
  }
}

const GENDERS: Gender[] = ["men", "women", "unisex"];
const SORTS: SortKey[] = ["featured", "price-asc", "price-desc", "discount"];
export const OCCASIONS: Occasion[] = ["casual", "college", "office", "party", "wedding", "farewell", "birthday", "date", "festive"];
export const CATEGORIES: Category[] = ["tshirt", "shirt", "kurta", "dress", "top", "jeans", "trousers", "skirt", "jacket", "shoes", "watch", "bag", "accessory"];

type Raw = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Turns untrusted URL params into a validated query: anything unrecognised is dropped. */
export function parseQuery(raw: Raw): CatalogueQuery {
  const gender = first(raw.gender);
  const category = first(raw.category);
  const occasion = first(raw.occasion);
  const sort = first(raw.sort);
  const brand = first(raw.brand);
  const max = Number(first(raw.max));
  return {
    gender: GENDERS.includes(gender as Gender) ? (gender as Gender) : "all",
    category: CATEGORIES.includes(category as Category) ? (category as Category) : undefined,
    occasion: OCCASIONS.includes(occasion as Occasion) ? (occasion as Occasion) : undefined,
    brandId: brand && brandById(brand) ? brand : undefined,
    maxPrice: Number.isFinite(max) && max > 0 ? max : undefined,
    q: first(raw.q)?.slice(0, 60) || undefined,
    sort: SORTS.includes(sort as SortKey) ? (sort as SortKey) : "featured",
  };
}
