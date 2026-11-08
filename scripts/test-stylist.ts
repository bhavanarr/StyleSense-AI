import { parseRequest, hasAnyIntent } from "../src/lib/stylist/parse";
import { suggestOutfits } from "../src/lib/stylist/suggest";

let failures = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failures++; };

// The four example prompts from the product brief
let r = parseRequest("I need a classy farewell outfit under ₹2500.");
check(r.occasion === "farewell" && r.budget?.amount === 2500 && r.budget.kind === "total" && r.styles.includes("classic") && !r.gender, "farewell / ₹2500 total / classic / gender unknown");
r = parseRequest("Suggest a birthday outfit for my sister.");
check(r.occasion === "birthday" && r.gender === "women" && !r.budget, "birthday / women (via 'sister') / no budget");
r = parseRequest("I need a casual college outfit.");
check(r.occasion === "college", "'casual college' resolves to the more specific college");
r = parseRequest("Show me outfits that match these trousers.");
check(r.categories.includes("trousers") && r.matchIntent, "'match these trousers' -> trousers + match intent");

// Parsing edge cases
check(parseRequest("outfit for women under 3k").budget?.amount === 3000, "'3k' = 3000");
check(parseRequest("budget of Rs. 4,500 for men").budget?.amount === 4500, "'Rs. 4,500' parsed with comma");
check(parseRequest("a shirt under 1200").budget?.kind === "per-item", "'a shirt under 1200' is a per-item budget");
check(parseRequest("outfit under 3000 per item").budget?.kind === "per-item", "'per item' is respected");
check(parseRequest("3 outfits please").budget === undefined, "bare small numbers aren't budgets");
check(parseRequest("clothes for women").gender === "women" && parseRequest("clothes for women").gender !== "men", "'women' is not misread as 'men'");
check(parseRequest("for my brother and sister").gender === undefined, "conflicting genders -> unknown (ask)");
check(parseRequest("something in blue for a wedding").colors.includes("Navy") && parseRequest("something in blue").occasion === undefined, "'blue' expands to blue family");
check(!hasAnyIntent(parseRequest("hello there")), "small talk has no intent (UI will ask for details)");
check(parseRequest("white t-shirt").categories.join() === "tshirt", "'t-shirt' doesn't also count as 'shirt'");
check(parseRequest("x".repeat(5000)).understood.length === 0, "very long input handled safely");

// Suggestions
for (const g of ["women", "men"] as const) {
  const s = suggestOutfits({ ...parseRequest("classy farewell outfit under 2500"), gender: g });
  const t = s.outfits[0]?.total;
  check(s.outfits.length > 0, `${g}: ${s.outfits.length} outfit(s) for farewell under ₹2500${s.overBudget ? " (closest, over budget)" : ""}`);
  console.log(`INFO  ${g}: ${s.outfits.map((o) => `₹${o.total}`).join(", ") || "none"}  overBudget=${s.overBudget}`);
  check(s.overBudget ? s.outfits.every((o) => !o.budget.within) : s.outfits.every((o) => o.budget.within && o.total <= 2500), `${g}: outfits either fit ₹2500 or are explicitly flagged`);
  if (t) check(s.outfits.every((o, i, a) => i === 0 || o.anchor.id !== a[0].anchor.id), `${g}: suggested outfits use different base pieces`);
}
const noBudget = suggestOutfits({ ...parseRequest("birthday outfit for my sister"), gender: "women" });
check(noBudget.outfits.length === 3 && noBudget.outfits.every((o) => o.complete), "birthday for women: 3 complete outfits");
const impossible = suggestOutfits({ ...parseRequest("farewell outfit under 500"), gender: "men" });
check(impossible.overBudget && impossible.outfits.every((o) => !o.budget.within), "₹500 total: shows closest options, flagged over budget (not hidden, not faked)");
const green = suggestOutfits({ ...parseRequest("green dress for a party"), gender: "women" });
check(green.outfits.length > 0 && green.outfits[0].anchor.color.name === "Emerald" && green.outfits[0].anchor.category === "dress", "green dress -> emerald dress anchor");
const trousers = suggestOutfits({ ...parseRequest("outfits that match these trousers"), gender: "men" });
check(trousers.outfits.length > 0 && trousers.outfits.every((o) => o.anchor.category === "trousers" || o.anchor.category === "jeans"), "trouser request builds around trousers");

console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll stylist checks passed");
process.exit(failures ? 1 : 0);
