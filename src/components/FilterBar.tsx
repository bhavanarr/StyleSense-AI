"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { brands } from "@/data/brands";
import { CATEGORIES, OCCASIONS } from "@/lib/catalogue";
import { formatINR } from "@/lib/format";
import type { Category } from "@/types";

const CATEGORY_LABEL: Record<Category, string> = {
  tshirt: "T-shirts", shirt: "Shirts", kurta: "Kurtas", dress: "Dresses", top: "Tops", jeans: "Jeans",
  trousers: "Trousers", skirt: "Skirts", jacket: "Jackets and blazers", shoes: "Footwear",
  watch: "Watches", bag: "Bags", accessory: "Accessories",
};
const PRICE_STEPS = [1000, 2000, 3000, 5000];
const GENDERS = [
  { value: "", label: "All" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
];

const selectCls = "w-full rounded-full border border-ink/20 bg-white px-3.5 py-2 text-sm";

export default function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const get = (k: string) => params.get(k) ?? "";

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    router.replace(`/shop${next.toString() ? `?${next}` : ""}`, { scroll: false });
  }

  const hasFilters = Array.from(params.keys()).length > 0;
  const activeCount = ["occasion", "category", "brand", "max", "sort"].filter((k) => params.get(k)).length;
  // Treat a max price that isn't one of the presets (e.g. from the homepage slider) as its own option.
  const max = get("max");
  const maxOptions = max && !PRICE_STEPS.includes(Number(max)) && Number(max) > 0 ? [...PRICE_STEPS, Number(max)].sort((a, b) => a - b) : PRICE_STEPS;

  return (
    <div className="space-y-4" role="group" aria-label="Filter products">
      <div className="flex flex-wrap items-center gap-2">
        {GENDERS.map((g) => (
          <button key={g.label} type="button" className="chip" aria-pressed={get("gender") === g.value} onClick={() => set("gender", g.value)}>{g.label}</button>
        ))}
        <button type="button" className="chip md:hidden" aria-expanded={open} aria-controls="more-filters" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide filters" : `More filters${activeCount ? ` (${activeCount})` : ""}`}
        </button>
        {hasFilters && <Link href="/shop" className="ml-auto text-sm font-semibold underline underline-offset-4 hover:text-peacock">Clear all</Link>}
      </div>
      <div id="more-filters" className={`${open ? "grid" : "hidden"} grid-cols-2 gap-3 md:grid md:grid-cols-5`}>
        <label className="text-xs font-medium text-stone">Occasion
          <select className={selectCls} value={get("occasion")} onChange={(e) => set("occasion", e.target.value)}>
            <option value="">Any</option>
            {OCCASIONS.map((o) => (<option key={o} value={o} className="capitalize">{o[0].toUpperCase() + o.slice(1)}</option>))}
          </select>
        </label>
        <label className="text-xs font-medium text-stone">Category
          <select className={selectCls} value={get("category")} onChange={(e) => set("category", e.target.value)}>
            <option value="">All</option>
            {CATEGORIES.map((c) => (<option key={c} value={c}>{CATEGORY_LABEL[c]}</option>))}
          </select>
        </label>
        <label className="text-xs font-medium text-stone">Brand
          <select className={selectCls} value={get("brand")} onChange={(e) => set("brand", e.target.value)}>
            <option value="">All</option>
            {brands.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>
        </label>
        <label className="text-xs font-medium text-stone">Price
          <select className={selectCls} value={max} onChange={(e) => set("max", e.target.value)}>
            <option value="">Any</option>
            {maxOptions.map((n) => (<option key={n} value={n}>Up to {formatINR(n)}</option>))}
          </select>
        </label>
        <label className="col-span-2 text-xs font-medium text-stone md:col-span-1">Sort by
          <select className={selectCls} value={get("sort") || "featured"} onChange={(e) => set("sort", e.target.value === "featured" ? "" : e.target.value)}>
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="discount">Biggest discount</option>
          </select>
        </label>
      </div>
    </div>
  );
}
