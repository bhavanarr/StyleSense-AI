import Link from "next/link";
import { brandById } from "@/data/brands";
import { discountPct, formatINR } from "@/lib/format";
import type { Product } from "@/types";
import ProductImage from "./ProductImage";

export default function ProductCard({ product }: { product: Product }) {
  const brand = brandById(product.brandId);
  const off = discountPct(product.price, product.mrp);
  return (
    <article className="group relative">
      <Link href={`/product/${product.id}`} className="block focus-visible:outline-offset-4">
        <div className="relative aspect-[5/6] overflow-hidden rounded-card bg-mist">
          <ProductImage product={product} className="transition-transform duration-300 group-hover:scale-[1.03]" />
          {!product.inStock && (
            <span className="absolute left-2 top-2 rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-white">Sold out</span>
          )}
          {off > 0 && product.inStock && (
            <span className="absolute left-2 top-2 rounded-full bg-marigold px-2.5 py-1 text-xs font-semibold text-ink">{off}% off</span>
          )}
        </div>
        <div className="mt-3 space-y-0.5">
          <p className="text-xs font-medium text-stone">{brand?.name}</p>
          <h3 className="line-clamp-1 text-sm font-semibold">{product.name}</h3>
          <p className="flex items-baseline gap-2 text-sm">
            <span className="font-semibold">{formatINR(product.price)}</span>
            <span className="text-xs text-stone line-through">{formatINR(product.mrp)}</span>
          </p>
          <p className="flex items-center gap-1.5 text-xs text-stone">
            <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full border border-ink/20" style={{ backgroundColor: product.color.hex }} />
            {product.color.name}
          </p>
        </div>
      </Link>
    </article>
  );
}
