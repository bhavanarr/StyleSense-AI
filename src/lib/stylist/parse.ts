import type { Category, Occasion, StyleTag } from "@/types";

/**
 * Rule-based request parser. This is NOT an AI model: it matches keywords and numbers.
 * When Gemini is connected (Day 2) it will return the same ParsedRequest shape, so the
 * rest of the app won't change, and this stays as the offline fallback.
 */
export interface ParsedRequest {
  occasion?: Occasion;
  budget?: { amount: number; kind: "total" | "per-item" };
  gender?: "men" | "women";
  colors: string[]; // colour names as used in the catalogue
  styles: StyleTag[];
  categories: Category[];
  matchIntent: boolean; // "match these trousers"
  understood: string[]; // human-readable chips shown back to the user
}

// Most specific first: "casual college" resolves to college, not casual.
const OCCASION_RULES: [Occasion, RegExp][] = [
  ["college", /\b(college|campus|university|class(es)?)\b/],
  ["farewell", /\b(farewell|send[- ]?off|goodbye party)\b/],
  ["birthday", /\b(birthday|bday|b'day)\b/],
  ["wedding", /\b(wedding|shaadi|reception|sangeet|mehendi|engagement)\b/],
  ["festive", /\b(festive|festival|diwali|eid|puja|navratri|holi|onam|pongal)\b/],
  ["party", /\b(party|club|night ?out|cocktail)\b/],
  ["date", /\b(date|date night|anniversary)\b/],
  ["office", /\b(office|work|interview|meeting|corporate|formal)\b/],
  ["casual", /\b(casual|everyday|daily|weekend|hang ?out|brunch)\b/],
];

const WOMEN = /\b(women|woman|girl|girls|lady|ladies|female|her|she|sister|mom|mother|mum|girlfriend|wife|daughter|bride)\b/;
const MEN = /\b(men|man|boy|boys|guy|guys|male|him|he|brother|dad|father|boyfriend|husband|son|groom)\b/;

const COLOR_RULES: [string[], RegExp][] = [
  [["Black"], /\bblack\b/], [["White"], /\bwhite\b/], [["Navy"], /\bnavy\b/],
  [["Sky Blue", "Mid Denim", "Navy", "Dark Indigo"], /\bblue\b/],
  [["Olive"], /\bolive\b/], [["Beige"], /\b(beige|khaki)\b/], [["Mustard"], /\b(mustard|yellow)\b/],
  [["Maroon"], /\b(maroon|burgundy|wine)\b/], [["Grey", "Charcoal"], /\b(grey|gray)\b/], [["Charcoal"], /\bcharcoal\b/],
  [["Tan"], /\b(tan|brown)\b/], [["Emerald", "Olive"], /\bgreen\b/], [["Emerald"], /\bemerald\b/],
  [["Blush"], /\b(blush|pink)\b/], [["Lavender"], /\b(lavender|purple|lilac)\b/], [["Cream"], /\b(cream|ivory|off[- ]white)\b/],
  [["Rust"], /\b(rust|orange)\b/], [["Teal"], /\bteal\b/], [["Gold"], /\b(gold|golden)\b/],
];

const STYLE_RULES: [StyleTag[], RegExp][] = [
  [["classic", "formal"], /\b(classy|elegant|sophisticated|polished|formal|sharp)\b/],
  [["smart-casual"], /\bsmart[- ]casual\b/],
  [["minimal"], /\b(minimal|minimalist|simple|clean|understated)\b/],
  [["streetwear"], /\b(street ?wear|streetwear|urban|trendy|edgy)\b/],
  [["ethnic"], /\b(ethnic|traditional|indian|desi)\b/],
  [["sporty"], /\b(sporty|athletic|gym|athleisure)\b/],
  [["boho"], /\b(boho|bohemian|floral|flowy)\b/],
];

const CATEGORY_RULES: [Category, RegExp][] = [
  ["tshirt", /\b(t-?shirts?|tees?)\b/], ["shirt", /\bshirts?\b/], ["kurta", /\b(kurtas?|kurtis?)\b/],
  ["dress", /\b(dress(es)?|gown)\b/], ["top", /\b(tops?|blouse)\b/], ["jeans", /\b(jeans|denims?)\b/],
  ["trousers", /\b(trousers?|pants|chinos?|joggers?)\b/], ["skirt", /\bskirts?\b/],
  ["jacket", /\b(jackets?|blazers?|hoodies?)\b/], ["shoes", /\b(shoes?|sneakers?|loafers?|heels?|sandals?|flats?|footwear|juttis?)\b/],
  ["watch", /\bwatch(es)?\b/], ["bag", /\b(bags?|backpacks?|totes?|clutch(es)?)\b/], ["accessory", /\b(sunglasses|belts?|scarf|scarves)\b/],
];

function parseBudget(text: string, hasCategory: boolean): ParsedRequest["budget"] {
  const num = "([\\d][\\d,]*(?:\\.\\d+)?)\\s*(k|thousand)?";
  const patterns = [
    new RegExp(`(?:under|below|within|upto|up to|max(?:imum)?|budget(?: of| is)?|less than|around|about|at most)\\s*(?:₹|rs\\.?|inr)?\\s*${num}`),
    new RegExp(`(?:₹|rs\\.?|inr)\\s*${num}`),
    new RegExp(`${num}\\s*(?:rs|rupees|inr|₹)`),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    let amount = parseFloat(m[1].replace(/,/g, ""));
    if (m[2]) amount *= 1000;
    if (!Number.isFinite(amount) || amount < 300) continue;
    const perItem = /\b(per item|each|every item|per piece|apiece)\b/.test(text) || (hasCategory && !/\b(outfit|look|total|overall|in all|altogether)\b/.test(text));
    return { amount: Math.round(amount), kind: perItem ? "per-item" : "total" };
  }
  return undefined;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function parseRequest(input: string): ParsedRequest {
  const text = input.toLowerCase().replace(/[’`]/g, "'").slice(0, 400);

  const occasion = OCCASION_RULES.find(([, re]) => re.test(text))?.[0];
  const w = WOMEN.test(text), m = MEN.test(text);
  const gender = w && !m ? "women" : m && !w ? "men" : undefined;
  const colors = Array.from(new Set(COLOR_RULES.filter(([, re]) => re.test(text)).flatMap(([names]) => names)));
  const styles = Array.from(new Set(STYLE_RULES.filter(([, re]) => re.test(text)).flatMap(([s]) => s)));
  const categories = CATEGORY_RULES.filter(([, re]) => re.test(text)).map(([c]) => c)
    // "shirt" also matches inside "t-shirt": keep only the more specific one.
    .filter((c, _, all) => !(c === "shirt" && all.includes("tshirt") && !/\bshirts?\b/.test(text.replace(/t-?shirts?/g, ""))));
  const budget = parseBudget(text, categories.length > 0);
  const matchIntent = /\b(match|matches|matching|goes? with|go with|pair|complete)\b/.test(text);

  const understood: string[] = [];
  if (occasion) understood.push(cap(occasion));
  if (gender) understood.push(`For ${gender}`);
  if (budget) understood.push(`${budget.kind === "total" ? "Whole outfit" : "Each item"} up to ₹${budget.amount.toLocaleString("en-IN")}`);
  if (styles.length) understood.push(styles.map(cap).join(" / "));
  if (colors.length) understood.push(`Colour: ${colors.join(", ")}`);
  if (categories.length) understood.push(`Item: ${categories.join(", ")}`);

  return { occasion, budget, gender, colors, styles, categories, matchIntent, understood };
}

export const hasAnyIntent = (r: ParsedRequest) => Boolean(r.occasion || r.budget || r.colors.length || r.styles.length || r.categories.length);
