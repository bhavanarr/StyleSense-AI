import Link from "next/link";
import { brandById } from "@/data/brands";
import { discountPct, formatINR } from "@/lib/format";
import type { Product } from "@/types";
import ProductMedia from "./ProductMedia";
import WishlistButton from "./WishlistButton";

export default function ProductCard({ product }: { product: Product }) {
  const brand = brandById(product.brandId);
  const off = discountPct(product.price, product.mrp);
  const sizeLine = product.sizeSystem === "free" ? "One size" : product.sizes.length > 6 ? `${product.sizes[0]}–${product.sizes[product.sizes.length - 1]}` : product.sizes.join("  ");
  return (
    <article className="group relative">
      <Link href={`/product/${product.id}`} className="block focus-visible:outline-offset-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-mist">
          <ProductMedia product={product} className="transition-transform duration-500 group-hover:scale-[1.04]" />
          {!product.inStock ? (
            <span className="absolute left-2 top-2 rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-white">Sold out</span>
          ) : off >= 40 ? (
            <span className="absolute left-2 top-2 rounded-full bg-marigold px-2.5 py-1 text-xs font-semibold text-ink">{off}% off</span>
          ) : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-white/95 px-3 py-2 text-center text-xs font-medium text-ink/80 transition-transform duration-200 group-hover:translate-y-0 group-focus-within:translate-y-0 max-md:hidden">
            Sizes {sizeLine}
          </div>
        </div>
        <div className="mt-3 space-y-0.5">
          <p className="text-xs font-semibold text-peacock">{brand?.name}</p>
          <h3 className="line-clamp-1 text-sm font-medium">{product.name}</h3>
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-semibold">{formatINR(product.price)}</span>
            <span className="text-xs text-stone line-through">{formatINR(product.mrp)}</span>
            {off > 0 && <span className="text-xs font-medium text-emerald-800">{off}% off</span>}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-stone">
            <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full border border-ink/20" style={{ backgroundColor: product.color.hex }} />
            {product.color.name}
          </p>
        </div>
      </Link>
      <WishlistButton productId={product.id} name={product.name} className="absolute right-2 top-2" />
    </article>
  );
}
