import type { Brand } from "@/types";

export const brands: Brand[] = [
  { id: "kasa", name: "Kasa & Co", tagline: "Tailored essentials for work and weekends", isDemo: true },
  { id: "loom", name: "Loom Theory", tagline: "Everyday cotton, cut for campus life", isDemo: true },
  { id: "aranya", name: "Aranya", tagline: "Contemporary Indian ethnic wear", isDemo: true },
  { id: "northline", name: "Northline", tagline: "Performance layers and sport style", isDemo: true },
  { id: "meridian", name: "Meridian", tagline: "Footwear built for long days", isDemo: true },
  { id: "tidewater", name: "Tidewater", tagline: "Watches with a quiet confidence", isDemo: true },
  { id: "okra", name: "Okra & Oak", tagline: "Bags and accessories in honest materials", isDemo: true },
  { id: "vela", name: "Vela", tagline: "Women's contemporary: easy, elegant, dressed up or down", isDemo: true },
];

export const brandById = (id: string): Brand | undefined => brands.find((b) => b.id === id);
