import type { Metadata } from "next";
import SizeComparison from "@/components/SizeComparison";
import SizeProfileForm from "@/components/SizeProfileForm";

export const metadata: Metadata = { title: "Size profile" };

export default function SizeProfilePage() {
  return (
    <div className="container-page py-8">
      <h1 className="font-display text-4xl font-semibold">Your size profile</h1>
      <p className="mt-1 max-w-2xl text-stone">Enter your measurements once and every product page will suggest a size from that brand&apos;s own chart, with the reasoning shown.</p>
      <div className="mt-8 max-w-3xl"><SizeProfileForm /></div>
      <SizeComparison />
      <details className="mt-14 max-w-3xl text-sm">
        <summary className="cursor-pointer font-semibold underline-offset-4 hover:underline">How size suggestions work, and their limits</summary>
        <div className="mt-3 space-y-2 text-ink/85">
          <p>Each size chart lists the body measurements a size is designed for. We compare each of your measurements with every size, shifting for the gap between the fit you want and how the garment is cut, and pick the size that fits best across the measurements that matter most for that garment.</p>
          <p>A confidence level tells you how much to trust the result. It is lowered when we have few measurements, when two sizes are close, when your measurements point to different sizes, or when you fall outside the chart.</p>
          <p><strong>The charts here are illustrative.</strong> Every brand in this catalogue is fictional and its chart was invented to demonstrate the method. Real brands publish their own charts, and fabric, cut and personal taste all affect fit, so a suggestion is guidance, not a guarantee.</p>
        </div>
      </details>
    </div>
  );
}
