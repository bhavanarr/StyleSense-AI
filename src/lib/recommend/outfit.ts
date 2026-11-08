import { products as ALL } from "@/data/products";
import type { Category, Occasion, Product, StyleTag } from "@/types";
import { colorCompat } from "./colors";

/**
 * Complete-the-look engine. Pure TypeScript, deterministic, no network.
 *
 * How an outfit is built:
 *  1. Pick a plan: which slots (bottom, shoes, watch...) this anchor still needs.
 *  2. For each slot, score every eligible candidate on colour, style, occasion, the
 *     user's stated preferences, and value. Candidates under MIN_SCORE are never shown,
 *     so an empty slot is preferred to a random filler.
 *  3. Fit to budget: drop optional pieces, then swap for cheaper alternatives.
 *     If it still doesn't fit, the outfit is returned and flagged over budget (never hidden).
 */
export type SlotKind = "top" | "bottom" | "dress" | "outerwear" | "footwear" | "watch" | "bag" | "extra";

export const SLOT_LABEL: Record<SlotKind, string> = {
  top: "Top", bottom: "Bottom", dress: "Dress", outerwear: "Layer", footwear: "Shoes", watch: "Watch", bag: "Bag", extra: "Accessory",
};

const KIND: Record<Category, SlotKind> = {
  tshirt: "top", shirt: "top", kurta: "top", top: "top", dress: "dress",
  jeans: "bottom", trousers: "bottom", skirt: "bottom", jacket: "outerwear",
  shoes: "footwear", watch: "watch", bag: "bag", accessory: "extra",
};
export const slotOf = (p: Product): SlotKind => KIND[p.category];

export const MIN_SCORE = 0.7;
const MAX_OPTIONAL = 3;
const WEIGHTS = { colour: 0.34, style: 0.26, occasion: 0.2, preference: 0.12, value: 0.08 };

export interface OutfitOptions {
  gender?: "men" | "women";
  occasion?: Occasion;
  perItemMax?: number;
  totalBudget?: number;
  preferredColors?: string[];
  preferredStyles?: StyleTag[];
}

export interface OutfitItem { slot: SlotKind; product: Product; score: number; reasons: string[]; isAnchor: boolean }

export interface Outfit {
  anchor: Product;
  items: OutfitItem[]; // anchor first
  total: number;
  score: number; // mean score of the recommended (non-anchor) items, 0..1
  complete: boolean; // every essential slot filled with a well-matched item
  missing: SlotKind[];
  budget: { totalBudget?: number; perItemMax?: number; within: boolean; overBy: number };
  notes: string[];
}

interface Plan { essential: SlotKind[]; optional: SlotKind[] }

function plansFor(kind: SlotKind): Plan[] {
  const extras: SlotKind[] = ["outerwear", "watch", "bag", "extra"];
  const optionalFor = (essential: SlotKind[]) => extras.filter((k) => k !== kind && !essential.includes(k));
  const mk = (essential: SlotKind[]): Plan => {
    const e = essential.filter((k) => k !== kind);
    return { essential: e, optional: optionalFor(e) };
  };
  switch (kind) {
    case "top": return [mk(["bottom", "footwear"])];
    case "bottom": return [mk(["top", "footwear"])];
    case "dress": return [mk(["footwear"])];
    default: return [mk(["top", "bottom", "footwear"]), mk(["dress", "footwear"])]; // a dress can replace top + bottom
  }
}

// Style clashes: pieces that rarely belong in one outfit.
const CLASH: [StyleTag, StyleTag][] = [["formal", "sporty"], ["formal", "streetwear"], ["ethnic", "sporty"], ["ethnic", "streetwear"], ["boho", "sporty"]];
const clashes = (a: StyleTag, b: StyleTag) => CLASH.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

function styleFit(a: Product, b: Product): { score: number; reason: string | null } {
  const shared = a.styles.filter((s) => b.styles.includes(s));
  if (shared.length) {
    // Degree of overlap (Jaccard): a kurta + churidar (2 shared tags) beats a kurta + chinos (1 shared tag).
    const union = new Set([...a.styles, ...b.styles]).size;
    return { score: 0.6 + 0.4 * (shared.length / union), reason: `shares a ${shared[0]} feel` };
  }
  if (a.styles.every((x) => b.styles.every((y) => clashes(x, y)))) return { score: 0.1, reason: "clashes in style" };
  return { score: 0.5, reason: null };
}

function scoreCandidate(c: Product, anchor: Product, chosen: Product[], targetOcc: Occasion[], opts: OutfitOptions) {
  const overlap = c.occasions.filter((o) => targetOcc.includes(o)).length;
  if (overlap === 0) return null; // wrong occasion: excluded, not just penalised

  // Colour: average vs. the anchor (counted twice) and everything chosen so far.
  const against = [anchor, anchor, ...chosen];
  const fits = against.map((o) => colorCompat(c.color, o.color));
  const colour = fits.reduce((n, f) => n + f.score, 0) / fits.length;
  const style = styleFit(c, anchor);
  const occasion = 0.6 + 0.4 * (overlap / targetOcc.length);

  const colorPref = opts.preferredColors?.length ? (opts.preferredColors.includes(c.color.name) ? 1 : 0.5) : 0.5;
  const stylePref = opts.preferredStyles?.length ? (c.styles.some((s) => opts.preferredStyles!.includes(s)) ? 1 : 0.4) : 0.5;
  const preference = (colorPref + stylePref) / 2;
  const value = Math.min(((c.mrp - c.price) / c.mrp) / 0.45, 1);

  const score = WEIGHTS.colour * colour + WEIGHTS.style * style.score + WEIGHTS.occasion * occasion + WEIGHTS.preference * preference + WEIGHTS.value * value;
  const reasons = [fits[0].reason, style.reason ? `Pairs well: ${style.reason}` : ""].filter(Boolean);
  return { score, reasons };
}

interface Ranked { product: Product; score: number; reasons: string[] }

export function buildOutfit(anchor: Product, opts: OutfitOptions = {}, pool: Product[] = ALL): Outfit {
  const gender = opts.gender ?? (anchor.gender === "unisex" ? "women" : anchor.gender);
  const targetOcc = opts.occasion ? [opts.occasion] : anchor.occasions;
  const anchorKind = slotOf(anchor);

  const eligible = pool.filter(
    (p) => p.id !== anchor.id && p.inStock && (p.gender === gender || p.gender === "unisex") && (opts.perItemMax === undefined || p.price <= opts.perItemMax),
  );

  const attempts = plansFor(anchorKind).map((plan) => {
    const chosen: OutfitItem[] = [];
    const ranked = new Map<SlotKind, Ranked[]>();
    const missing: SlotKind[] = [];
    const slots = [...plan.essential.map((s) => [s, true] as const), ...plan.optional.map((s) => [s, false] as const)];
    for (const [slot, essential] of slots) {
      const list: Ranked[] = [];
      for (const c of eligible.filter((p) => slotOf(p) === slot)) {
        const r = scoreCandidate(c, anchor, chosen.map((i) => i.product), targetOcc, opts);
        if (r && r.score >= MIN_SCORE) list.push({ product: c, ...r });
      }
      list.sort((a, b) => b.score - a.score || a.product.price - b.product.price);
      ranked.set(slot, list);
      if (list[0]) chosen.push({ slot, product: list[0].product, score: list[0].score, reasons: list[0].reasons, isAnchor: false });
      else if (essential) missing.push(slot);
    }
    // Keep only the best few optional extras so an outfit doesn't become a shopping list.
    const optionalItems = chosen.filter((i) => plan.optional.includes(i.slot)).sort((a, b) => b.score - a.score);
    for (const extra of optionalItems.slice(MAX_OPTIONAL)) chosen.splice(chosen.indexOf(extra), 1);
    const mean = chosen.length ? chosen.reduce((n, i) => n + i.score, 0) / chosen.length : 0;
    return { plan, chosen, ranked, missing, mean };
  });

  // Prefer a plan that fills every essential slot, then the better-scoring one.
  attempts.sort((a, b) => a.missing.length - b.missing.length || b.mean - a.mean);
  const best = attempts[0];
  const items = [...best.chosen];
  const notes: string[] = [];
  const sum = () => anchor.price + items.reduce((n, i) => n + i.product.price, 0);

  if (opts.perItemMax !== undefined && anchor.price > opts.perItemMax) {
    notes.push(`The item you picked costs more than your per-item limit, so only the other pieces follow it.`);
  }

  // Fit to the total budget: drop the weakest optional piece first, then swap for cheaper alternatives.
  if (opts.totalBudget !== undefined) {
    while (sum() > opts.totalBudget) {
      const optional = items.filter((i) => best.plan.optional.includes(i.slot)).sort((a, b) => a.score - b.score);
      if (optional.length) {
        items.splice(items.indexOf(optional[0]), 1);
        notes.push(`Left out ${optional[0].product.name} to stay within budget.`);
        continue;
      }
      let swap: { item: OutfitItem; alt: Ranked; ratio: number } | null = null;
      for (const item of items) {
        for (const alt of best.ranked.get(item.slot) ?? []) {
          const saving = item.product.price - alt.product.price;
          if (saving <= 0) continue;
          const ratio = (item.score - alt.score) / saving; // score lost per rupee saved
          if (!swap || ratio < swap.ratio) swap = { item, alt, ratio };
        }
      }
      if (!swap) break;
      notes.push(`Swapped ${swap.item.product.name} for the cheaper ${swap.alt.product.name}.`);
      Object.assign(swap.item, { product: swap.alt.product, score: swap.alt.score, reasons: swap.alt.reasons });
    }
  }

  const total = sum();
  const overBy = opts.totalBudget !== undefined ? Math.max(0, total - opts.totalBudget) : 0;
  const perItemOk = opts.perItemMax === undefined || anchor.price <= opts.perItemMax;
  const mean = items.length ? items.reduce((n, i) => n + i.score, 0) / items.length : 0;
  for (const s of best.missing) notes.push(`No well-matched ${SLOT_LABEL[s].toLowerCase()} found${opts.perItemMax ? " within your limit" : ""}, so none is suggested.`);

  return {
    anchor,
    items: [{ slot: anchorKind, product: anchor, score: 1, reasons: [], isAnchor: true }, ...items],
    total,
    score: mean,
    complete: best.missing.length === 0,
    missing: best.missing,
    budget: { totalBudget: opts.totalBudget, perItemMax: opts.perItemMax, within: overBy === 0 && perItemOk, overBy },
    notes,
  };
}
