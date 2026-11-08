"use client";

import { useShop } from "@/lib/store/ShopProvider";

export default function WishlistButton({ productId, name, className = "" }: { productId: string; name: string; className?: string }) {
  const { isWishlisted, toggleWishlist, ready } = useShop();
  const saved = ready && isWishlisted(productId);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={() => toggleWishlist(productId)}
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors hover:bg-white ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill={saved ? "#B3261E" : "none"} stroke={saved ? "#B3261E" : "currentColor"} strokeWidth="2" strokeLinejoin="round">
        <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" />
      </svg>
    </button>
  );
}
