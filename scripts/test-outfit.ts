import { products } from "../src/data/products";
import { buildOutfit, slotOf, MIN_SCORE } from "../src/lib/recommend/outfit";
import { colorCompat } from "../src/lib/recommend/colors";
import { C } from "../src/data/colors";
import type { Product } from "../src/types";

let failures = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failures++; };
const byId = (id: string) => products.find((p) => p.id === id)!;
const anchors = products.filter((p) => p.inStock);

const bad: string[] = [];
let complete = 0, total = 0;
for (const a of anchors) {
  for (const g of (a.gender === "unisex" ? ["men", "women"] : [a.gender]) as ("men" | "women")[]) {
    const o = buildOutfit(a, { gender: g });
    total++; if (o.complete) complete++;
    const rec = o.items.filter((i) => !i.isAnchor);
    const slots = rec.map((i) => i.slot);
    if (o.items[0].product.id !== a.id) bad.push(`${a.id}: anchor not first`);
    if (new Set(slots).size !== slots.length) bad.push(`${a.id}/${g}: duplicate slot`);
    if (slots.includes(slotOf(a))) bad.push(`${a.id}/${g}: recommends same slot as anchor`);
    if (rec.some((i) => !i.product.inStock)) bad.push(`${a.id}/${g}: sold-out item`);
    if (rec.some((i) => i.product.gender !== "unisex" && i.product.gender !== g)) bad.push(`${a.id}/${g}: wrong gender item`);
    if (rec.some((i) => !i.product.occasions.some((x) => a.occasions.includes(x)))) bad.push(`${a.id}/${g}: occasion mismatch`);
    if (rec.some((i) => i.score < MIN_SCORE)) bad.push(`${a.id}/${g}: item below min score`);
    if (o.total !== o.items.reduce((n, i) => n + i.product.price, 0)) bad.push(`${a.id}/${g}: total != sum`);
    if (slots.includes("top") && slots.includes("dress")) bad.push(`${a.id}/${g}: top and dress together`);
    if (a.styles.includes("formal") && rec.some((i) => i.product.styles.length && i.product.styles.every((s) => s === "sporty" || s === "streetwear")))
      bad.push(`${a.id}/${g}: sporty/streetwear-only piece with a formal anchor`);
  }
}
check(bad.length === 0, `structural invariants hold for ${total} anchor/gender combinations${bad.length ? "\n   " + bad.slice(0, 8).join("\n   ") : ""}`);
console.log(`INFO  ${complete}/${total} anchors produce a complete outfit (rest are shown partial with notes, never padded)`);
check(complete / total >= 0.85, "at least 85% of anchors yield a complete outfit");

// Determinism
check(JSON.stringify(buildOutfit(byId("kasa-oxford-white"))) === JSON.stringify(buildOutfit(byId("kasa-oxford-white"))), "same input -> identical outfit");

// Spot checks on judgement
const oxford = buildOutfit(byId("kasa-oxford-white"));
const names = oxford.items.map((i) => i.product.id);
check(oxford.complete, "Oxford shirt outfit is complete");
check(!names.some((n) => /joggers|runner|hoodie|windbreaker/.test(n)), `formal shirt avoids sportswear (${names.join(", ")})`);
const kurta = buildOutfit(byId("aranya-kurta-cream"));
check(kurta.items.some((i) => i.product.styles.includes("ethnic") && i.slot === "bottom"), "men's cream kurta gets an ethnic bottom (churidar)");
const heels = buildOutfit(byId("meridian-heels-blush"), { gender: "women" });
check(heels.items.some((i) => i.slot === "dress" || i.slot === "top"), "women's heels get a dress or top as the base (dress plan works)");

// Per-item budget
const capped = buildOutfit(byId("loom-tee-black"), { perItemMax: 1500 });
check(capped.items.filter((i) => !i.isAnchor).every((i) => i.product.price <= 1500), "per-item cap respected for every recommended piece");
const tiny = buildOutfit(byId("kasa-oxford-white"), { perItemMax: 300 });
check(!tiny.complete && tiny.items.length === 1 && tiny.notes.length > 0, "impossible per-item cap -> no filler items, honest notes");

// Total budget
const tb = buildOutfit(byId("loom-tee-black"), { totalBudget: 4000 });
check(tb.budget.within && tb.total <= 4000, `total budget 4000 respected (total ${tb.total})`);
const loose = buildOutfit(byId("loom-tee-black"), { totalBudget: 99999 });
const tight = buildOutfit(byId("kasa-blazer-navy"), { totalBudget: 5000 });
check(tight.total <= 5000 || (!tight.budget.within && tight.budget.overBy === tight.total - 5000), "tight budget: fits, or is flagged with the exact overage");
check(tight.total <= loose.total + tight.anchor.price, "tight budget never costs more than an unconstrained one would");
const impossible = buildOutfit(byId("kasa-blazer-navy"), { totalBudget: 1000 });
check(!impossible.budget.within && impossible.budget.overBy === impossible.total - 1000, `impossible budget flagged honestly (over by ₹${impossible.budget.overBy})`);
let allBudgetOk = true;
for (const a of anchors) for (const t of [2500, 4000, 6000]) {
  const o = buildOutfit(a, { totalBudget: t, gender: a.gender === "men" ? "men" : "women" });
  if (o.budget.within !== (o.total <= t && true)) allBudgetOk = false;
  if (o.budget.overBy !== Math.max(0, o.total - t)) allBudgetOk = false;
}
check(allBudgetOk, "budget flags consistent with totals for every anchor at 2500/4000/6000");

// Colour rules
check(colorCompat(C.black, C.maroon).score >= 0.85, "neutral + bold colour scores high");
check(colorCompat(C.mustard, C.lavender).score < 0.5, "mustard + lavender flagged as contrast risk");
check(colorCompat(C.olive, C.mustard).score >= 0.85, "olive + mustard is a listed pairing");
check(colorCompat(C.maroon, C.olive).score === colorCompat(C.olive, C.maroon).score, "colour compatibility is symmetric");

// Unisex anchor gets different sides
const sneakerM = buildOutfit(byId("meridian-sneaker-white"), { gender: "men" });
const sneakerW = buildOutfit(byId("meridian-sneaker-white"), { gender: "women" });
check(sneakerM.items.every((i) => i.product.gender !== "women") && sneakerW.items.every((i) => i.product.gender !== "men"), "unisex anchor respects the chosen gender");

console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll outfit-engine checks passed");
process.exit(failures ? 1 : 0);
