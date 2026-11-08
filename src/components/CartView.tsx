"use client";

import Link from "next/link";
import { brandById } from "@/data/brands";
import { discountPct, formatINR } from "@/lib/format";
import { cartTotals, MAX_QTY } from "@/lib/store/cart";
import { useShop } from "@/lib/store/ShopProvider";
import ProductMedia from "./ProductMedia";
import { Skeleton } from "./Skeleton";

export default function CartView() {
  const { ready, cart, setQty, removeFromCart, clearCart, toggleWishlist, isWishlisted, storageError } = useShop();

  if (!ready) {
    return (
      <div role="status" aria-label="Loading your cart" className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-56" />
      </div>
    );
  }

  const t = cartTotals(cart);

  if (t.lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-2xl font-semibold">Your cart is empty</p>
        <p className="mx-auto mt-2 max-w-sm text-stone">Pick a size on any product page and add it here. Or ask the stylist for a full outfit.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-primary">Browse the shop</Link>
          <Link href="/stylist" className="btn-outline">Ask the AI Stylist</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        {storageError && <p role="alert" className="mb-4 rounded-card bg-marigold/25 p-3 text-sm">Your browser is blocking storage, so this cart won&apos;t be remembered after you close the tab.</p>}
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {t.lines.map((l) => {
            const off = discountPct(l.product.price, l.product.mrp);
            return (
              <li key={`${l.productId}-${l.size}`} className="flex gap-4 py-5">
                <Link href={`/product/${l.productId}`} className="relative h-32 w-24 shrink-0 overflow-hidden rounded-card bg-mist sm:h-36 sm:w-28">
                  <ProductMedia product={l.product} sizes="120px" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-xs font-semibold text-peacock">{brandById(l.product.brandId)?.name}</p>
                  <Link href={`/product/${l.productId}`} className="font-medium hover:underline">{l.product.name}</Link>
                  <p className="mt-0.5 text-sm text-stone">{l.product.color.name}{l.product.sizeSystem === "free" ? "" : `, size ${l.size}`}</p>
                  <p className="mt-1 text-sm"><span className="font-semibold">{formatINR(l.product.price)}</span> <span className="text-xs text-stone line-through">{formatINR(l.product.mrp)}</span> {off > 0 && <span className="text-xs text-emerald-800">{off}% off</span>}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-3">
                    <div className="inline-flex items-center rounded-full border border-ink/20" role="group" aria-label={`Quantity for ${l.product.name}`}>
                      <button type="button" aria-label="Decrease quantity" onClick={() => setQty(l.productId, l.size, l.qty - 1)} className="h-8 w-8 rounded-full hover:bg-white">−</button>
                      <output aria-live="polite" className="w-7 text-center text-sm font-semibold">{l.qty}</output>
                      <button type="button" aria-label="Increase quantity" disabled={l.qty >= MAX_QTY} onClick={() => setQty(l.productId, l.size, l.qty + 1)} className="h-8 w-8 rounded-full hover:bg-white disabled:opacity-30">+</button>
                    </div>
                    <button type="button" onClick={() => removeFromCart(l.productId, l.size)} className="text-sm underline underline-offset-4 hover:text-[#B3261E]">Remove</button>
                    <button type="button" onClick={() => { if (!isWishlisted(l.productId)) toggleWishlist(l.productId); removeFromCart(l.productId, l.size); }} className="text-sm underline underline-offset-4 hover:text-peacock">Save for later</button>
                    <p className="ml-auto text-sm font-semibold">{formatINR(l.lineTotal)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <button type="button" className="mt-4 text-sm underline underline-offset-4 hover:text-[#B3261E]" onClick={() => { if (window.confirm("Remove everything from your cart?")) clearCart(); }}>Clear cart</button>
      </div>

      <aside aria-label="Order summary" className="h-fit rounded-2xl border border-ink/10 bg-white p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-xl font-semibold">Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Items ({t.count})</dt><dd>{formatINR(t.mrpTotal)}</dd></div>
          <div className="flex justify-between text-emerald-800"><dt>Discount</dt><dd>−{formatINR(t.savings)}</dd></div>
          <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatINR(t.subtotal)}</dd></div>
        </dl>
        <p className="mt-4 rounded-card bg-mist p-3 text-xs text-ink/80">Demo catalogue: these items are fictional, so checkout isn&apos;t available. Your cart is saved on this device only.</p>
        <Link href="/shop" className="btn-outline mt-4 w-full">Keep shopping</Link>
      </aside>
    </div>
  );
}
