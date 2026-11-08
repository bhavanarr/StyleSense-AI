"use client";

import Link from "next/link";
import { brandById } from "@/data/brands";
import { formatINR } from "@/lib/format";
import { SLOT_LABEL, type Outfit } from "@/lib/recommend/outfit";
import { useShop } from "@/lib/store/ShopProvider";
import ProductMedia from "./ProductMedia";

function BudgetLine({ outfit }: { outfit: Outfit }) {
  const { totalBudget, perItemMax, within, overBy } = outfit.budget;
  if (totalBudget !== undefined) {
    return within
      ? <p className="text-sm font-medium text-emerald-800">Within your {formatINR(totalBudget)} budget ({formatINR(totalBudget - outfit.total)} to spare)</p>
      : <p role="status" className="text-sm font-semibold text-[#B3261E]">{formatINR(overBy)} over your {formatINR(totalBudget)} budget</p>;
  }
  if (perItemMax !== undefined) {
    return within
      ? <p className="text-sm font-medium text-emerald-800">Every piece is {formatINR(perItemMax)} or less</p>
      : <p role="status" className="text-sm font-semibold text-[#B3261E]">Your pick is above the {formatINR(perItemMax)} per-item limit</p>;
  }
  return null;
}

export default function OutfitView({ outfit, anchorLabel = "Your pick", heading }: { outfit: Outfit; anchorLabel?: string; heading?: string }) {
  const { addManyToWishlist } = useShop();
  const ids = outfit.items.map((i) => i.product.id);
  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4 sm:p-5" aria-label={heading ?? "Outfit"}>
      {heading && <h3 className="mb-3 font-display text-xl font-semibold">{heading}</h3>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {outfit.items.map((i) => (
          <li key={i.product.id}>
            <Link href={`/product/${i.product.id}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-mist">
                <ProductMedia product={i.product} sizes="(min-width: 1024px) 20vw, 45vw" className="transition-transform duration-300 group-hover:scale-[1.03]" />
                <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${i.isAnchor ? "bg-marigold text-ink" : "bg-white/90 text-ink"}`}>
                  {i.isAnchor ? anchorLabel : SLOT_LABEL[i.slot]}
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-peacock">{brandById(i.product.brandId)?.name}</p>
              <p className="line-clamp-1 text-sm font-medium">{i.product.name}</p>
              <p className="text-sm font-semibold">{formatINR(i.product.price)}</p>
            </Link>
            {!i.isAnchor && i.reasons[0] && <p className="mt-1 text-xs leading-snug text-stone">{i.reasons[0]}.</p>}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-ink/10 pt-4">
        <div>
          <p className="text-sm text-stone">Complete outfit, {outfit.items.length} {outfit.items.length === 1 ? "piece" : "pieces"}</p>
          <p className="font-display text-3xl font-semibold">{formatINR(outfit.total)}</p>
          <BudgetLine outfit={outfit} />
        </div>
        <button type="button" className="btn-outline" onClick={() => addManyToWishlist(ids)}>Save outfit to wishlist</button>
      </div>

      {outfit.notes.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-stone">
          {outfit.notes.map((n) => (<li key={n}>{n}</li>))}
        </ul>
      )}
    </section>
  );
}
