"use client";

import { useMemo, useState } from "react";
import { buildOutfit } from "@/lib/recommend/outfit";
import { formatINR } from "@/lib/format";
import type { Occasion, Product } from "@/types";
import OutfitView from "./OutfitView";

type Mode = "none" | "item" | "total";
const RANGE: Record<Exclude<Mode, "none">, { min: number; max: number }> = { item: { min: 500, max: 10000 }, total: { min: 1500, max: 25000 } };
const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "none", label: "No limit", hint: "Show the best match" },
  { value: "item", label: "Per item", hint: "Cap the price of each piece" },
  { value: "total", label: "Total outfit", hint: "Keep the whole look under one number" },
];

export default function CompleteTheLook({ anchor }: { anchor: Product }) {
  const [mode, setMode] = useState<Mode>("none");
  const [amount, setAmount] = useState(3000);
  const [gender, setGender] = useState<"men" | "women">("women");
  const [occasion, setOccasion] = useState<Occasion | "">("");

  const effectiveGender = anchor.gender === "unisex" ? gender : anchor.gender;
  const outfit = useMemo(
    () => buildOutfit(anchor, {
      gender: effectiveGender,
      occasion: occasion || undefined,
      perItemMax: mode === "item" ? amount : undefined,
      totalBudget: mode === "total" ? amount : undefined,
    }),
    [anchor, effectiveGender, occasion, mode, amount],
  );

  function chooseMode(m: Mode) {
    setMode(m);
    if (m === "item") setAmount(Math.min(10000, Math.max(1000, Math.ceil(anchor.price / 500) * 500)));
    if (m === "total") setAmount(Math.min(25000, Math.max(3000, Math.ceil((anchor.price * 3) / 500) * 500)));
  }

  return (
    <section className="mt-16" aria-labelledby="ctl">
      <h2 id="ctl" className="font-display text-2xl font-semibold sm:text-3xl">Complete the look</h2>
      <p className="mt-1 max-w-2xl text-sm text-stone">Pieces chosen to go with this item by colour, style and occasion, so only matches that score well are shown.</p>

      <div className="mt-5 grid gap-5 rounded-2xl bg-peacock-light/60 p-4 sm:p-5 md:grid-cols-[1fr_auto]">
        <fieldset>
          <legend className="text-sm font-semibold">Budget</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {MODES.map((m) => (<button key={m.value} type="button" className="chip bg-white" aria-pressed={mode === m.value} title={m.hint} onClick={() => chooseMode(m.value)}>{m.label}</button>))}
          </div>
          {mode !== "none" && (
            <div className="mt-4 max-w-md">
              <div className="flex items-baseline justify-between">
                <label htmlFor="ctl-budget" className="text-sm">{mode === "item" ? "Maximum for each piece" : "Maximum for the whole outfit"}</label>
                <output htmlFor="ctl-budget" className="font-display text-lg font-semibold text-peacock">{formatINR(amount)}</output>
              </div>
              <input id="ctl-budget" type="range" min={RANGE[mode].min} max={RANGE[mode].max} step={500} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-1 w-full accent-[#0E5A5A]" />
            </div>
          )}
        </fieldset>
        <div className="flex flex-wrap items-end gap-4">
          {anchor.gender === "unisex" && (
            <fieldset>
              <legend className="text-sm font-semibold">Styled for</legend>
              <div className="mt-2 flex gap-2">
                {(["women", "men"] as const).map((g) => (<button key={g} type="button" className="chip bg-white capitalize" aria-pressed={gender === g} onClick={() => setGender(g)}>{g}</button>))}
              </div>
            </fieldset>
          )}
          <label className="text-sm font-semibold">Occasion
            <select value={occasion} onChange={(e) => setOccasion(e.target.value as Occasion | "")} className="mt-2 block rounded-full border border-ink/20 bg-white px-3.5 py-2 text-sm font-normal capitalize">
              <option value="">Suits this item</option>
              {anchor.occasions.map((o) => (<option key={o} value={o}>{o}</option>))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-5">
        {outfit.items.length > 1 ? (
          <OutfitView outfit={outfit} />
        ) : (
          <div className="rounded-2xl border border-dashed border-ink/25 p-8 text-center">
            <p className="font-display text-xl font-semibold">No well-matched pieces for these settings</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-stone">Rather than fill the gaps with random items, we show nothing. Try a higher budget or a different occasion.</p>
            {outfit.notes.length > 0 && <ul className="mt-3 space-y-1 text-sm text-stone">{outfit.notes.map((n) => (<li key={n}>{n}</li>))}</ul>}
            <button type="button" className="btn-outline mt-4" onClick={() => { setMode("none"); setOccasion(""); }}>Reset settings</button>
          </div>
        )}
      </div>
    </section>
  );
}
