import type { Metadata } from "next";
import WishlistView from "@/components/WishlistView";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <div className="container-page py-8">
      <h1 className="font-display text-4xl font-semibold">Wishlist</h1>
      <WishlistView />
    </div>
  );
}
