"use client";

import Link from "next/link";
import { brandById } from "@/data/brands";
import { chartFor } from "@/data/sizeCharts";
import { DISCLAIMER, relevantDimensions } from "@/lib/sizing/recommend";
import { FITS } from "@/lib/sizing/profile";
import { DIMENSION_LABEL, type FitPreference, type MeasurementProfile, type SizeAdvice as Advice } from "@/lib/sizing/types";
import { formatRange } from "@/lib/sizing/units";
import type { Product } from "@/types";
import { Skeleton } from "./Skeleton";

const LEVEL = {
  high: { label: "High confidence", bars: 3, color: "bg-emerald-700", note: "Your measurements sit comfortably within this size." },
  medium: { label: "Medium confidence", bars: 2, color: "bg-marigold-dark", note: "A reasonable match, but read the notes below." },
  low: { label: "Low confidence", bars: 1, color: "bg-[#B3261E]", note: "Treat this as a rough guide only." },
} as const;

function Confidence({ level }: { level: keyof typeof LEVEL }) {
  const l = LEVEL[level];
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`${l.label}`}>
      <span aria-hidden className="flex gap-1">
        {[1, 2, 3].map((i) => (<span key={i} className={`h-2 w-6 rounded-full ${i <= l.bars ? l.color : "bg-ink/15"}`} />))}
      </span>
      <span className="text-sm font-semibold">{l.label}</span>
    </div>
  );
}

interface Props {
  product: Product;
  ready: boolean;
  profile: MeasurementProfile | null;
  advice: Advice;
  fit: FitPreference;
  onFitChange: (fit: FitPreference) => void;
  selected: string | null;
  onSelect: (size: string) => void;
}

export default function SizeAdvice({ product, ready, profile, advice, fit, onFitChange, selected, onSelect }: Props) {
  if (!ready) return <Skeleton className="h-24" />;

  if (advice.status === "not-applicable") {
    return product.sizeSystem === "free" ? null : <p className="rounded-card bg-mist p-3 text-sm text-ink/80">{advice.reason}</p>;
  }
  if (advice.status === "no-chart") {
    return <p className="rounded-card bg-mist p-3 text-sm text-ink/80"><strong>No size suggestion.</strong> {advice.reason}</p>;
  }
  if (advice.status === "insufficient") {
    return (
      <div className="rounded-card border border-peacock/30 bg-peacock-light/50 p-4">
        <p className="text-sm font-semibold">Find your size</p>
        <p className="mt-1 text-sm text-ink/80">{advice.reason}</p>
        <Link href="/size-profile" className="btn-primary mt-3 !py-2">{profile ? "Update my measurements" : "Add my measurements"}</Link>
      </div>
    );
  }

  const brand = brandById(advice.chart.brandId)?.name;
  const match = chartFor(product);
  const dims = relevantDimensions(product.category).filter((d) => match?.chart.rows.every((r) => r.ranges[d]));
  const unit = profile?.unit ?? "cm";
  const level = LEVEL[advice.confidence];

  return (
    <section aria-label="Size suggestion" className="rounded-card border border-ink/15 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-stone">Suggested size at {brand}</p>
          <p className="font-display text-5xl font-semibold leading-none text-peacock">{advice.size}</p>
        </div>
        <div className="space-y-1 text-right">
          <Confidence level={advice.confidence} />
          <p className="max-w-[16rem] text-xs text-stone">{level.note}</p>
        </div>
      </div>

      <button type="button" className="btn-primary mt-4 !py-2" aria-pressed={selected === advice.size} onClick={() => onSelect(advice.size)}>
        {selected === advice.size ? `Size ${advice.size} selected` : `Select size ${advice.size}`}
      </button>

      <div className="mt-5">
        <p id="fit-preview-label" className="text-xs font-semibold text-stone">Fit preference (preview)</p>
        <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-labelledby="fit-preview-label">
          {FITS.map((f) => (<button key={f} type="button" className="chip capitalize !py-1" aria-pressed={fit === f} onClick={() => onFitChange(f)}>{f}</button>))}
        </div>
        {profile && fit !== profile.fit && <p className="mt-1 text-xs text-stone">Previewing {fit}. Your saved preference is {profile.fit}; change it on your <Link href="/size-profile" className="underline underline-offset-2">size profile</Link>.</p>}
      </div>

      <h3 className="mt-5 text-sm font-semibold">Why this size</h3>
      <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-sm text-ink/85">
        {advice.explanation.map((line) => (<li key={line}>{line}</li>))}
      </ul>

      {advice.alternative && <p className="mt-3 rounded-card bg-mist p-3 text-sm"><strong>Between sizes.</strong> {advice.alternative.note}</p>}

      {advice.warnings.length > 0 && (
        <div className="mt-3 rounded-card border border-marigold-dark/40 bg-marigold/15 p-3" aria-label="Warnings">
          <p className="text-sm font-semibold">Worth knowing</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{advice.warnings.map((w) => (<li key={w}>{w}</li>))}</ul>
        </div>
      )}

      {match && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-semibold underline-offset-4 hover:underline">View the size chart ({match.chart.label})</summary>
          <p className="mt-2 rounded-card bg-mist p-2 text-xs"><strong>Illustrative chart.</strong> {brand} is a fictional brand and these numbers were invented to demonstrate sizing. They are body measurements each size is designed for.</p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[20rem] border-collapse text-left text-xs">
              <caption className="sr-only">Body measurements each size is designed for, in {unit}</caption>
              <thead><tr className="border-b border-ink/20"><th scope="col" className="py-1.5 pr-3">Size</th>{dims.map((d) => (<th key={d} scope="col" className="py-1.5 pr-3">{DIMENSION_LABEL[d]}</th>))}</tr></thead>
              <tbody>
                {match.chart.rows.filter((r) => product.sizes.includes(r.size)).map((r) => (
                  <tr key={r.size} className={`border-b border-ink/10 ${r.size === advice.size ? "bg-peacock-light font-semibold" : ""}`}>
                    <th scope="row" className="py-1.5 pr-3">{r.size}{r.size === advice.size ? " ★" : ""}</th>
                    {dims.map((d) => (<td key={d} className="py-1.5 pr-3">{formatRange(r.ranges[d] as [number, number], unit)}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <p className="mt-4 text-xs text-stone">{DISCLAIMER}</p>
    </section>
  );
}
