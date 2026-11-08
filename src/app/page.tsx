import Link from "next/link";
import { brands } from "@/data/brands";
import { productById, products } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import ProductMedia from "@/components/ProductMedia";
import OccasionPicker from "@/components/OccasionPicker";
import StylistEntry from "@/components/StylistEntry";
import type { Product } from "@/types";

const HERO_IDS = ["vela-wrap-emerald", "kasa-blazer-navy", "aranya-anarkali-mustard", "meridian-sneaker-white"];
const heroItems = HERO_IDS.map((id) => productById(id)).filter((p): p is Product => Boolean(p));
const trending = products.filter((p) => p.inStock && p.price <= 3500).slice(0, 8);

export default function HomePage() {
  return (
    <>
      <section className="container-page grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_1fr] lg:py-16">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Dress for the occasion. Stay inside the budget.
          </h1>
          <p className="mt-4 max-w-lg text-lg text-stone">
            Tell us where you&apos;re going and what you want to spend. We narrow eight brands down to pieces that fit the moment.
          </p>
          <div className="mt-8 max-w-xl"><OccasionPicker /></div>
        </div>
        <div aria-hidden className="grid grid-cols-2 gap-3 sm:gap-4">
          {heroItems.map((p, i) => (
            <div key={p.id} className={`aspect-[5/6] overflow-hidden rounded-card ${i % 2 === 1 ? "translate-y-6" : ""}`}>
              <ProductMedia product={p} sizes="25vw" />
            </div>
          ))}
        </div>
      </section>

      <StylistEntry />

      <section className="container-page py-10" aria-labelledby="who">
        <h2 id="who" className="sr-only">Shop by department</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { href: "/shop?gender=women", title: "Women", note: "Dresses, kurtas, blazers and the shoes to match", item: productById("vela-floral-lavender"), bg: "bg-peacock-light" },
            { href: "/shop?gender=men", title: "Men", note: "Shirts, chinos, kurtas and leather essentials", item: productById("kasa-oxford-white"), bg: "bg-marigold/25" },
          ].map((d) => (
            <Link key={d.title} href={d.href} className={`group flex items-center justify-between overflow-hidden rounded-2xl ${d.bg} p-6`}>
              <div>
                <p className="font-display text-3xl font-semibold">{d.title}</p>
                <p className="mt-1 max-w-[16rem] text-sm text-ink/70">{d.note}</p>
                <span className="mt-4 inline-block text-sm font-semibold underline underline-offset-4 group-hover:text-peacock">Browse {d.title.toLowerCase()}</span>
              </div>
              {d.item && <div aria-hidden className="h-32 w-28 shrink-0 overflow-hidden rounded-xl"><ProductMedia product={d.item} sizes="120px" /></div>}
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page py-10" aria-labelledby="trending">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="trending" className="font-display text-3xl font-semibold">Easy picks under ₹3,500</h2>
          <Link href="/shop?max=3500" className="text-sm font-semibold underline underline-offset-4 hover:text-peacock">See all</Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {trending.map((p) => (<ProductCard key={p.id} product={p} />))}
        </div>
      </section>

      <section className="container-page py-10" aria-labelledby="brands">
        <h2 id="brands" className="mb-6 font-display text-3xl font-semibold">Shop by brand</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {brands.map((b) => (
            <li key={b.id}>
              <Link href={`/shop?brand=${b.id}`} className="block h-full rounded-card border border-ink/10 bg-white p-4 transition-colors hover:border-peacock">
                <p className="font-display text-lg font-semibold">{b.name}</p>
                <p className="mt-1 text-sm text-stone">{b.tagline}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
