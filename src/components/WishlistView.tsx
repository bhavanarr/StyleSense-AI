"use client";

import Link from "next/link";
import { useState } from "react";
import { productById } from "@/data/products";
import { useShop } from "@/lib/store/ShopProvider";
import type { Product } from "@/types";
import ProductCard from "./ProductCard";
import { GridSkeleton } from "./Skeleton";

function QuickAdd({ product }: { product: Product }) {
  const { addToCart, notify } = useShop();
  const [done, setDone] = useState(false);
  if (!product.inStock) return <p className="mt-2 text-xs font-medium text-stone">Sold out</p>;
  if (product.sizeSystem !== "free") {
    return <Link href={`/product/${product.id}`} className="mt-2 inline-block text-sm font-semibold text-peacock underline underline-offset-4">Choose size</Link>;
  }
  return (
    <button type="button" className="btn-outline mt-2 w-full !py-1.5" onClick={() => { const e = addToCart(product.id, product.sizes[0]); if (!e) { setDone(true); notify(`Added ${product.name}`); } }}>
      {done ? "Added ✓" : "Add to cart"}
    </button>
  );
}

export default function WishlistView() {
  const { ready, wishlist, clearWishlist } = useShop();
  if (!ready) return <div className="mt-8"><GridSkeleton count={4} /></div>;

  const items = wishlist.map((id) => productById(id)).filter((p): p is Product => Boolean(p));
  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-2xl font-semibold">Nothing saved yet</p>
        <p className="mx-auto mt-2 max-w-sm text-stone">Tap the heart on any product to keep it here for later.</p>
        <Link href="/shop" className="btn-primary mt-6">Browse the shop</Link>
      </div>
    );
  }
  return (
    <div className="mt-6">
      <button type="button" className="mb-6 text-sm underline underline-offset-4 hover:text-[#B3261E]" onClick={() => { if (window.confirm("Remove everything from your wishlist?")) clearWishlist(); }}>Clear wishlist</button>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (<div key={p.id}><ProductCard product={p} /><QuickAdd product={p} /></div>))}
      </div>
    </div>
  );
}
