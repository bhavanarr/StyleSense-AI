import { DIMENSIONS, DIMENSION_LABEL, type Dimension, type FitPreference, type MeasurementProfile, type Unit } from "./types";
import { fromCm, parseNumber, round1, toCm, trim1 } from "./units";

export const PROFILE_KEY = "stylesense.profile.v1";

/** Plausible adult ranges (cm). Anything outside is almost certainly a typo or wrong unit. */
export const PLAUSIBLE_CM: Record<Dimension, [number, number]> = {
  height: [100, 230], chest: [60, 160], waist: [45, 150], hips: [60, 170], shoulder: [30, 65],
};

export const FITS: FitPreference[] = ["slim", "regular", "relaxed"];

export type InputResult = { kind: "empty" } | { kind: "ok"; cm: number } | { kind: "error"; message: string };

export function parseMeasurementInput(raw: string, unit: Unit, dim: Dimension): InputResult {
  if (raw.trim() === "") return { kind: "empty" };
  const n = parseNumber(raw);
  const [lo, hi] = PLAUSIBLE_CM[dim];
  const range = `${trim1(fromCm(lo, unit))} and ${trim1(fromCm(hi, unit))} ${unit}`;
  if (n === null) return { kind: "error", message: `Enter ${DIMENSION_LABEL[dim].toLowerCase()} as a number in ${unit}, like ${trim1(fromCm((lo + hi) / 2, unit))}.` };
  const cm = round1(toCm(n, unit));
  if (cm < lo || cm > hi) return { kind: "error", message: `${DIMENSION_LABEL[dim]} should be between ${range}. Check the number and the unit.` };
  return { kind: "ok", cm };
}

export function buildProfile(inputs: Partial<Record<Dimension, string>>, unit: Unit, fit: FitPreference) {
  const errors: Partial<Record<Dimension, string>> = {};
  const profile: MeasurementProfile = { unit, fit };
  for (const d of DIMENSIONS) {
    const r = parseMeasurementInput(inputs[d] ?? "", unit, d);
    if (r.kind === "error") errors[d] = r.message;
    else if (r.kind === "ok") profile[d] = r.cm;
  }
  return { profile, errors, valid: Object.keys(errors).length === 0 };
}

/** Re-expresses typed values when the person switches unit. Unparseable text is left alone. */
export function convertInputs(inputs: Partial<Record<Dimension, string>>, from: Unit, to: Unit): Partial<Record<Dimension, string>> {
  if (from === to) return inputs;
  const out: Partial<Record<Dimension, string>> = {};
  for (const d of DIMENSIONS) {
    const raw = inputs[d] ?? "";
    const n = parseNumber(raw);
    out[d] = n === null ? raw : trim1(fromCm(toCm(n, from), to));
  }
  return out;
}

export const hasMeasurements = (p: MeasurementProfile | null | undefined): boolean =>
  Boolean(p) && DIMENSIONS.some((d) => typeof p![d] === "number");

/** Defensive parse of whatever is in localStorage: invalid fields are dropped, never thrown. */
export function parseStoredProfile(raw: string | null): MeasurementProfile | null {
  if (!raw) return null;
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return null; }
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const o = data as Record<string, unknown>;
  const profile: MeasurementProfile = {
    unit: o.unit === "in" ? "in" : "cm",
    fit: FITS.includes(o.fit as FitPreference) ? (o.fit as FitPreference) : "regular",
  };
  for (const d of DIMENSIONS) {
    const v = o[d];
    if (typeof v === "number" && Number.isFinite(v) && v >= PLAUSIBLE_CM[d][0] && v <= PLAUSIBLE_CM[d][1]) profile[d] = round1(v);
  }
  return profile;
}
