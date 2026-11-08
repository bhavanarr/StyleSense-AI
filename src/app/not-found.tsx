import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="font-display text-3xl font-semibold">We couldn&apos;t find that page</p>
      <p className="mx-auto mt-2 max-w-md text-stone">The link may be old, or the product may no longer be in the catalogue.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/shop" className="btn-primary">Browse the shop</Link>
        <Link href="/" className="btn-outline">Go home</Link>
      </div>
    </div>
  );
}
