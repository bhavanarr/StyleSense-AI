"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CountBadge from "./CountBadge";
import { BagIcon, HeartIcon } from "./icons";

const NAV = [
  { href: "/shop?gender=women", label: "Women" },
  { href: "/shop?gender=men", label: "Men" },
  { href: "/shop", label: "All products" },
  { href: "/stylist", label: "AI Stylist" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    setOpen(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  const search = (id: string) => (
    <form onSubmit={onSearch} role="search" className="flex w-full items-center rounded-full border border-ink/15 bg-white px-4 focus-within:border-peacock">
      <label htmlFor={id} className="sr-only">Search products</label>
      <input id={id} name="q" type="search" placeholder="Search kurtas, sneakers, linen…" className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-stone" />
      <button type="submit" aria-label="Search" className="p-1 text-stone hover:text-ink">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-chalk/90 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight" onClick={() => setOpen(false)}>
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-peacock text-sm text-marigold">S</span>
          StyleSense
        </Link>
        <nav aria-label="Main" className="hidden gap-6 text-sm font-medium md:flex">
          {NAV.map((n) => (<Link key={n.href} href={n.href} className="hover:text-peacock">{n.label}</Link>))}
        </nav>
        <div className="ml-auto hidden w-64 md:block">{search("site-search")}</div>
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/wishlist" aria-label="Wishlist" className="relative p-1 hover:text-peacock"><HeartIcon /><CountBadge which="wishlist" /></Link>
          <Link href="/cart" aria-label="Cart" className="relative p-1 hover:text-peacock"><BagIcon /><CountBadge which="cart" /></Link>
        </div>
        <button type="button" className="ml-auto rounded-full p-2 hover:bg-white md:hidden" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <div id="mobile-menu" className="container-page space-y-4 border-t border-ink/10 pb-5 pt-4 md:hidden">
          {search("mobile-search")}
          <nav aria-label="Mobile" className="flex flex-col">
            {NAV.map((n) => (<Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-ink/10 py-3 font-medium">{n.label}</Link>))}
          </nav>
        </div>
      )}
    </header>
  );
}
