"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatINR } from "@/lib/format";
import type { Outfit } from "@/lib/recommend/outfit";
import { hasAnyIntent, parseRequest } from "@/lib/stylist/parse";
import { suggestOutfits } from "@/lib/stylist/suggest";
import OutfitView from "./OutfitView";

export const EXAMPLE_PROMPTS = [
  "I need a classy farewell outfit under ₹2500",
  "Suggest a birthday outfit for my sister",
  "I need a casual college outfit",
  "Show me outfits that match these trousers",
];

type Msg =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "stylist"; text: string; understood?: string[]; outfits?: Outfit[]; notes?: string[]; askGenderFor?: string; showExamples?: boolean; isError?: boolean };

const WELCOME: Msg = {
  id: 0, role: "stylist", showExamples: true,
  text: "Tell me the occasion, your budget and any colours or styles you like, and I'll put together complete outfits from the catalogue.",
};

export function respond(text: string, gender?: "men" | "women"): Omit<Extract<Msg, { role: "stylist" }>, "id" | "role"> {
  const req = parseRequest(text);
  if (gender) req.gender = gender;
  if (!hasAnyIntent(req)) {
    return { text: "I couldn't pick out an occasion, budget, colour or item in that. Try something like the examples below.", showExamples: true };
  }
  if (!req.gender) {
    return { text: "Who is this outfit for?", understood: req.understood, askGenderFor: text };
  }
  const { outfits, overBudget, notes } = suggestOutfits({ ...req, gender: req.gender });
  const extra = [...notes];
  if (req.matchIntent) extra.unshift("I can't see your own clothes from here, so these are built around matching pieces from our catalogue. On any product page, “Complete the look” builds around that exact item.");
  if (outfits.length === 0) {
    return { text: "I couldn't build a complete, well-matched outfit for that. Try a different occasion, loosen the colour, or raise the budget.", understood: req.understood, notes: extra };
  }
  if (overBudget && req.budget) {
    const cheapest = Math.min(...outfits.map((o) => o.total));
    return {
      text: `Nothing complete fits ${formatINR(req.budget.amount)}. The closest I found starts at ${formatINR(cheapest)}, so I've marked how far over each one is.`,
      understood: req.understood, outfits, notes: extra,
    };
  }
  return { text: `Here ${outfits.length === 1 ? "is an outfit" : `are ${outfits.length} outfits`} for you. Each one explains why its pieces were chosen.`, understood: req.understood, outfits, notes: extra };
}

export default function StylistChat() {
  const params = useSearchParams();
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const autoRan = useRef(false);

  const send = useCallback((text: string, gender?: "men" | "women") => {
    const clean = text.trim();
    if (!clean) { setError("Describe the occasion, a budget or an item first."); return; }
    setError(null);
    const userMsg: Msg = { id: nextId.current++, role: "user", text: clean };
    let reply: Msg;
    try {
      reply = { id: nextId.current++, role: "stylist", ...respond(clean, gender) };
    } catch {
      reply = { id: nextId.current++, role: "stylist", isError: true, text: "Something went wrong while building outfits. Please try rephrasing your request." };
    }
    setMessages((m) => [...m, userMsg, reply]);
    setInput("");
  }, []);

  // Deep links: /stylist?prompt=... or ?occasion=&gender=&total= (from the homepage).
  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    const prompt = params.get("prompt");
    const occasion = params.get("occasion");
    const gender = params.get("gender");
    const total = Number(params.get("total"));
    if (prompt) send(prompt.slice(0, 300));
    else if (occasion || total) {
      send(`${occasion ?? ""} outfit${gender === "men" || gender === "women" ? ` for ${gender}` : ""}${total > 0 ? ` under ₹${total}` : ""}`.trim());
    }
  }, [params, send]);

  useEffect(() => { if (messages.length > 1) endRef.current?.scrollIntoView({ block: "nearest" }); }, [messages]);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="rounded-card bg-marigold/25 px-4 py-2 text-sm">
        <strong>Smart-match mode.</strong> Built-in styling rules choose and explain these outfits. No AI language model is connected yet, so very free-form requests may be missed.
      </p>

      <ol className="mt-6 space-y-6" aria-label="Conversation">
        {messages.map((m) => (
          <li key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
            {m.role === "user" ? (
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-peacock px-4 py-2.5 text-white">{m.text}</p>
            ) : (
              <div className="space-y-3">
                <p className={`max-w-prose rounded-2xl rounded-bl-sm px-4 py-2.5 ${m.isError ? "bg-[#B3261E]/10 text-[#8C1D18]" : "bg-white"}`} role={m.isError ? "alert" : undefined}>{m.text}</p>
                {m.understood && m.understood.length > 0 && (
                  <ul className="flex flex-wrap gap-2" aria-label="What I understood">
                    {m.understood.map((u) => (<li key={u} className="rounded-full border border-peacock/40 bg-peacock-light px-3 py-1 text-xs font-medium text-peacock-dark">{u}</li>))}
                  </ul>
                )}
                {m.askGenderFor && (
                  <div className="flex gap-2">
                    {(["women", "men"] as const).map((g) => (<button key={g} type="button" className="chip capitalize bg-white" onClick={() => send(m.askGenderFor as string, g)}>{g}</button>))}
                  </div>
                )}
                {m.showExamples && (
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map((p) => (<button key={p} type="button" className="chip bg-white text-left" onClick={() => send(p)}>{p}</button>))}
                  </div>
                )}
                {m.outfits?.map((o, idx) => (<OutfitView key={o.anchor.id} outfit={o} anchorLabel="Base piece" heading={`Outfit ${idx + 1}: built around the ${o.anchor.name}`} />))}
                {m.notes && m.notes.length > 0 && <ul className="max-w-prose space-y-1 text-sm text-stone">{m.notes.map((n) => (<li key={n}>{n}</li>))}</ul>}
              </div>
            )}
          </li>
        ))}
        <div ref={endRef} />
      </ol>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="sticky bottom-16 mt-8 rounded-2xl border border-ink/15 bg-white p-3 shadow-sm md:bottom-4">
        <label htmlFor="stylist-input" className="sr-only">Describe the outfit you need</label>
        <div className="flex gap-2">
          <input id="stylist-input" value={input} onChange={(e) => { setInput(e.target.value); setError(null); }} maxLength={300} aria-describedby={error ? "stylist-error" : undefined}
            placeholder="e.g. a classy farewell outfit under ₹2500" className="min-w-0 flex-1 rounded-full bg-chalk px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-peacock" />
          <button type="submit" className="btn-primary">Ask</button>
        </div>
        {error && <p id="stylist-error" role="alert" className="mt-2 px-2 text-sm text-[#B3261E]">{error}</p>}
      </form>
      {messages.length > 1 && (
        <p className="mt-3 text-center text-sm"><button type="button" className="underline underline-offset-4 text-stone hover:text-ink" onClick={() => setMessages([WELCOME])}>Start over</button>
          {" "}or <Link href="/shop" className="underline underline-offset-4 text-stone hover:text-ink">browse the shop</Link></p>
      )}
    </div>
  );
}
