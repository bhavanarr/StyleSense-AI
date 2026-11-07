export type Gender = "men" | "women" | "unisex";

export type Category =
  | "tshirt" | "shirt" | "kurta" | "dress" | "top"
  | "jeans" | "trousers" | "skirt" | "jacket"
  | "shoes" | "watch" | "bag" | "accessory";

/** Coarse group used by the complete-the-look engine (Day 2). */
export type OutfitGroup = "top" | "bottom" | "dress" | "outerwear" | "footwear" | "accessory";

export type Occasion =
  | "casual" | "college" | "office" | "party" | "wedding"
  | "farewell" | "birthday" | "date" | "festive";

export type StyleTag =
  | "classic" | "minimal" | "streetwear" | "ethnic" | "sporty" | "formal" | "boho" | "smart-casual";

export type SizeSystem = "alpha" | "waist" | "uk-shoe" | "free";

export interface Brand {
  id: string;
  name: string;
  tagline: string;
  /** Fictional demo brands: no real trademarks are used. */
  isDemo: true;
}

export interface ColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  brandId: string;
  gender: Gender;
  category: Category;
  group: OutfitGroup;
  price: number; // INR
  mrp: number; // INR, for strike-through
  color: ColorOption;
  occasions: Occasion[];
  styles: StyleTag[];
  sizeSystem: SizeSystem;
  sizes: string[];
  material: string;
  description: string;
  inStock: boolean;
  /** Always true in the seed catalogue. */
  isDemo: true;
  /** Only set when a real, verified merchant link exists. Never invented. */
  merchantUrl: string | null;
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "discount";

export interface CatalogueQuery {
  gender?: Gender | "all";
  category?: Category;
  brandId?: string;
  occasion?: Occasion;
  maxPrice?: number;
  q?: string;
  sort?: SortKey;
}
