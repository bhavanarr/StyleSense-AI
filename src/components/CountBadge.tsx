"use client";

import { useShop } from "@/lib/store/ShopProvider";

/** Shows a count only after localStorage has loaded, so server and client HTML match. */
export default function CountBadge({ which }: { which: "cart" | "wishlist" }) {
  const { ready, cartCount, wishlist } = useShop();
  const n = which === "cart" ? cartCount : wishlist.length;
  if (!ready || n === 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full bg-marigold px-1 text-[11px] font-bold leading-[18px] text-ink">
      {n > 99 ? "99+" : n}
      <span className="sr-only"> {which === "cart" ? "items in cart" : "saved items"}</span>
    </span>
  );
}
