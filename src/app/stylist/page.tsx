import { Suspense } from "react";
import type { Metadata } from "next";
import StylistChat from "@/components/StylistChat";
import { Skeleton } from "@/components/Skeleton";

export const metadata: Metadata = { title: "AI Stylist" };

export default function StylistPage() {
  return (
    <div className="container-page py-8">
      <h1 className="font-display text-4xl font-semibold">AI Stylist</h1>
      <p className="mt-1 mb-6 max-w-xl text-stone">Describe where you&apos;re going and what you want to spend.</p>
      <Suspense fallback={<div role="status" aria-label="Loading stylist" className="mx-auto max-w-4xl space-y-3"><Skeleton className="h-10" /><Skeleton className="h-24 w-2/3" /></div>}>
        <StylistChat />
      </Suspense>
    </div>
  );
}
