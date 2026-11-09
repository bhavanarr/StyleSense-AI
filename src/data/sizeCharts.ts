import type { Category, Product } from "@/types";
import type { Dimension, FitPreference, SizeChart } from "@/lib/sizing/types";

/**
 * ILLUSTRATIVE SIZE CHARTS.
 * Every brand in this catalogue is fictional, so these charts are invented to demonstrate the
 * algorithm: they are NOT real brands' measurements. Each chart lists the BODY measurements (cm)
 * a size is designed for. Brands deliberately differ (some run generous, some snug) so the same
 * body gets different labels at different brands.
 *
 * To use a real brand: replace its chart with the measurements the brand publishes.
 */
const r1 = (n: number) => Math.round(n * 10) / 10;
const MEN = ["S", "M", "L", "XL", "XXL"];
const WOMEN = ["XS", "S", "M", "L", "XL"];
const MEN_WAIST = [28, 30, 32, 34, 36, 38];
const WOMEN_WAIST = [26, 28, 30, 32, 34];

type Base = { id: string; brandId: string; label: string; gender: SizeChart["gender"]; cut: FitPreference; stretch?: number; heightRangeCm?: [number, number]; note?: string };

/** Letter sizes. `dims` gives [start, step] per dimension: size i covers [start + i*step, start + (i+1)*step]. */
function alphaChart(o: Base & { sizes: string[]; dims: Partial<Record<Dimension, [number, number]>> }): SizeChart {
  const rows = o.sizes.map((size, i) => ({
    size,
    ranges: Object.fromEntries(
      Object.entries(o.dims).map(([d, [start, step]]) => [d, [r1(start + i * step), r1(start + (i + 1) * step)]]),
    ) as SizeChart["rows"][number]["ranges"],
  }));
  return { id: o.id, brandId: o.brandId, label: o.label, gender: o.gender, cut: o.cut, stretch: o.stretch ?? 1, heightRangeCm: o.heightRangeCm, note: o.note, illustrative: true, rows };
}

/**
 * Waist sizes in inches (28, 30...). Nominal body waist = size x 2.54 + offsetCm; each size covers +/- one inch.
 * offsetCm > 0: labels run large (a 32 suits a bigger waist). offsetCm < 0: labels run small, so size up.
 */
function waistChart(o: Base & { sizes: number[]; offsetCm: number; hipsOverCm: number }): SizeChart {
  const rows = o.sizes.map((s) => {
    const nominal = s * 2.54 + o.offsetCm;
    return {
      size: String(s),
      ranges: {
        waist: [r1(nominal - 2.54), r1(nominal + 2.54)] as [number, number],
        hips: [r1(nominal + o.hipsOverCm - 2.54), r1(nominal + o.hipsOverCm + 2.54)] as [number, number],
      },
    };
  });
  return { id: o.id, brandId: o.brandId, label: o.label, gender: o.gender, cut: o.cut, stretch: o.stretch ?? 1, heightRangeCm: o.heightRangeCm, note: o.note, illustrative: true, rows };
}

export const SIZE_CHARTS: SizeChart[] = [
  // Kasa & Co: tailored menswear, true to size
  alphaChart({ id: "kasa-shirt-men", brandId: "kasa", label: "Kasa & Co shirts, men", gender: "men", cut: "slim", sizes: MEN, dims: { chest: [90, 5], waist: [76, 6], shoulder: [42, 1.5] }, heightRangeCm: [168, 188], note: "Tailored cut. Sizes run true to the measurements." }),
  alphaChart({ id: "kasa-blazer-men", brandId: "kasa", label: "Kasa & Co blazers, men", gender: "men", cut: "regular", sizes: MEN, dims: { chest: [92, 5], waist: [78, 5], shoulder: [43, 1.5] }, heightRangeCm: [170, 190], note: "Structured jacket: shoulder fit matters most." }),
  waistChart({ id: "kasa-bottom-men", brandId: "kasa", label: "Kasa & Co trousers, men", gender: "men", cut: "regular", sizes: MEN_WAIST, offsetCm: 0, hipsOverCm: 12, note: "Waist sizes in inches, true to size." }),
  // Loom Theory: casual, generous tops, snug denim
  alphaChart({ id: "loom-tee-men", brandId: "loom", label: "Loom Theory tops, men", gender: "men", cut: "regular", sizes: MEN, dims: { chest: [96, 6], waist: [82, 6], shoulder: [44, 1.5] }, heightRangeCm: [165, 190], note: "Generous sizing: runs large, so many people go down a size." }),
  alphaChart({ id: "loom-outer-men", brandId: "loom", label: "Loom Theory layers, men", gender: "men", cut: "relaxed", sizes: MEN, dims: { chest: [98, 6], waist: [84, 6], shoulder: [45, 1.5] }, note: "Roomy by design." }),
  waistChart({ id: "loom-denim-men", brandId: "loom", label: "Loom Theory denim, men", gender: "men", cut: "regular", sizes: MEN_WAIST, offsetCm: -2, hipsOverCm: 12, note: "Runs small: if you are between sizes, go up." }),
  waistChart({ id: "loom-chino-men", brandId: "loom", label: "Loom Theory chinos, men", gender: "men", cut: "regular", sizes: MEN_WAIST, offsetCm: 0.5, hipsOverCm: 13, note: "Waist sizes in inches, close to true to size." }),
  alphaChart({ id: "loom-tee-women", brandId: "loom", label: "Loom Theory tops, women", gender: "women", cut: "relaxed", sizes: WOMEN, dims: { chest: [84, 6], waist: [66, 6], shoulder: [36, 1.5] }, heightRangeCm: [155, 178], note: "Boxy cut with extra room." }),
  waistChart({ id: "loom-denim-women", brandId: "loom", label: "Loom Theory denim, women", gender: "women", cut: "regular", sizes: WOMEN_WAIST, offsetCm: -1.5, hipsOverCm: 22, note: "Runs slightly small." }),
  // Aranya: Indian ethnic wear
  alphaChart({ id: "aranya-kurta-men", brandId: "aranya", label: "Aranya kurtas, men", gender: "men", cut: "regular", sizes: MEN, dims: { chest: [90, 6], waist: [78, 6], hips: [94, 6], shoulder: [41.5, 1.5] }, heightRangeCm: [165, 185], note: "Kurta length is designed for the height range shown." }),
  waistChart({ id: "aranya-churidar-men", brandId: "aranya", label: "Aranya churidar, men", gender: "men", cut: "relaxed", stretch: 0.7, sizes: MEN_WAIST, offsetCm: 2, hipsOverCm: 16, note: "Drawstring waist, forgiving fit." }),
  // Women's kurta chart intentionally has NO shoulder data, to exercise the "chart is incomplete" path.
  alphaChart({ id: "aranya-kurta-women", brandId: "aranya", label: "Aranya kurtas, women", gender: "women", cut: "regular", sizes: WOMEN, dims: { chest: [82, 6], waist: [66, 6], hips: [90, 6] }, heightRangeCm: [155, 170], note: "This chart does not list shoulder width." }),
  waistChart({ id: "aranya-bottom-women", brandId: "aranya", label: "Aranya bottoms, women", gender: "women", cut: "relaxed", stretch: 0.7, sizes: WOMEN_WAIST, offsetCm: 2, hipsOverCm: 24, note: "Elasticated waist, forgiving fit." }),
  // Northline: sport, stretch fabrics, wide size bands
  alphaChart({ id: "northline-top-unisex", brandId: "northline", label: "Northline training tops, unisex", gender: "unisex", cut: "slim", stretch: 0.6, sizes: MEN, dims: { chest: [86, 8], waist: [72, 8], shoulder: [40, 2] }, note: "Stretch fabric: each size covers a wide range." }),
  alphaChart({ id: "northline-outer-men", brandId: "northline", label: "Northline jackets, men", gender: "men", cut: "regular", stretch: 0.9, sizes: MEN, dims: { chest: [90, 7], waist: [76, 7], shoulder: [43, 1.5] }, note: "Fits over a layer." }),
  waistChart({ id: "northline-jogger-men", brandId: "northline", label: "Northline joggers, men", gender: "men", cut: "regular", stretch: 0.6, sizes: MEN_WAIST, offsetCm: 1, hipsOverCm: 14, note: "Elastic waistband with stretch." }),
  // Vela: women's contemporary
  alphaChart({ id: "vela-top-women", brandId: "vela", label: "Vela tops, women", gender: "women", cut: "regular", sizes: WOMEN, dims: { chest: [80, 5], waist: [62, 5], hips: [88, 5], shoulder: [35, 1.5] }, heightRangeCm: [155, 175] }),
  alphaChart({ id: "vela-dress-women", brandId: "vela", label: "Vela dresses, women", gender: "women", cut: "regular", sizes: WOMEN, dims: { chest: [80, 5], waist: [62, 5], hips: [88, 5], shoulder: [35, 1.5] }, heightRangeCm: [155, 175], note: "Dress length is designed for the height range shown." }),
  alphaChart({ id: "vela-blazer-women", brandId: "vela", label: "Vela blazers, women", gender: "women", cut: "regular", sizes: WOMEN, dims: { chest: [82, 5], waist: [64, 5], hips: [90, 5], shoulder: [36, 1.5] }, heightRangeCm: [155, 175] }),
  alphaChart({ id: "vela-skirt-women", brandId: "vela", label: "Vela skirts, women", gender: "women", cut: "regular", sizes: WOMEN, dims: { waist: [62, 5], hips: [88, 5] }, heightRangeCm: [155, 175] }),
  waistChart({ id: "vela-bottom-women", brandId: "vela", label: "Vela trousers and jeans, women", gender: "women", cut: "regular", sizes: WOMEN_WAIST, offsetCm: 0, hipsOverCm: 22, note: "Waist sizes in inches, true to size." }),
];

const chartById = new Map(SIZE_CHARTS.map((c) => [c.id, c]));

interface Rule { brandId: string; genders: Product["gender"][]; categories: Category[]; chartId: string }
const TOPS: Category[] = ["tshirt", "shirt", "top"];
const BOTTOMS: Category[] = ["jeans", "trousers"];

const RULES: Rule[] = [
  { brandId: "kasa", genders: ["men"], categories: ["shirt", "tshirt"], chartId: "kasa-shirt-men" },
  { brandId: "kasa", genders: ["men"], categories: ["jacket"], chartId: "kasa-blazer-men" },
  { brandId: "kasa", genders: ["men"], categories: BOTTOMS, chartId: "kasa-bottom-men" },
  { brandId: "loom", genders: ["men"], categories: ["shirt", "tshirt"], chartId: "loom-tee-men" },
  { brandId: "loom", genders: ["men"], categories: ["jacket"], chartId: "loom-outer-men" },
  { brandId: "loom", genders: ["men"], categories: BOTTOMS, chartId: "loom-denim-men" },
  { brandId: "loom", genders: ["women"], categories: TOPS, chartId: "loom-tee-women" },
  { brandId: "loom", genders: ["women"], categories: BOTTOMS, chartId: "loom-denim-women" },
  { brandId: "aranya", genders: ["men"], categories: ["kurta"], chartId: "aranya-kurta-men" },
  { brandId: "aranya", genders: ["men"], categories: BOTTOMS, chartId: "aranya-churidar-men" },
  { brandId: "aranya", genders: ["women"], categories: ["kurta"], chartId: "aranya-kurta-women" },
  { brandId: "aranya", genders: ["women"], categories: BOTTOMS, chartId: "aranya-bottom-women" },
  { brandId: "northline", genders: ["unisex", "men", "women"], categories: ["tshirt"], chartId: "northline-top-unisex" },
  { brandId: "northline", genders: ["men"], categories: ["jacket"], chartId: "northline-outer-men" },
  { brandId: "northline", genders: ["men"], categories: BOTTOMS, chartId: "northline-jogger-men" },
  { brandId: "vela", genders: ["women"], categories: ["top", "tshirt"], chartId: "vela-top-women" },
  { brandId: "vela", genders: ["women"], categories: ["dress"], chartId: "vela-dress-women" },
  { brandId: "vela", genders: ["women"], categories: ["jacket"], chartId: "vela-blazer-women" },
  { brandId: "vela", genders: ["women"], categories: ["skirt"], chartId: "vela-skirt-women" },
  { brandId: "vela", genders: ["women"], categories: BOTTOMS, chartId: "vela-bottom-women" },
];

/** Per-product cut, where it differs from the chart's default (the garment's name tells us). */
const PRODUCT_CUT: Record<string, FitPreference> = {
  "kasa-oxford-white": "regular", "kasa-linen-sky": "relaxed", "kasa-chino-beige": "slim",
  "kasa-trouser-charcoal": "regular", "loom-poplin-sky": "regular", "loom-tee-olive": "relaxed",
  "loom-jeans-black": "slim", "vela-widejeans-denim": "relaxed", "vela-slip-black": "slim",
  "vela-floral-lavender": "relaxed", "vela-tank-white": "slim", "aranya-anarkali-mustard": "relaxed",
  "northline-joggers-charcoal": "regular",
};

/** Products whose fabric or cut means they should not use their brand's default chart for that category. */
const PRODUCT_CHART: Record<string, string> = {
  "loom-chino-navy": "loom-chino-men", // twill chinos, not rigid denim
};

export interface ChartMatch { chart: SizeChart; cut: FitPreference }

/** The size chart (and garment cut) that applies to a product, or null when none exists. */
export function chartFor(p: Product): ChartMatch | null {
  const rule = RULES.find((r) => r.brandId === p.brandId && r.genders.includes(p.gender) && r.categories.includes(p.category));
  const chart = chartById.get(PRODUCT_CHART[p.id] ?? rule?.chartId ?? "");
  return chart ? { chart, cut: PRODUCT_CUT[p.id] ?? chart.cut } : null;
}
