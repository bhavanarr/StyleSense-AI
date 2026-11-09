/** Body dimensions we can collect. Everything is stored internally in centimetres. */
export const DIMENSIONS = ["height", "chest", "waist", "hips", "shoulder"] as const;
export type Dimension = (typeof DIMENSIONS)[number];
export type Unit = "cm" | "in";
export type FitPreference = "slim" | "regular" | "relaxed";

export const DIMENSION_LABEL: Record<Dimension, string> = {
  height: "Height", chest: "Chest", waist: "Waist", hips: "Hips", shoulder: "Shoulder width",
};

export interface MeasurementProfile {
  unit: Unit; // the unit the person prefers to see; values below are always cm
  fit: FitPreference;
  height?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  shoulder?: number;
}

/** One row of a size chart: the BODY measurements (cm) a size is designed for. */
export interface SizeRow {
  size: string;
  ranges: Partial<Record<Dimension, [min: number, max: number]>>;
}

export interface SizeChart {
  id: string;
  brandId: string;
  label: string;
  gender: "men" | "women" | "unisex";
  /** How the garment is cut: how much room it has relative to the body range of its size. */
  cut: FitPreference;
  /** 1 = rigid fabric. Below 1 = stretch fabric: deviations from the range matter less. */
  stretch: number;
  /** Heights (cm) the garment length is designed for. Used only for length warnings. */
  heightRangeCm?: [number, number];
  note?: string;
  /** Every chart here is invented for a fictional brand. Never remove this flag from demo data. */
  illustrative: true;
  rows: SizeRow[];
}

export type Confidence = "high" | "medium" | "low";

export interface DimensionDetail {
  dim: Dimension;
  valueCm: number;
  /** The value actually matched, after the fit-preference adjustment. */
  effectiveCm: number;
  range: [number, number];
  status: "within" | "above" | "below"; // above: body exceeds the range (snug); below: roomy
  deltaCm: number; // distance outside the range (0 when within)
}

export type SizeAdvice =
  | { status: "not-applicable"; reason: string }
  | { status: "no-chart"; reason: string }
  | { status: "insufficient"; reason: string; missing: Dimension[] }
  | {
      status: "ok";
      size: string;
      confidence: Confidence;
      score: number; // 0..100, shown only as a rough indicator
      chart: { id: string; label: string; brandId: string; note?: string; gender: SizeChart["gender"] };
      fit: FitPreference;
      cut: FitPreference;
      explanation: string[];
      details: DimensionDetail[];
      warnings: string[];
      ignored: Dimension[]; // relevant dimensions the chart doesn't cover
      alternative?: { size: string; note: string };
      candidates: { size: string; cost: number }[];
    };
