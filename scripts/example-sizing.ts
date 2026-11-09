/**
 * A worked example of the size algorithm. It re-derives each number by hand (the same formulas as
 * src/lib/sizing/recommend.ts) and ASSERTS that they match the real recommendSize() output, so this
 * explanation cannot drift from the code. Run: npm run example:sizing
 */
import { chartFor } from "../src/data/sizeCharts";
import { productById } from "../src/data/products";
import { recommendSize } from "../src/lib/sizing/recommend";
import type { Dimension, FitPreference, MeasurementProfile } from "../src/lib/sizing/types";

const product = productById("kasa-oxford-white")!;
const { chart, cut } = chartFor(product)!;
const body: MeasurementProfile = { unit: "cm", fit: "regular", chest: 98, waist: 82, shoulder: 44.5 };

const WEIGHTS: Partial<Record<Dimension, number>> = { chest: 1, shoulder: 0.6, waist: 0.4 }; // tops
const EASE: Record<FitPreference, number> = { slim: 4, regular: 8, relaxed: 12 };
const SCALE: Partial<Record<Dimension, number>> = { chest: 1, waist: 0.5, hips: 0.6, shoulder: 0.25 };
const dims = Object.keys(WEIGHTS) as Dimension[];
const rows = chart.rows;
const band = (d: Dimension) => { const w = rows.map((r) => r.ranges[d]![1] - r.ranges[d]![0]).sort((a, b) => a - b); return w[Math.floor(w.length / 2)]; };
const dev = (v: number, [lo, hi]: [number, number], b: number) => (v >= lo && v <= hi ? 0 : v > hi ? ((v - hi) / b) * 1.5 : (lo - v) / b);
const f = (n: number) => (Math.round(n * 1000) / 1000).toString();

function walk(fit: FitPreference) {
  console.log(`\n━━━━ ${product.name} (${chart.label}), your fit preference: ${fit.toUpperCase()}; garment cut: ${cut} ━━━━`);
  console.log(`Body: chest ${body.chest}, waist ${body.waist}, shoulder ${body.shoulder} cm`);
  console.log("\nSTEP 1: shift your measurements by (ease you want − ease the garment has) × scale");
  const adj: Partial<Record<Dimension, number>> = {};
  for (const d of dims) {
    const shift = Math.max(-6 * SCALE[d]!, Math.min(6 * SCALE[d]!, (EASE[fit] - EASE[cut]) * SCALE[d]!));
    adj[d] = (body[d] as number) + shift;
    console.log(`  ${d.padEnd(8)} ${body[d]} ${shift >= 0 ? "+" : "−"} ${Math.abs(shift)} = ${adj[d]}`);
  }
  console.log("\nSTEP 2: how far outside each size's range is each adjusted measurement? (÷ band width; too-small counts ×1.5)");
  const wSum = dims.reduce((n, d) => n + WEIGHTS[d]!, 0);
  const costs = rows.map((r) => {
    const parts = dims.map((d) => dev(adj[d]!, r.ranges[d]!, band(d)));
    const cost = dims.reduce((n, d, i) => n + WEIGHTS[d]! * parts[i], 0) / wSum;
    console.log(`  ${r.size.padEnd(4)} ` + dims.map((d, i) => `${d} ${r.ranges[d]![0]}–${r.ranges[d]![1]}: ${f(parts[i])}`).join("   ") + `   → weighted cost ${f(cost)}`);
    return { size: r.size, cost };
  });
  costs.sort((a, b) => a.cost - b.cost);
  console.log(`\nSTEP 3: lowest cost wins → ${costs[0].size}   (runner-up ${costs[1].size}, cost ${f(costs[1].cost)})`);

  const real = recommendSize(product, { ...body, fit });
  if (real.status !== "ok") throw new Error("expected ok");
  const mismatch = costs.some((c) => Math.abs((real.candidates.find((x) => x.size === c.size)?.cost ?? NaN) - c.cost) > 0.001);
  if (real.size !== costs[0].size || mismatch) throw new Error("WORKED EXAMPLE DOES NOT MATCH THE ALGORITHM");
  const separation = Math.min((costs[1].cost - costs[0].cost) / 0.6, 1);
  console.log(`\nSTEP 4: confidence = 40×coverage(1) + 35×fitQuality(${f(1 - Math.min(costs[0].cost, 1))}) + 25×separation(${f(separation)}) = ${real.score}/100 → ${real.confidence.toUpperCase()}`);
  console.log(`✔ matches recommendSize(): size ${real.size}, confidence ${real.confidence} (${real.score})`);
  if (real.alternative) console.log(`  alternative shown to the shopper: ${real.alternative.note}`);
}

for (const fit of ["regular", "slim", "relaxed"] as const) walk(fit);

console.log("\n━━━━ Same body, same 'regular' preference, other brands ━━━━");
for (const id of ["kasa-oxford-white", "loom-tee-white", "northline-tee-grey"]) {
  const p = productById(id)!, r = recommendSize(p, { ...body, fit: "regular" }), c = chartFor(p)!;
  console.log(`  ${p.name.padEnd(26)} chart "${c.chart.label}" (cut ${c.cut}, stretch ${c.chart.stretch}) → ${r.status === "ok" ? `${r.size} (${r.confidence})` : r.status}`);
}
