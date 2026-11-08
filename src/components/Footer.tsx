import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-ink/10 bg-ink text-chalk">
      <div className="container-page grid gap-8 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-xl font-semibold">StyleSense</p>
          <p className="mt-2 max-w-xs text-sm text-chalk/70">Outfits picked for your occasion and budget.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          <Link href="/shop?gender=women" className="hover:text-marigold">Women</Link>
          <Link href="/shop?gender=men" className="hover:text-marigold">Men</Link>
          <Link href="/shop" className="hover:text-marigold">All products</Link>
          <Link href="/stylist" className="hover:text-marigold">AI Stylist</Link>
          <Link href="/wishlist" className="hover:text-marigold">Wishlist</Link>
          <Link href="/cart" className="hover:text-marigold">Cart</Link>
        </nav>
        <p className="text-sm text-chalk/70">
          Demo catalogue: every brand and product here is fictional and illustrated. Prices are sample values and nothing can be purchased yet.
        </p>
      </div>
    </footer>
  );
}
