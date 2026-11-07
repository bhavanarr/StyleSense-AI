"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OCCASIONS } from "@/lib/catalogue";
import { formatINR } from "@/lib/format";
import type { Gender, Occasion } from "@/types";

const WHO: { value: Gender | "all"; label: string }[] = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "all", label: "Everyone" },
];

export default function OccasionPicker() {
  const router = useRouter();
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [who, setWho] = useState<Gender | "all">("women");
  const [budget, setBudget] = useState(3000);

  function go(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (who !== "all") p.set("gender", who);
    if (occasion) p.set("occasion", occasion);
    p.set("max", String(budget));
    router.push(`/shop?${p.toString()}`);
  }

  return (
    <form onSubmit={go} className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:p-6" aria-label="Find outfits by occasion and budget">
      <fieldset>
        <legend className="text-sm font-semibold">I&apos;m shopping for</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {WHO.map((w) => (<button key={w.value} type="button" className="chip" aria-pressed={who === w.value} onClick={() => setWho(w.value)}>{w.label}</button>))}
        </div>
      </fieldset>
      <fieldset className="mt-5">
        <legend className="text-sm font-semibold">The occasion</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (<button key={o} type="button" className="chip capitalize" aria-pressed={occasion === o} onClick={() => setOccasion(occasion === o ? null : o)}>{o}</button>))}
        </div>
      </fieldset>
      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="budget" className="text-sm font-semibold">Budget per item</label>
          <output htmlFor="budget" className="font-display text-lg font-semibold text-peacock">up to {formatINR(budget)}</output>
        </div>
        <input id="budget" type="range" min={500} max={10000} step={500} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="mt-2 w-full accent-[#0E5A5A]" />
        <div className="flex justify-between text-xs text-stone"><span>{formatINR(500)}</span><span>{formatINR(10000)}</span></div>
      </div>
      <button type="submit" className="btn-primary mt-6 w-full">Show matching pieces</button>
    </form>
  );
}
