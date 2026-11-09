"use client";

import { useEffect, useRef, useState } from "react";
import { buildProfile, convertInputs, FITS, hasMeasurements } from "@/lib/sizing/profile";
import { DIMENSIONS, DIMENSION_LABEL, type Dimension, type FitPreference, type Unit } from "@/lib/sizing/types";
import { fromCm, trim1 } from "@/lib/sizing/units";
import { useShop } from "@/lib/store/ShopProvider";
import { Skeleton } from "./Skeleton";

const HINT: Record<Dimension, string> = {
  height: "Standing straight, without shoes.",
  chest: "Around the fullest part of your chest, under the arms, with the tape level.",
  waist: "Around your natural waist, just above the navel.",
  hips: "Around the fullest part of your hips and seat.",
  shoulder: "Straight across your back, from one shoulder bone to the other.",
};

const FIT_INFO: Record<FitPreference, { label: string; note: string }> = {
  slim: { label: "Slim", note: "Close to the body" },
  regular: { label: "Regular", note: "Comfortable, true to your body" },
  relaxed: { label: "Relaxed", note: "Extra room to move" },
};

export default function SizeProfileForm() {
  const { ready, profile, saveProfile, clearProfile, notify } = useShop();
  const [unit, setUnit] = useState<Unit>("cm");
  const [fit, setFit] = useState<FitPreference>("regular");
  const [values, setValues] = useState<Partial<Record<Dimension, string>>>({});
  const [errors, setErrors] = useState<Partial<Record<Dimension, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const hydrated = useRef(false);

  // Fill the form once from whatever was saved. Never overwrites what you are typing.
  useEffect(() => {
    if (!ready || hydrated.current) return;
    hydrated.current = true;
    if (!profile) return;
    setUnit(profile.unit);
    setFit(profile.fit);
    setValues(Object.fromEntries(DIMENSIONS.filter((d) => profile[d] !== undefined).map((d) => [d, trim1(fromCm(profile[d] as number, profile.unit))])));
  }, [ready, profile]);

  if (!ready) return <div role="status" aria-label="Loading your measurements" className="space-y-3"><Skeleton className="h-12" /><Skeleton className="h-48" /></div>;

  function switchUnit(next: Unit) {
    if (next === unit) return;
    setValues((v) => convertInputs(v, unit, next));
    setErrors({});
    setUnit(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = buildProfile(values, unit, fit);
    setErrors(result.errors);
    if (!result.valid) {
      setFormError("Please check the highlighted measurements.");
      const first = DIMENSIONS.find((d) => result.errors[d]);
      if (first) document.getElementById(`m-${first}`)?.focus();
      return;
    }
    if (!hasMeasurements(result.profile)) { setFormError("Enter at least one measurement to save your profile."); return; }
    setFormError(null);
    saveProfile(result.profile);
    notify("Measurements saved on this device");
  }

  function clearAll() {
    if (!window.confirm("Delete your saved measurements from this device?")) return;
    clearProfile();
    setValues({}); setErrors({}); setFormError(null); setFit("regular");
    notify("Measurements deleted");
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-8" aria-label="Measurement profile">
      <fieldset>
        <legend className="text-sm font-semibold">Units</legend>
        <div className="mt-2 flex gap-2">
          {(["cm", "in"] as const).map((u) => (<button key={u} type="button" className="chip" aria-pressed={unit === u} onClick={() => switchUnit(u)}>{u === "cm" ? "Centimetres (cm)" : "Inches (in)"}</button>))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        {DIMENSIONS.map((d) => (
          <div key={d}>
            <label htmlFor={`m-${d}`} className="text-sm font-semibold">{DIMENSION_LABEL[d]} <span className="font-normal text-stone">(optional, {unit})</span></label>
            <div className="mt-1 flex items-center rounded-card border border-ink/20 bg-white focus-within:border-peacock">
              <input id={`m-${d}`} inputMode="decimal" autoComplete="off" value={values[d] ?? ""} aria-invalid={Boolean(errors[d])} aria-describedby={`m-${d}-hint${errors[d] ? ` m-${d}-err` : ""}`}
                onChange={(e) => { setValues((v) => ({ ...v, [d]: e.target.value })); setErrors((x) => ({ ...x, [d]: undefined })); setFormError(null); }}
                className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm outline-none" placeholder={unit === "cm" ? "e.g. 98" : "e.g. 38.5"} />
              <span aria-hidden className="pr-3.5 text-sm text-stone">{unit}</span>
            </div>
            <p id={`m-${d}-hint`} className="mt-1 text-xs text-stone">{HINT[d]}</p>
            {errors[d] && <p id={`m-${d}-err`} role="alert" className="mt-1 text-sm font-medium text-[#B3261E]">{errors[d]}</p>}
          </div>
        ))}
      </div>
      <p className="rounded-card bg-mist p-3 text-xs text-ink/80">
        <strong>What&apos;s needed:</strong> chest for tops, jackets, kurtas and dresses; waist for trousers, jeans and skirts. Hips, shoulders and height are optional, but each one makes the suggestion more reliable.
      </p>

      <fieldset>
        <legend className="text-sm font-semibold">How do you like your clothes to fit?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {FITS.map((f) => (
            <button key={f} type="button" aria-pressed={fit === f} onClick={() => setFit(f)}
              className={`rounded-card border p-3 text-left transition-colors ${fit === f ? "border-peacock bg-peacock-light" : "border-ink/20 bg-white hover:border-ink"}`}>
              <span className="block text-sm font-semibold">{FIT_INFO[f].label}</span>
              <span className="block text-xs text-stone">{FIT_INFO[f].note}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {formError && <p role="alert" className="text-sm font-medium text-[#B3261E]">{formError}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary">Save measurements</button>
        {profile && <button type="button" className="btn-outline" onClick={clearAll}>Delete my measurements</button>}
        {profile && <span className="text-sm font-medium text-emerald-800">Saved on this device</span>}
      </div>
      <p className="text-xs text-stone">Your measurements are stored only in this browser (localStorage). They are not sent to any server, and clearing your browser data removes them.</p>
    </form>
  );
}
