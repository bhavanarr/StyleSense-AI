"use client";

import Link from "next/link";
import { useState } from "react";
import { brandById } from "@/data/brands";
import { productById } from "@/data/products";
import { recommendSize } from "@/lib/sizing/recommend";
import { useShop } from "@/lib/store/ShopProvider";
import type { Product } from "@/types";

const SETS = {
  women: ["vela-blouse-blush", "loom-tee-lavender", "aranya-kurta-emerald", "northline-tee-grey", "vela-wrap-emerald", "vela-trousers-navy", "loom-jeans-indigo", "aranya-palazzo-black"],
  men: ["kasa-oxford-white", "loom-tee-white", "aranya-kurta-cream", "northline-tee-grey", "kasa-trouser-charcoal", "loom-jeans-denim", "aranya-churidar-cream", "northline-joggers-charcoal"],
} as const;

const CONF = { high: "High", medium: "Medium", low: "Low" } as const;

/** Same body, different brands: shows why "M" isn't a universal size. */
export default function SizeComparison() {
  const { ready, profile } = useShop();
  const [who, setWho] = useState<"women" | "men">("women");
  if (!ready || !profile) return null;

  const rows = SETS[who].map((id) => productById(id)).filter((p): p is Product => Boolean(p));
  return (
    <section aria-labelledby="compare" className="mt-14">
      <h2 id="compare" className="font-display text-2xl font-semibold">Your size at different brands</h2>
      <p className="mt-1 max-w-2xl text-sm text-stone">The same measurements, run through each brand&apos;s own (illustrative) size chart. Notice the labels differ: a size M at one brand is not an M at another.</p>
      <div className="mt-4 flex gap-2" role="group" aria-label="Show sizes for">
        {(["women", "men"] as const).map((g) => (<button key={g} type="button" className="chip capitalize" aria-pressed={who === g} onClick={() => setWho(g)}>{g}&apos;s styles</button>))}
      </div>
      <div className="mt-4 overflow-x-auto rounded-card border border-ink/10 bg-white">
        <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
          <caption className="sr-only">Suggested size per brand for your measurements</caption>
          <thead><tr className="border-b border-ink/15 bg-mist/60 text-xs"><th scope="col" className="px-3 py-2">Brand</th><th scope="col" className="px-3 py-2">Item</th><th scope="col" className="px-3 py-2">Suggested size</th><th scope="col" className="px-3 py-2">Confidence</th></tr></thead>
          <tbody>
            {rows.map((p) => {
              const r = recommendSize(p, profile);
              return (
                <tr key={p.id} className="border-b border-ink/10 last:border-0">
                  <th scope="row" className="px-3 py-2.5 font-medium">{brandById(p.brandId)?.name}</th>
                  <td className="px-3 py-2.5"><Link href={`/product/${p.id}`} className="underline underline-offset-2 hover:text-peacock">{p.name}</Link></td>
                  {r.status === "ok"
                    ? (<><td className="px-3 py-2.5 font-display text-lg font-semibold text-peacock">{r.size}</td><td className="px-3 py-2.5">{CONF[r.confidence]}</td></>)
                    : (<td colSpan={2} className="px-3 py-2.5 text-stone">{r.status === "insufficient" ? `Needs your ${r.missing.join(" and ") || "measurements"}` : "No suggestion available"}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
