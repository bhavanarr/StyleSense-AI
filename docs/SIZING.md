# Size intelligence

Suggests a size per product from a saved body-measurement profile and that brand's size chart.
It estimates a good size. It never claims a perfect fit.

## Where things live

| Path | Purpose |
|---|---|
| `src/lib/sizing/units.ts` | cm / inch conversion, number parsing, formatting |
| `src/lib/sizing/profile.ts` | validation, plausible ranges, safe localStorage parsing |
| `src/lib/sizing/recommend.ts` | the algorithm |
| `src/data/sizeCharts.ts` | illustrative charts and the product-to-chart rules |
| `src/components/SizeProfileForm.tsx`, `SizeAdvice.tsx`, `SizeComparison.tsx` | UI |
| `scripts/example-sizing.ts` | worked example that asserts it matches the code (`npm run example:sizing`) |

## Data model

- A profile stores height, chest, waist, hips and shoulder **in cm**, plus a display unit and a fit preference.
  Inches are converted on input and on display, so cm and inches always give identical results.
- A chart row lists the **body** measurements (cm range) each size is designed for.
  Each chart also has a `cut` (how roomy the garment is) and `stretch` (1 = rigid, lower = stretchy, so deviations matter less).
- **All charts are illustrative.** The brands are fictional, the `illustrative: true` flag is required by the type system,
  and the UI says so next to every chart. To use a real brand, replace its chart with the figures the brand publishes.

## Algorithm

1. **Which measurements matter.** Each garment type has weights (tops: chest 1, shoulder 0.6, waist 0.4;
   trousers: waist 1, hips 0.7; ...) and required measurements (chest for tops, waist for bottoms).
   Missing required measurements give "insufficient data", never a guess.
2. **Fit adjustment.** Desired ease (slim 4, regular 8, relaxed 12 cm of chest) minus the garment's own ease
   gives a shift, scaled per measurement and capped. Your measurement is moved by that shift before matching.
3. **Cost per size.** For each measurement, how far it sits outside the size's range, in units of the band width.
   Too small costs 1.5x more than too big. The weighted average is the size's cost.
4. **Pick the lowest cost.** Ties go to the smaller size for slim, otherwise the larger.
5. **Confidence** (0-100, shown as high / medium / low): 40 x measurement coverage + 35 x how well the winner fits
   + 25 x how clearly it beats the runner-up. Reduced when measurements point to different sizes. Capped when
   coverage is thin, and always **low** when you fall outside the chart's whole range.

## Warnings it can raise

Missing optional measurements; a chart that omits a measurement; measurements that disagree; a body above or
below the chart's range; a length warning when your height is outside the range the garment is designed for;
and a "between sizes" note naming the runner-up.

## Not covered

- Shoes (needs foot length, which the profile doesn't collect) and one-size items get an explanation, not a size.
- Real brand charts, fabric behaviour, and individual build (e.g. long torso) are not modelled.

## Tests

`scripts/test-sizing.ts` (conversions, validation, chart integrity, brand differences, fit preferences, missing
data, extremes, 55k randomised runs, "never promises a perfect fit") and `tests/sizing-ui.test.tsx` (form,
persistence, product-page suggestion, fit preview, brand comparison).
