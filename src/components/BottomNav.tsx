"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CountBadge from "./CountBadge";
import { BagIcon, GridIcon, HeartIcon, HomeIcon, SparkIcon } from "./icons";

const ITEMS = [
  { href: "/", label: "Home", Icon: HomeIcon, badge: null },
  { href: "/shop", label: "Shop", Icon: GridIcon, badge: null },
  { href: "/stylist", label: "Stylist", Icon: SparkIcon, badge: null },
  { href: "/wishlist", label: "Wishlist", Icon: HeartIcon, badge: "wishlist" as const },
  { href: "/cart", label: "Cart", Icon: BagIcon, badge: "cart" as const },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-chalk/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ href, label, Icon, badge }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? "text-peacock" : "text-stone"}`}>
                <span className="relative"><Icon />{badge && <CountBadge which={badge} />}</span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
