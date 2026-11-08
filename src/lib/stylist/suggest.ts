import { products as ALL } from "@/data/products";
import { buildOutfit, slotOf, type Outfit } from "@/lib/recommend/outfit";
import type { Product } from "@/types";
import type { ParsedRequest } from "./parse";

export interface Suggestion {
  outfits: Outfit[];
  /** True when none fit the budget and these are the closest options instead. */
  overBudget: boolean;
  notes: string[];
}

/**
 * Turns a parsed request into up to 3 distinct outfits. Gender must be known
 * (the chat asks if it isn't). Never returns an outfit that quietly breaks the budget.
 */
export function suggestOutfits(req: ParsedRequest & { gender: "men" | "women" }, pool: Product[] = ALL): Suggestion {
  const notes: string[] = [];
  const perItemMax = req.budget?.kind === "per-item" ? req.budget.amount : undefined;
  const totalBudget = req.budget?.kind === "total" ? req.budget.amount : undefined;

  let anchors = pool.filter(
    (p) => p.inStock && (p.gender === req.gender || p.gender === "unisex") && (!req.occasion || p.occasions.includes(req.occasion)) && (perItemMax === undefined || p.price <= perItemMax),
  );
  if (req.categories.length) {
    const wanted = anchors.filter((p) => req.categories.includes(p.category));
    if (wanted.length) anchors = wanted; else notes.push("I couldn't find that item for this occasion, so I built outfits around other pieces.");
  } else {
    // Without a named item, build around the main garment: a top, a dress, or a layer.
    anchors = anchors.filter((p) => ["top", "dress"].includes(slotOf(p)));
  }
  if (req.colors.length) {
    const tinted = anchors.filter((p) => req.colors.includes(p.color.name));
    if (tinted.length) anchors = tinted; else notes.push(`No ${req.colors.join("/").toLowerCase()} main piece fits here, so I'm showing other colours.`);
  }

  const build = (withBudget: boolean) =>
    anchors
      .map((a) => buildOutfit(a, { gender: req.gender, occasion: req.occasion, perItemMax, totalBudget: withBudget ? totalBudget : undefined, preferredColors: req.colors, preferredStyles: req.styles }))
      .filter((o) => o.complete && (!withBudget || o.budget.within));

  const pickDiverse = (list: Outfit[]): Outfit[] => {
    const sorted = [...list].sort((a, b) => b.score - a.score || a.total - b.total);
    const out: Outfit[] = [];
    for (const o of sorted) { if (out.length < 3 && !out.some((x) => x.anchor.category === o.anchor.category && x.anchor.color.name === o.anchor.color.name)) out.push(o); }
    for (const o of sorted) { if (out.length < 3 && !out.includes(o)) out.push(o); }
    return out;
  };

  const fitting = build(true);
  if (fitting.length || totalBudget === undefined) return { outfits: pickDiverse(fitting), overBudget: false, notes };

  // Nothing fits: show the cheapest complete options and say so plainly.
  const closest = build(false)
    .sort((a, b) => a.total - b.total)
    .slice(0, 3)
    .map((o): Outfit => ({ ...o, budget: { ...o.budget, totalBudget, within: o.total <= totalBudget, overBy: Math.max(0, o.total - totalBudget) } }));
  return { outfits: closest, overBudget: closest.length > 0, notes };
}
