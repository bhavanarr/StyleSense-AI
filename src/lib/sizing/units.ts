import type { Unit } from "./types";

export const CM_PER_INCH = 2.54;

export const inToCm = (inches: number): number => inches * CM_PER_INCH;
export const cmToIn = (cm: number): number => cm / CM_PER_INCH;
export const toCm = (value: number, unit: Unit): number => (unit === "cm" ? value : inToCm(value));
export const fromCm = (cm: number, unit: Unit): number => (unit === "cm" ? cm : cmToIn(cm));
export const round1 = (n: number): number => Math.round(n * 10) / 10;

/** "102", "40.2": at most one decimal, no trailing ".0". */
export const trim1 = (n: number): string => String(round1(n));

export const formatValue = (cm: number, unit: Unit): string => `${trim1(fromCm(cm, unit))} ${unit}`;

export function formatRange([lo, hi]: [number, number], unit: Unit): string {
  return `${trim1(fromCm(lo, unit))}–${trim1(fromCm(hi, unit))} ${unit}`;
}

/** Accepts "102", "102.5", "102,5". Rejects empty strings, units, exponents and negatives. */
export function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(",", ".");
  if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
