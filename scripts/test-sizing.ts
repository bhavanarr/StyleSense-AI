import { products, productById } from "../src/data/products";
import { SIZE_CHARTS, chartFor } from "../src/data/sizeCharts";
import { DISCLAIMER, recommendSize } from "../src/lib/sizing/recommend";
import { buildProfile, convertInputs, hasMeasurements, parseMeasurementInput, parseStoredProfile } from "../src/lib/sizing/profile";
import { cmToIn, formatRange, formatValue, inToCm, parseNumber, round1, toCm, fromCm } from "../src/lib/sizing/units";
import type { Dimension, FitPreference, MeasurementProfile } from "../src/lib/sizing/types";

let failures = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failures++; };
const P = (id: string) => productById(id)!;
const size = (id: string, prof: MeasurementProfile | null) => { const r = recommendSize(P(id), prof); return r.status === "ok" ? r.size : `[${r.status}]`; };
const ok = (id: string, prof: MeasurementProfile | null) => { const r = recommendSize(P(id), prof); if (r.status !== "ok") throw new Error(`${id}: expected ok, got ${r.status}`); return r; };

const MEN: MeasurementProfile = { unit: "cm", fit: "regular", height: 175, chest: 98, waist: 82, hips: 98, shoulder: 44.5 };
const WOMEN: MeasurementProfile = { unit: "cm", fit: "regular", height: 162, chest: 88, waist: 72, hips: 96, shoulder: 38 };

// ───────── 1. Unit conversion ─────────
console.log("\n— Unit conversion —");
check(inToCm(1) === 2.54 && inToCm(10) === 25.4, "1 in = 2.54 cm");
check(Math.abs(cmToIn(2.54) - 1) < 1e-12 && Math.abs(cmToIn(100) - 39.3701) < 1e-4, "cm → in");
let worst = 0;
for (let cm = 30; cm <= 230; cm += 0.7) worst = Math.max(worst, Math.abs(toCm(fromCm(cm, "in"), "in") - cm));
check(worst < 1e-9, "cm → in → cm round trip is lossless");
check(toCm(38.6, "in") === inToCm(38.6) && toCm(98, "cm") === 98, "toCm respects the unit");
check(round1(98.04) === 98 && round1(98.06) === 98.1, "round1 rounds to one decimal");
check(formatValue(98, "cm") === "98 cm" && formatValue(98, "in") === "38.6 in", "formatValue: 98 cm = 38.6 in");
check(formatRange([95, 100], "in") === "37.4–39.4 in", "formatRange in inches");
check(parseNumber("98") === 98 && parseNumber("98.5") === 98.5 && parseNumber("98,5") === 98.5 && parseNumber(" 98 ") === 98 && parseNumber(".5") === 0.5, "parseNumber accepts 98, 98.5, 98,5, spaces, .5");
check(["", "abc", "-5", "1e3", "98cm", "9 8", ".", "NaN", "Infinity", "1,000.5", "98.5.1"].every((x) => parseNumber(x) === null), "parseNumber rejects blanks, text, negatives, exponents, units, junk");

// ───────── 2. Input parsing and validation ─────────
console.log("\n— Input validation —");
check(parseMeasurementInput("", "cm", "chest").kind === "empty", "blank input = not provided (not an error)");
const a = parseMeasurementInput("98", "cm", "chest"); check(a.kind === "ok" && a.cm === 98, "98 cm accepted");
const b = parseMeasurementInput("38.6", "in", "chest"); check(b.kind === "ok" && b.cm === 98, "38.6 in → 98 cm");
const c = parseMeasurementInput("98", "in", "chest"); check(c.kind === "error", "98 typed as INCHES is rejected (that's 249 cm)");
const d = parseMeasurementInput("38", "cm", "chest"); check(d.kind === "error" && /between 60 and 160 cm/.test(d.message), "38 typed as CM is rejected with the allowed range");
const e = parseMeasurementInput("abc", "cm", "waist"); check(e.kind === "error" && /number/.test(e.message), "text is rejected with guidance");
check(["height", "chest", "waist", "hips", "shoulder"].every((k) => parseMeasurementInput("0", "cm", k as Dimension).kind === "error"), "zero is rejected for every field");
const built = buildProfile({ height: "5.0", chest: "40", waist: "", hips: "abc", shoulder: "17.5" }, "in", "slim");
check(!built.valid && Object.keys(built.errors).sort().join() === "height,hips", "buildProfile reports only the bad fields (height 5 in, hips abc)");
const good = buildProfile({ height: "69", chest: "38.6", waist: "32.3", hips: "38.6", shoulder: "17.5" }, "in", "relaxed");
check(good.valid && good.profile.unit === "in" && good.profile.fit === "relaxed" && good.profile.chest === 98 && good.profile.height === 175.3, "inch inputs are stored in cm");
check(!hasMeasurements(buildProfile({}, "cm", "regular").profile) && !hasMeasurements(null), "empty / null profile has no measurements");
const rt = convertInputs(convertInputs({ chest: "98", waist: "82", height: "175.5", hips: "abc" }, "cm", "in"), "in", "cm");
check(rt.chest === "98" && rt.waist === "82" && rt.height === "175.5" && rt.hips === "abc", "switching cm → in → cm restores values; unparseable text is left alone");
check(convertInputs({ chest: "98" }, "cm", "in").chest === "38.6", "switching to inches converts 98 → 38.6");

// ───────── 3. Stored profile parsing (localStorage safety) ─────────
console.log("\n— Stored profile safety —");
check(parseStoredProfile(null) === null && parseStoredProfile("{oops") === null && parseStoredProfile("[1]") === null && parseStoredProfile("7") === null, "null / bad JSON / array / number → null, no throw");
const sp = parseStoredProfile(JSON.stringify({ unit: "furlongs", fit: "baggy", chest: 98, waist: 9999, hips: "100", height: -4, shoulder: 44.44, evil: "<script>" }))!;
check(sp.unit === "cm" && sp.fit === "regular" && sp.chest === 98 && sp.waist === undefined && sp.hips === undefined && sp.height === undefined && sp.shoulder === 44.4 && !("evil" in sp), "invalid unit/fit/values are dropped or defaulted, unknown keys ignored");
check(JSON.stringify(parseStoredProfile(JSON.stringify(MEN))) === JSON.stringify(MEN), "a valid profile survives a JSON round trip");

// ───────── 4. Chart data integrity ─────────
console.log("\n— Size chart integrity —");
check(SIZE_CHARTS.every((c) => c.illustrative === true), `all ${SIZE_CHARTS.length} charts are flagged illustrative`);
check(SIZE_CHARTS.every((c) => c.rows.every((r) => Object.values(r.ranges).every(([lo, hi]) => lo > 0 && lo < hi))), "every range has 0 < min < max");
const monotone = SIZE_CHARTS.every((c) => (["chest", "waist", "hips", "shoulder"] as const).every((dim) => { const v = c.rows.map((r) => r.ranges[dim]?.[0]).filter((x): x is number => x !== undefined); return v.every((x, i) => i === 0 || x > v[i - 1]); }));
check(monotone, "sizes increase monotonically in every dimension");
const sized = products.filter((p) => p.sizeSystem !== "free" && p.sizeSystem !== "uk-shoe");
check(sized.every((p) => { const m = chartFor(p); return m && p.sizes.every((s) => m.chart.rows.some((r) => r.size === s)); }), `all ${sized.length} sized products have a chart covering every size they sell`);
check(sized.every((p) => chartFor(p)!.chart.brandId === p.brandId), "a product only ever uses its own brand's chart");
check(products.filter((p) => p.sizeSystem === "free" || p.sizeSystem === "uk-shoe").every((p) => ["not-applicable"].includes(recommendSize(p, MEN).status)), "free-size and shoes are never given a body-measurement size");
check(new Set(SIZE_CHARTS.map((c) => c.id)).size === SIZE_CHARTS.length, "chart ids are unique");

// ───────── 5. Different brands give different sizes ─────────
console.log("\n— Brand differences —");
const menTops = ["kasa-oxford-white", "loom-tee-white", "northline-tee-grey", "aranya-kurta-cream"].map((id) => size(id, MEN));
console.log(`INFO  men's tops (98 cm chest, regular): Kasa ${menTops[0]}, Loom ${menTops[1]}, Northline ${menTops[2]}, Aranya ${menTops[3]}`);
check(new Set(menTops).size >= 3, "the SAME man gets at least 3 different labels across 4 brands' tops");
check(size("kasa-oxford-white", MEN) === "M" && size("loom-tee-white", MEN) === "S" && size("northline-tee-grey", MEN) === "L", "regression: Kasa M, Loom S (runs large), Northline L");
const menBottoms = ["kasa-trouser-charcoal", "aranya-churidar-cream", "northline-joggers-charcoal", "loom-jeans-denim"].map((id) => size(id, MEN));
console.log(`INFO  men's bottoms (82 cm waist): Kasa ${menBottoms[0]}, Aranya ${menBottoms[1]}, Northline ${menBottoms[2]}, Loom ${menBottoms[3]}`);
check(new Set(menBottoms).size >= 3, "the same waist gets at least 3 different labels across brands' bottoms");
const womenTops = ["vela-blouse-blush", "loom-tee-lavender", "northline-tee-grey"].map((id) => size(id, WOMEN));
check(new Set(womenTops).size >= 2, `women's tops differ by brand (${womenTops.join(", ")})`);
check(size("loom-chino-navy", MEN) !== "[insufficient]" && chartFor(P("loom-chino-navy"))!.chart.id === "loom-chino-men", "Loom chinos use their own chart, not the denim one");
const allMenSizes = new Set(products.filter((p) => (p.gender === "men" || p.gender === "unisex") && ["tshirt", "shirt", "kurta", "jacket"].includes(p.category)).map((p) => size(p.id, MEN)));
check(allMenSizes.size > 1, "no single size is assigned to every garment");

// ───────── 6. Fit preferences ─────────
console.log("\n— Fit preferences —");
const idx = (id: string, prof: MeasurementProfile) => { const r = recommendSize(P(id), prof); return r.status === "ok" ? P(id).sizes.indexOf(r.size) : -1; };
let breaks = 0, changed = 0, cases = 0;
for (const p of sized) {
  const dims = chartFor(p)!.chart.rows[0].ranges;
  const mid = (d: Dimension) => { const rows = chartFor(p)!.chart.rows; const lo = rows[0].ranges[d], hi = rows[rows.length - 1].ranges[d]; return lo && hi ? [lo[0], hi[1]] as const : null; };
  const c = mid("chest") ?? mid("waist"); if (!c || !dims) continue;
  for (let v = c[0]; v <= c[1]; v += 1.5) {
    const base: MeasurementProfile = { unit: "cm", fit: "regular", ...(mid("chest") ? { chest: v } : { waist: v }) };
    const [s, r, l] = (["slim", "regular", "relaxed"] as FitPreference[]).map((fit) => idx(p.id, { ...base, fit }));
    cases++; if (s > r || r > l) breaks++; if (s !== l) changed++;
  }
}
check(breaks === 0, `slim ≤ regular ≤ relaxed in all ${cases} sweep cases (never reversed)`);
check(changed > cases * 0.25, `fit preference actually changes the size in ${changed}/${cases} cases`);
const f = (fit: FitPreference) => size("kasa-oxford-white", { ...MEN, fit });
check(f("slim") === "S" && f("regular") === "M" && f("relaxed") === "L", `same body, Kasa shirt: slim ${f("slim")} / regular ${f("regular")} / relaxed ${f("relaxed")}`);
check(ok("kasa-oxford-white", { ...MEN, fit: "slim" }).fit === "slim", "result reports the fit preference used");
check(idx("kasa-linen-sky", MEN) < idx("kasa-oxford-white", MEN), "a relaxed-cut shirt (linen) needs a smaller size than a regular-cut one for the same body");
check(ok("kasa-oxford-white", { ...MEN, fit: "slim" }).explanation.some((x) => /slim fit/.test(x) && /smaller measurement|no fit adjustment/.test(x)), "the explanation mentions the fit preference");

// ───────── 7. Missing / insufficient data ─────────
console.log("\n— Missing and insufficient data —");
const noProfile = recommendSize(P("kasa-oxford-white"), null);
check(noProfile.status === "insufficient" && noProfile.missing.join() === "chest" && /Add your measurements/.test(noProfile.reason), "no profile → asks for measurements (names the chest)");
check(recommendSize(P("kasa-oxford-white"), { unit: "cm", fit: "regular" }).status === "insufficient", "empty profile → insufficient");
const waistOnly = recommendSize(P("kasa-oxford-white"), { unit: "cm", fit: "regular", waist: 82 });
check(waistOnly.status === "insufficient" && waistOnly.missing.join() === "chest" && /Add your chest/.test(waistOnly.reason), "shirt with only a waist → insufficient, asks for chest");
const chestOnlyBottom = recommendSize(P("kasa-trouser-charcoal"), { unit: "cm", fit: "regular", chest: 98 });
check(chestOnlyBottom.status === "insufficient" && chestOnlyBottom.missing.join() === "waist", "trousers with only a chest → insufficient, asks for waist");
const partial = ok("kasa-oxford-white", { unit: "cm", fit: "regular", chest: 98 });
check(partial.confidence !== "high" && partial.warnings.some((w) => /shoulder width and waist/.test(w)), "chest only → still answers, but confidence is not high and it says what to add");
const full = ok("kasa-oxford-white", MEN);
check(full.score > partial.score, "more measurements → higher confidence score");
const waistOnlyTrouser = ok("kasa-trouser-charcoal", { unit: "cm", fit: "regular", waist: 82 });
check(waistOnlyTrouser.warnings.some((w) => /hips/.test(w)), "trousers with waist only → asks for hips");
const gap = ok("aranya-kurta-emerald", WOMEN);
check(gap.ignored.includes("shoulder") && gap.warnings.some((w) => /doesn't list shoulder/.test(w)) && gap.confidence !== "high", "chart missing a measurement → warns, ignores it, not 'high' confidence");
const synthetic = { ...P("kasa-oxford-white"), id: "synthetic", gender: "women" as const };
check(recommendSize(synthetic, MEN).status === "no-chart", "no chart for the brand/gender → 'no-chart', never a guess");
const shoes = recommendSize(P("meridian-derby-tan"), MEN), watch = recommendSize(P("tidewater-steel-dress"), MEN);
check(shoes.status === "not-applicable" && /foot length/.test(shoes.reason) && watch.status === "not-applicable" && /one size/i.test(watch.reason), "shoes explain foot length; watches say one size");

// ───────── 8. Extremes, conflicts, height ─────────
console.log("\n— Extremes and conflicts —");
const huge = ok("kasa-oxford-white", { unit: "cm", fit: "regular", chest: 140, waist: 130, shoulder: 58 });
check(huge.size === "XXL" && huge.confidence === "low" && huge.warnings.some((w) => /larger than this chart's biggest size/.test(w)), "far above the chart → largest size, LOW confidence, clear warning");
const tiny = ok("kasa-oxford-white", { unit: "cm", fit: "regular", chest: 65, waist: 55, shoulder: 33 });
check(tiny.size === "S" && tiny.confidence === "low" && tiny.warnings.some((w) => /smaller than this chart's smallest size/.test(w)), "far below the chart → smallest size, LOW confidence, clear warning");
const conflict = ok("kasa-oxford-white", { unit: "cm", fit: "regular", chest: 112, waist: 66, shoulder: 44 });
check(conflict.confidence === "low" && conflict.warnings.some((w) => /point to different sizes/.test(w)), "measurements that disagree → LOW confidence and a warning");
check(full.alternative !== undefined && /M and L/.test(full.alternative.note), "near a size boundary → names the alternative size");
check(ok("kasa-oxford-white", { ...MEN, height: 200 }).warnings.some((w) => /length/.test(w)) && !full.warnings.some((w) => /length/.test(w)), "height outside the designed range → length warning; inside → none");
check(/\bin\b/.test(ok("kasa-oxford-white", { ...MEN, unit: "in" }).explanation[0]) && !/\bcm\b/.test(ok("kasa-oxford-white", { ...MEN, unit: "in" }).explanation[0]), "an inches profile gets explanations in inches");

// ───────── 9. Same body, either unit → same answer ─────────
console.log("\n— Unit invariance —");
const inchProfile = buildProfile({ height: "68.9", chest: "38.6", waist: "32.3", hips: "38.6", shoulder: "17.5" }, "in", "regular").profile;
const cmProfile = buildProfile({ height: "175", chest: "98", waist: "82", hips: "98", shoulder: "44.5" }, "cm", "regular").profile;
const sameAll = sized.every((p) => recommendSize(p, inchProfile).status === recommendSize(p, cmProfile).status && size(p.id, inchProfile) === size(p.id, cmProfile));
check(sameAll, "entering the same body in inches or cm gives identical sizes for every product");

// ───────── 10. Honesty and robustness ─────────
console.log("\n— Honesty and robustness —");
check(/not a guarantee/i.test(DISCLAIMER) && /illustrative/i.test(DISCLAIMER), "the standard disclaimer says 'illustrative' and 'not a guarantee'");
let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const range = (lo: number, hi: number) => Math.round((lo + rnd() * (hi - lo)) * 10) / 10;
let crashes = 0, badSize = 0, badScore = 0, perfectClaims = 0, runs = 0;
const text: string[] = [];
for (let i = 0; i < 1500; i++) {
  const prof: MeasurementProfile = { unit: rnd() < 0.5 ? "cm" : "in", fit: (["slim", "regular", "relaxed"] as const)[Math.floor(rnd() * 3)] };
  if (rnd() < 0.8) prof.chest = range(70, 140); if (rnd() < 0.8) prof.waist = range(55, 125); if (rnd() < 0.6) prof.hips = range(75, 140);
  if (rnd() < 0.6) prof.shoulder = range(34, 56); if (rnd() < 0.7) prof.height = range(145, 205);
  for (const p of sized) {
    runs++;
    try {
      const r = recommendSize(p, prof);
      if (r.status === "ok") {
        if (!p.sizes.includes(r.size)) badSize++;
        if (r.score < 0 || r.score > 100) badScore++;
        text.push(...r.explanation, ...r.warnings, r.alternative?.note ?? "");
      }
    } catch { crashes++; }
  }
}
text.forEach((t) => { if (/perfect|guarantee|exact(ly)? fit|will fit/i.test(t)) perfectClaims++; });
check(crashes === 0, `no crashes across ${runs} random profile × product runs`);
check(badSize === 0 && badScore === 0, "recommended size is always one the product sells; score always 0–100");
check(perfectClaims === 0, `none of ${text.length} generated sentences promises a perfect or guaranteed fit`);
check(JSON.stringify(recommendSize(P("kasa-oxford-white"), MEN)) === JSON.stringify(recommendSize(P("kasa-oxford-white"), MEN)), "deterministic: same input → identical output");

console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll sizing checks passed");
process.exit(failures ? 1 : 0);
