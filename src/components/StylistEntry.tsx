"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SparkIcon } from "./icons";

const EXAMPLES = [
  "A classy farewell outfit under ₹2500",
  "Birthday outfit for my sister",
  "Casual college outfit",
];

export default function StylistEntry() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function go(value: string) {
    const v = value.trim();
    if (!v) { setError("Tell the stylist what you need first."); return; }
    router.push(`/stylist?prompt=${encodeURIComponent(v)}`);
  }

  return (
    <section aria-labelledby="stylist-entry" className="container-page py-6">
      <div className="overflow-hidden rounded-3xl bg-peacock px-5 py-8 text-white sm:px-10 sm:py-10">
        <div className="flex items-center gap-2 text-marigold"><SparkIcon /><span className="text-sm font-semibold">AI Stylist</span></div>
        <h2 id="stylist-entry" className="mt-2 max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-4xl">Describe the occasion. Get a complete outfit.</h2>
        <form onSubmit={(e) => { e.preventDefault(); go(text); }} className="mt-6 max-w-2xl">
          <label htmlFor="entry-input" className="sr-only">What do you need to wear?</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input id="entry-input" value={text} maxLength={300} onChange={(e) => { setText(e.target.value); setError(null); }} placeholder="e.g. a classy farewell outfit under ₹2500"
              className="min-w-0 flex-1 rounded-full bg-white px-5 py-3 text-ink outline-none placeholder:text-stone focus:ring-2 focus:ring-marigold" />
            <button type="submit" className="btn bg-marigold px-6 py-3 text-ink hover:bg-marigold-dark hover:text-white">Style me</button>
          </div>
          {error && <p role="alert" className="mt-2 text-sm font-medium text-marigold">{error}</p>}
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (<button key={e} type="button" onClick={() => go(e)} className="rounded-full border border-white/40 px-3.5 py-1.5 text-sm hover:bg-white/10">{e}</button>))}
        </div>
        <p className="mt-5 text-xs text-white/75">Runs on built-in styling rules for now. A Gemini-powered chat connects in a later update.</p>
      </div>
    </section>
  );
}
