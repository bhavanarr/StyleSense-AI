import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import { brandById } from "@/data/brands";
import { categoryLabel, productById, products } from "@/data/products";
import { discountPct, formatINR } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = productById((await params).id);
  return { title: p ? p.name : "Product not found" };
}

export default async function ProductPage({ params }: Props) {
  const product = productById((await params).id);
  if (!product) notFound();
  const brand = brandById(product.brandId);
  const off = discountPct(product.price, product.mrp);
  const more = products.filter((p) => p.brandId === product.brandId && p.id !== product.id).slice(0, 4);

  return (
    <div className="container-page py-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-stone">
        <Link href="/shop" className="hover:text-ink">Shop</Link> / <Link href={`/shop?category=${product.category}`} className="capitalize hover:text-ink">{categoryLabel(product.category)}</Link>
      </nav>
      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        <div className="aspect-[5/6] overflow-hidden rounded-2xl bg-mist"><ProductImage product={product} /></div>
        <div>
          <Link href={`/shop?brand=${product.brandId}`} className="text-sm font-medium text-peacock underline-offset-4 hover:underline">{brand?.name}</Link>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">{product.name}</h1>
          <p className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-semibold">{formatINR(product.price)}</span>
            <span className="text-stone line-through">{formatINR(product.mrp)}</span>
            {off > 0 && <span className="rounded-full bg-marigold px-2.5 py-0.5 text-xs font-semibold">{off}% off</span>}
          </p>
          <p className="mt-1 text-xs text-stone">Sample price in a demo catalogue.</p>

          <p className="mt-6 flex items-center gap-2 text-sm">
            <span aria-hidden className="inline-block h-4 w-4 rounded-full border border-ink/20" style={{ backgroundColor: product.color.hex }} />
            {product.color.name}
          </p>

          <section className="mt-6" aria-labelledby="sizes">
            <h2 id="sizes" className="text-sm font-semibold">Available sizes{product.sizeSystem === "uk-shoe" ? " (UK)" : product.sizeSystem === "waist" ? " (waist, inches)" : ""}</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((s) => (<li key={s} className="min-w-12 rounded-full border border-ink/20 px-3.5 py-1.5 text-center text-sm">{s}</li>))}
            </ul>
            <p className="mt-2 text-xs text-stone">Sizes vary between brands. Measurement-based size advice is coming next.</p>
          </section>

          <div className="mt-8 rounded-card border border-ink/10 bg-white p-4 text-sm">
            {product.merchantUrl ? (
              <a href={product.merchantUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">Buy from merchant</a>
            ) : (
              <p><strong>Demo product.</strong> This item is part of a fictional sample catalogue, so there is no store link to buy from.</p>
            )}
            {!product.inStock && <p className="mt-2 font-medium text-maroon">Currently sold out in this demo.</p>}
          </div>

          <dl className="mt-8 space-y-3 text-sm">
            <div><dt className="font-semibold">About</dt><dd className="mt-0.5 text-ink/80">{product.description}</dd></div>
            <div><dt className="font-semibold">Material</dt><dd className="mt-0.5 text-ink/80 capitalize">{product.material}</dd></div>
            <div><dt className="font-semibold">Good for</dt><dd className="mt-0.5 capitalize text-ink/80">{product.occasions.join(", ")}</dd></div>
          </dl>
        </div>
      </div>

      {more.length > 0 && (
        <section className="mt-16" aria-labelledby="more">
          <h2 id="more" className="mb-6 font-display text-2xl font-semibold">More from {brand?.name}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {more.map((p) => (<ProductCard key={p.id} product={p} />))}
          </div>
        </section>
      )}
    </div>
  );
}
