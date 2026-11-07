import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import FilterBar from "@/components/FilterBar";
import ProductCard from "@/components/ProductCard";
import { parseQuery, queryProducts } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Shop" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ShopPage({ searchParams }: Props) {
  const query = parseQuery(await searchParams);
  const items = queryProducts(query);
  const heading = query.gender === "women" ? "Women" : query.gender === "men" ? "Men" : "All products";

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-4xl font-semibold">{heading}</h1>
      <p className="mt-1 text-sm text-stone" aria-live="polite">
        {items.length} {items.length === 1 ? "product" : "products"}
        {query.q ? ` matching “${query.q}”` : ""}
      </p>
      <div className="mt-6 border-y border-ink/10 py-5">
        <Suspense fallback={<div className="h-24" />}><FilterBar /></Suspense>
      </div>
      {items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-display text-2xl font-semibold">Nothing matches those filters</p>
          <p className="mt-2 text-stone">Try a higher budget, a different occasion, or remove a filter.</p>
          <Link href="/shop" className="btn-primary mt-6">Clear all filters</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (<ProductCard key={p.id} product={p} />))}
        </div>
      )}
    </div>
  );
}
