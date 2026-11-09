import { chartFor } from "@/data/sizeCharts";
import { brandById } from "@/data/brands";
import type { Category, Product } from "@/types";
import { hasMeasurements } from "./profile";
import { formatRange, formatValue, trim1, fromCm } from "./units";
import {
  DIMENSION_LABEL, type Confidence, type Dimension, type DimensionDetail, type FitPreference,
  type MeasurementProfile, type SizeAdvice, type SizeChart, type SizeRow,
} from "./types";

/**
 * Size recommendation: compares a body-measurement profile with a product's size chart.
 *
 *  1. Which measurements matter for this garment, and how much (WEIGHTS), and which are required.
 *  2. Fit adjustment: the gap between the ease you want (slim/regular/relaxed) and the ease the
 *     garment is cut with becomes a small shift applied to your measurement.
 *  3. Cost per size: how far each adjusted measurement sits outside the size's range, in units of
 *     that size's band width. Too small is penalised more than too large. Weighted average.
 *  4. Lowest cost wins. Ties go to the smaller size for "slim", otherwise the larger.
 *  5. Confidence: measurement coverage, how well the winner fits, and how clearly it beats the
 *     runner-up, capped when data is thin or measurements disagree.
 *
 * It estimates a good size. It never claims a perfect fit.
 */

export const DISCLAIMER = "Sizes are an estimate from the measurements you entered and an illustrative chart for a fictional brand. Fabric, cut and personal preference vary, so this is guidance, not a guarantee of fit.";

interface Weights { weights: Partial<Record<Dimension, number>>; required: Dimension[] }
const TOP: Weights = { weights: { chest: 1, shoulder: 0.6, waist: 0.4 }, required: ["chest"] };
const BOTTOM: Weights = { weights: { waist: 1, hips: 0.7 }, required: ["waist"] };
const BY_CATEGORY: Partial<Record<Category, Weights>> = {
  tshirt: TOP, shirt: TOP, top: TOP,
  kurta: { weights: { chest: 1, hips: 0.5, shoulder: 0.5, waist: 0.3 }, required: ["chest"] },
  jacket: { weights: { chest: 1, shoulder: 0.8, waist: 0.3 }, required: ["chest"] },
  dress: { weights: { chest: 1, waist: 0.8, hips: 0.8, shoulder: 0.3 }, required: ["chest"] },
  jeans: BOTTOM, trousers: BOTTOM,
  skirt: { weights: { waist: 1, hips: 0.8 }, required: ["waist"] },
};

// Ease = how much looser than the body a garment is meant to sit (cm of chest, scaled per dimension).
const EASE: Record<FitPreference, number> = { slim: 4, regular: 8, relaxed: 12 };
const EASE_SCALE: Partial<Record<Dimension, number>> = { chest: 1, waist: 0.5, hips: 0.6, shoulder: 0.25 };
const MAX_SHIFT_CM = 6;
const TOO_SMALL_PENALTY = 1.5; // a garment that is too small is worse than one that is too big

const FIT_WORD: Record<FitPreference, string> = { slim: "slim", regular: "regular", relaxed: "relaxed" };
const low = (d: Dimension) => DIMENSION_LABEL[d].toLowerCase();
/** "a", "a and b", "a, b and c" */
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

function fitShift(dim: Dimension, want: FitPreference, cut: FitPreference) {
  const scale = EASE_SCALE[dim] ?? 0;
  const raw = (EASE[want] - EASE[cut]) * scale;
  const limit = MAX_SHIFT_CM * scale;
  const shift = Math.max(-limit, Math.min(limit, raw));
  return { shift, clamped: Math.abs(raw) > limit + 1e-9 };
}

const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

/** Deviation of value v from range [lo, hi], in band widths. 0 inside. */
function deviation(v: number, [lo, hi]: [number, number], band: number, stretch: number): number {
  if (v >= lo && v <= hi) return 0;
  const raw = v > hi ? ((v - hi) / band) * TOO_SMALL_PENALTY : (lo - v) / band;
  return raw * stretch;
}

export function recommendSize(product: Product, profile: MeasurementProfile | null): SizeAdvice {
  if (product.sizeSystem === "free") return { status: "not-applicable", reason: "This item comes in one size." };
  if (product.sizeSystem === "uk-shoe") {
    return { status: "not-applicable", reason: "Shoe size depends on foot length, which isn't collected here. Compare your current UK size with the sizes shown." };
  }
  const match = chartFor(product);
  const cfg = BY_CATEGORY[product.category];
  if (!match || !cfg) return { status: "no-chart", reason: "We don't have a size chart for this item, so we can't suggest a size." };

  const { chart, cut } = match;
  const rows: SizeRow[] = chart.rows.filter((r) => product.sizes.includes(r.size));
  if (rows.length < 2) return { status: "no-chart", reason: "This product's sizes don't match our size chart, so we can't suggest one." };

  const relevant = (Object.keys(cfg.weights) as Dimension[]);
  const covers = (d: Dimension) => rows.every((r) => r.ranges[d]);
  const usable = relevant.filter(covers);
  const ignored = relevant.filter((d) => !covers(d));

  const missingRequired = cfg.required.filter((d) => !profile || typeof profile[d] !== "number");
  if (!profile || !hasMeasurements(profile) || missingRequired.length) {
    const need = list(missingRequired.map(low));
    return {
      status: "insufficient", missing: missingRequired,
      reason: profile && hasMeasurements(profile) ? `Add your ${need} to get a size suggestion for this item.` : `Add your measurements (at least your ${need}) to get a size suggestion.`,
    };
  }
  if (cfg.required.some((d) => !covers(d))) return { status: "no-chart", reason: "This brand's chart doesn't include the measurement we need for this item." };

  const p = profile; // narrowed: non-null with required measurements
  const provided = usable.filter((d) => typeof p[d] === "number");
  const want = p.fit;

  // Adjusted measurement per dimension (step 2) and band width per dimension (for normalising).
  const shifts = new Map(provided.map((d) => [d, fitShift(d, want, cut)] as const));
  const adj = (d: Dimension) => (p[d] as number) + (shifts.get(d)?.shift ?? 0);
  const band = new Map(provided.map((d) => [d, median(rows.map((r) => (r.ranges[d] as [number, number])[1] - (r.ranges[d] as [number, number])[0]))] as const));

  // Step 3: cost of each size.
  const wSum = provided.reduce((n, d) => n + (cfg.weights[d] as number), 0);
  const scored = rows.map((row, index) => ({
    row, index,
    cost: provided.reduce((n, d) => n + (cfg.weights[d] as number) * deviation(adj(d), row.ranges[d] as [number, number], band.get(d) as number, chart.stretch), 0) / wSum,
  }));
  // Step 4: lowest cost; ties by fit preference.
  scored.sort((a, b) => a.cost - b.cost || (want === "slim" ? a.index - b.index : b.index - a.index));
  const best = scored[0];
  const second = scored[1];

  // Per-dimension winner: does each measurement agree on the size?
  const dimBest = provided.filter((d) => (cfg.weights[d] as number) >= 0.5).map((d) => {
    const w = [...rows.map((row, index) => ({ row, index, dev: deviation(adj(d), row.ranges[d] as [number, number], band.get(d) as number, 1) }))]
      .sort((a, b) => a.dev - b.dev || b.index - a.index)[0];
    return { dim: d, size: w.row.size, index: w.index };
  });
  const spread = dimBest.length ? Math.max(...dimBest.map((x) => x.index)) - Math.min(...dimBest.map((x) => x.index)) : 0;

  const details: DimensionDetail[] = provided.map((d) => {
    const range = best.row.ranges[d] as [number, number];
    const v = p[d] as number, e = adj(d);
    const status = e > range[1] ? "above" : e < range[0] ? "below" : "within";
    return { dim: d, valueCm: v, effectiveCm: e, range, status, deltaCm: status === "above" ? e - range[1] : status === "below" ? range[0] - e : 0 };
  });

  // Bodies outside the chart's whole range: there is no good size, only a least-bad one.
  const first = rows[0], last = rows[rows.length - 1];
  const beyondLargest = provided.filter((d) => adj(d) > (last.ranges[d] as [number, number])[1] + 0.25 * (band.get(d) as number));
  const beyondSmallest = provided.filter((d) => adj(d) < (first.ranges[d] as [number, number])[0] - 0.25 * (band.get(d) as number));
  const outOfRange = beyondLargest.length > 0 || beyondSmallest.length > 0 || best.cost >= 1;

  // Step 5: confidence.
  const relevantW = relevant.reduce((n, d) => n + (cfg.weights[d] as number), 0);
  const coverage = wSum / relevantW;
  const fitQuality = 1 - Math.min(best.cost, 1);
  const separation = second ? Math.min((second.cost - best.cost) / 0.6, 1) : 1;
  const clampedAny = provided.some((d) => shifts.get(d)?.clamped);
  let score = 40 * coverage + 35 * fitQuality + 25 * separation;
  if (spread >= 2) score -= 25;
  if (clampedAny) score -= 10;
  score = Math.max(0, Math.min(100, Math.round(score)));
  let confidence: Confidence = score >= 75 ? "high" : score >= 50 ? "medium" : "low";
  const cap: Confidence = coverage <= 0.35 ? "low" : coverage < 0.6 ? "medium" : "high";
  const rank = { low: 0, medium: 1, high: 2 } as const;
  if (rank[cap] < rank[confidence]) confidence = cap;
  // A "clear winner" among bad options is still a bad option: never report more than low confidence.
  if (outOfRange) { confidence = "low"; score = Math.min(score, 40); }

  // ---- Explanation and warnings, in plain language, in the person's own unit ----
  const u = p.unit;
  const primary = [...details].sort((a, b) => (cfg.weights[b.dim] as number) - (cfg.weights[a.dim] as number))[0];
  const explanation: string[] = [];
  const dimLine = (d: DimensionDetail) => {
    const v = formatValue(d.valueCm, u), r = formatRange(d.range, u), gap = `${trim1(fromCm(d.deltaCm, u))} ${u}`;
    return d.status === "within" ? `Your ${low(d.dim)} (${v}) falls within size ${best.row.size}'s range of ${r}.`
      : d.status === "above" ? `Your ${low(d.dim)} (${v}) is ${gap} above size ${best.row.size}'s range of ${r}, so this is the closest size but may feel snug there.`
      : `Your ${low(d.dim)} (${v}) is ${gap} below size ${best.row.size}'s range of ${r}, so it may feel roomy there.`;
  };
  explanation.push(dimLine(primary));
  const shift = shifts.get(primary.dim);
  if (shift && Math.abs(shift.shift) > 0.05) {
    const amt = `${trim1(fromCm(Math.abs(shift.shift), u))} ${u}`;
    explanation.push(`You prefer a ${FIT_WORD[want]} fit and this item is cut ${FIT_WORD[cut]}, so we matched a ${shift.shift > 0 ? "larger" : "smaller"} measurement (${amt} ${shift.shift > 0 ? "more" : "less"} room) than your ${low(primary.dim)} alone: ${formatValue(primary.effectiveCm, u)}.`);
  } else if (want === cut) {
    explanation.push(`You prefer a ${FIT_WORD[want]} fit and this item is cut ${FIT_WORD[cut]}, so no fit adjustment was needed.`);
  }
  const others = details.filter((d) => d !== primary);
  const fine = others.filter((d) => d.status === "within").map((d) => low(d.dim));
  if (fine.length) explanation.push(`Your ${list(fine)} also ${fine.length > 1 ? "fit" : "fits"} within size ${best.row.size}'s ranges.`);
  for (const d of others.filter((x) => x.status !== "within")) explanation.push(dimLine(d));
  if (chart.note) explanation.push(`${brandById(chart.brandId)?.name ?? "Brand"} sizing note: ${chart.note}`);

  const warnings: string[] = [];
  for (const d of ignored) warnings.push(`This brand's chart doesn't list ${low(d)}, so it wasn't used. Your match is less certain.`);
  const unprovided = usable.filter((d) => typeof p[d] !== "number");
  if (unprovided.length) warnings.push(`Add your ${list(unprovided.map(low))} for a more reliable match.`);
  if (spread >= 2) warnings.push(`Your measurements point to different sizes (${dimBest.map((x) => `${low(x.dim)}: ${x.size}`).join(", ")}). One size can't fit all of them, so check the size chart.`);
  if (clampedAny) warnings.push(`You prefer a ${FIT_WORD[want]} fit but this item is cut ${FIT_WORD[cut]}. Changing size can only partly change how it sits.`);
  if (beyondLargest.length) warnings.push(`Your ${list(beyondLargest.map(low))} ${beyondLargest.length > 1 ? "are" : "is"} larger than this chart's biggest size (${last.size}), so no size here is a good match.`);
  if (beyondSmallest.length) warnings.push(`Your ${list(beyondSmallest.map(low))} ${beyondSmallest.length > 1 ? "are" : "is"} smaller than this chart's smallest size (${first.size}), so no size here is a good match.`);
  if (typeof p.height === "number" && chart.heightRangeCm && (p.height < chart.heightRangeCm[0] || p.height > chart.heightRangeCm[1])) {
    warnings.push(`This item's length is designed for people about ${formatRange(chart.heightRangeCm, u)} tall. At ${formatValue(p.height, u)}, sleeves, hems or length may sit differently.`);
  }

  let alternative: { size: string; note: string } | undefined;
  if (second && second.cost - best.cost < 0.6) {
    const smaller = second.index < best.index;
    alternative = { size: second.row.size, note: `You are close to the line between ${best.row.size} and ${second.row.size}. Choose ${second.row.size} if you want it ${smaller ? "closer-fitting" : "roomier"}.` };
  }

  return {
    status: "ok", size: best.row.size, confidence, score,
    chart: { id: chart.id, label: chart.label, brandId: chart.brandId, note: chart.note, gender: chart.gender },
    fit: want, cut, explanation, details, warnings, ignored, alternative,
    candidates: scored.map((s) => ({ size: s.row.size, cost: Math.round(s.cost * 1000) / 1000 })),
  };
}

/** Relevant dimensions and weights for a category, exposed for the UI's chart table. */
export const relevantDimensions = (c: Category): Dimension[] => Object.keys(BY_CATEGORY[c]?.weights ?? {}) as Dimension[];
export type { SizeChart };
