"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MAX_QTY } from "@/lib/store/cart";
import { useShop } from "@/lib/store/ShopProvider";
import type { Product } from "@/types";

export default function ProductActions({ product }: { product: Product }) {
  const { addToCart, cart, ready, isWishlisted, toggleWishlist, notify } = useShop();
  const free = product.sizeSystem === "free";
  const [size, setSize] = useState<string | null>(free ? product.sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const inCart = ready && size ? cart.find((l) => l.productId === product.id && l.size === size)?.qty ?? 0 : 0;
  const saved = ready && isWishlisted(product.id);
  const unit = product.sizeSystem === "uk-shoe" ? " (UK)" : product.sizeSystem === "waist" ? " (waist, inches)" : "";

  function add() {
    const err = addToCart(product.id, size, qty);
    setError(err);
    if (err) return;
    setAdded(true);
    notify(`Added ${qty > 1 ? `${qty} × ` : ""}${product.name}${free ? "" : `, size ${size}`}`);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 2500);
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); notify("Link copied"); }
    catch { notify("Couldn't copy automatically. Copy the address from your browser bar."); }
  }

  return (
    <div className="space-y-6">
      {!free && (
        <fieldset disabled={!product.inStock}>
          <legend className="text-sm font-semibold">Select size{unit}</legend>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Size">
            {product.sizes.map((s) => (
              <button key={s} type="button" className="chip min-w-12 justify-center" aria-pressed={size === s}
                onClick={() => { setSize(s); setError(null); }}>{s}</button>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone">Sizes differ between brands. Measurement-based size advice is coming in a later update.</p>
        </fieldset>
      )}

      <div className="flex items-center gap-3">
        <span id="qty-label" className="text-sm font-semibold">Quantity</span>
        <div className="inline-flex items-center rounded-full border border-ink/20" role="group" aria-labelledby="qty-label">
          <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-9 w-9 rounded-full text-lg hover:bg-white disabled:opacity-30">−</button>
          <output aria-live="polite" className="w-8 text-center text-sm font-semibold">{qty}</output>
          <button type="button" aria-label="Increase quantity" disabled={qty >= MAX_QTY} onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} className="h-9 w-9 rounded-full text-lg hover:bg-white disabled:opacity-30">+</button>
        </div>
      </div>

      {error && <p role="alert" className="text-sm font-medium text-[#B3261E]">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={add} disabled={!product.inStock} className="btn-primary min-w-[12rem] flex-1">
          {!product.inStock ? "Sold out" : added ? "Added to cart ✓" : "Add to cart"}
        </button>
        <button type="button" aria-pressed={saved} onClick={() => toggleWishlist(product.id)} className="btn-outline">
          {saved ? "Saved ♥" : "Save to wishlist"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {(added || inCart > 0) && <Link href="/cart" className="font-semibold text-peacock underline underline-offset-4">View cart{inCart > 0 ? ` (${inCart} in cart in this size)` : ""}</Link>}
        <button type="button" onClick={copyLink} className="text-stone underline underline-offset-4 hover:text-ink">Copy link</button>
      </div>

      <div className="rounded-card border border-ink/10 bg-white p-4 text-sm">
        {product.merchantUrl ? (
          <a href={product.merchantUrl} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">Buy from merchant</a>
        ) : (
          <p><strong>Demo product.</strong> This item is part of a fictional sample catalogue, so there is no store link and checkout isn&apos;t available. The cart is for trying out the experience.</p>
        )}
      </div>
    </div>
  );
}
