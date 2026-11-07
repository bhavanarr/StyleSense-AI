import type { ColorOption } from "@/types";

/** One shared palette keeps colour names consistent across the catalogue and the colour engine. */
export const C = {
  navy: { name: "Navy", hex: "#1F2A44" },
  white: { name: "White", hex: "#F4F4F2" },
  black: { name: "Black", hex: "#1B1B1D" },
  olive: { name: "Olive", hex: "#5B6236" },
  beige: { name: "Beige", hex: "#D8C7A8" },
  mustard: { name: "Mustard", hex: "#D9A441" },
  maroon: { name: "Maroon", hex: "#6E1F2E" },
  sky: { name: "Sky Blue", hex: "#9CC3DD" },
  grey: { name: "Grey", hex: "#8A8D91" },
  charcoal: { name: "Charcoal", hex: "#3A3D42" },
  tan: { name: "Tan", hex: "#A9743F" },
  emerald: { name: "Emerald", hex: "#1E6B52" },
  blush: { name: "Blush", hex: "#E8B9B5" },
  lavender: { name: "Lavender", hex: "#B7A6D6" },
  denim: { name: "Mid Denim", hex: "#3F5F8A" },
  indigo: { name: "Dark Indigo", hex: "#232F55" },
  cream: { name: "Cream", hex: "#EFE6D2" },
  rust: { name: "Rust", hex: "#A5502D" },
  teal: { name: "Teal", hex: "#1F6F73" },
  steel: { name: "Steel", hex: "#B9BDC4" },
  gold: { name: "Gold", hex: "#C9A24A" },
} satisfies Record<string, ColorOption>;
