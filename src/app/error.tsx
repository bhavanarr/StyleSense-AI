"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page py-24 text-center" role="alert">
      <p className="font-display text-3xl font-semibold">Something went wrong</p>
      <p className="mx-auto mt-2 max-w-md text-stone">That page failed to load. Your cart and wishlist are safe on this device.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">Try again</button>
        <Link href="/" className="btn-outline">Go home</Link>
      </div>
    </div>
  );
}
