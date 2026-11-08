import type { ColorOption } from "@/types";

/**
 * Colour compatibility by explicit, explainable rules (not a black box):
 *  - neutrals (and denim, tan, gold, steel) pair with almost anything
 *  - a hand-written list of classic pairings for the stronger colours
 *  - identical colours read as "tonal"
 *  - anything else is flagged as a contrast risk
 * These are styling conventions, not facts about what suits any person.
 */
const NEUTRALS = new Set(["Black", "White", "Grey", "Charcoal", "Beige", "Cream", "Navy", "Mid Denim", "Dark Indigo", "Tan", "Gold", "Steel"]);

const PAIRS: Record<string, string[]> = {
  Olive: ["Mustard", "Maroon", "Rust"],
  Mustard: ["Olive", "Maroon", "Teal", "Emerald"],
  Maroon: ["Olive", "Mustard", "Blush", "Sky Blue"],
  "Sky Blue": ["Blush", "Lavender", "Maroon"],
  Emerald: ["Mustard", "Blush"],
  Blush: ["Sky Blue", "Emerald", "Olive", "Maroon", "Lavender", "Teal"],
  Lavender: ["Sky Blue", "Blush"],
  Rust: ["Teal", "Olive", "Sky Blue"],
  Teal: ["Rust", "Mustard", "Blush"],
};

export interface ColorFit { score: number; reason: string }

export function colorCompat(a: ColorOption, b: ColorOption): ColorFit {
  if (a.name === b.name) {
    return NEUTRALS.has(a.name)
      ? { score: 0.8, reason: `${a.name} on ${b.name} is a clean tonal match` }
      : { score: 0.6, reason: `${a.name} on ${b.name} is tonal: works, but can look flat` };
  }
  const aN = NEUTRALS.has(a.name), bN = NEUTRALS.has(b.name);
  if (aN && bN) return { score: 0.88, reason: `${a.name} and ${b.name} are both versatile neutrals` };
  if (aN || bN) {
    const [bold, base] = aN ? [b, a] : [a, b];
    return { score: 0.9, reason: `${base.name} is a neutral base that lets ${bold.name} stand out` };
  }
  if (PAIRS[a.name]?.includes(b.name) || PAIRS[b.name]?.includes(a.name)) {
    return { score: 0.85, reason: `${a.name} with ${b.name} is a classic pairing` };
  }
  return { score: 0.35, reason: `${a.name} with ${b.name} is a contrast risk` };
}
