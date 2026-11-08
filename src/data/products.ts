import type { Category, ColorOption, Gender, Occasion, OutfitGroup, Product, SizeSystem, StyleTag } from "@/types";
import { C } from "./colors";
import { productPhotos } from "./productPhotos";

/**
 * Seed catalogue. Every item is a DEMO product from a fictional brand:
 * there are no real purchase URLs (merchantUrl is null until a verified link is added).
 * A compact row format keeps ~50 items readable; `build()` expands each row into a full Product.
 */
type Row = [
  id: string, name: string, brandId: string, gender: Gender, category: Category,
  color: ColorOption, price: number, mrp: number,
  occasions: Occasion[], styles: StyleTag[], material: string,
];

const GROUP: Record<Category, OutfitGroup> = {
  tshirt: "top", shirt: "top", kurta: "top", top: "top", dress: "dress",
  jeans: "bottom", trousers: "bottom", skirt: "bottom", jacket: "outerwear",
  shoes: "footwear", watch: "accessory", bag: "accessory", accessory: "accessory",
};

const LABEL: Record<Category, string> = {
  tshirt: "T-shirt", shirt: "shirt", kurta: "kurta", top: "top", dress: "dress", jeans: "jeans",
  trousers: "trousers", skirt: "skirt", jacket: "jacket", shoes: "footwear", watch: "watch",
  bag: "bag", accessory: "accessory",
};

const range = (a: number, b: number, step = 1) =>
  Array.from({ length: Math.floor((b - a) / step) + 1 }, (_, i) => String(a + i * step));

function sizingFor(cat: Category, gender: Gender): { sizeSystem: SizeSystem; sizes: string[] } {
  if (cat === "watch" || cat === "bag" || cat === "accessory") return { sizeSystem: "free", sizes: ["One Size"] };
  if (cat === "shoes") return { sizeSystem: "uk-shoe", sizes: gender === "women" ? range(3, 8) : range(6, 11) };
  if (cat === "jeans" || cat === "trousers")
    return { sizeSystem: "waist", sizes: gender === "women" ? range(26, 34, 2) : range(28, 38, 2) };
  return { sizeSystem: "alpha", sizes: gender === "women" ? ["XS", "S", "M", "L", "XL"] : ["S", "M", "L", "XL", "XXL"] };
}

// Items the demo marks as sold out, so availability handling can be exercised later.
const SOLD_OUT = new Set(["loom-tee-olive", "vela-top-white", "meridian-heels-blush"]);

function build(r: Row): Product {
  const [id, name, brandId, gender, category, color, price, mrp, occasions, styles, material] = r;
  return {
    id, name, brandId, gender, category, group: GROUP[category], price, mrp, color,
    occasions, styles, material, ...sizingFor(category, gender),
    description: `${name} in ${color.name}, made from ${material}. A good pick for ${occasions.slice(0, 2).join(" and ")} outfits.`,
    inStock: !SOLD_OUT.has(id), isDemo: true, merchantUrl: null,
    ...(productPhotos[id]?.length ? { images: productPhotos[id] } : {}),
  };
}

const rows: Row[] = [
  // Kasa & Co: menswear classics
  ["kasa-oxford-white", "Oxford Button-Down Shirt", "kasa", "men", "shirt", C.white, 1799, 2999, ["office", "farewell", "date"], ["classic", "smart-casual"], "cotton oxford"],
  ["kasa-linen-sky", "Relaxed Linen Shirt", "kasa", "men", "shirt", C.sky, 1999, 3299, ["casual", "birthday", "date"], ["minimal", "smart-casual"], "linen blend"],
  ["kasa-chino-beige", "Slim Tapered Chinos", "kasa", "men", "trousers", C.beige, 1899, 2999, ["office", "farewell", "casual"], ["classic", "smart-casual"], "stretch cotton twill"],
  ["kasa-trouser-charcoal", "Pleated Formal Trousers", "kasa", "men", "trousers", C.charcoal, 2299, 3799, ["office", "farewell", "wedding"], ["formal", "classic"], "wool blend"],
  ["kasa-blazer-navy", "Unstructured Blazer", "kasa", "men", "jacket", C.navy, 4499, 7499, ["office", "farewell", "wedding", "party"], ["formal", "classic"], "cotton-wool blend"],
  // Loom Theory: everyday casual
  ["loom-tee-white", "Heavyweight Crew Tee", "loom", "men", "tshirt", C.white, 699, 999, ["casual", "college"], ["minimal", "streetwear"], "combed cotton"],
  ["loom-tee-black", "Heavyweight Crew Tee", "loom", "men", "tshirt", C.black, 699, 999, ["casual", "college", "party"], ["minimal", "streetwear"], "combed cotton"],
  ["loom-tee-olive", "Washed Pocket Tee", "loom", "men", "tshirt", C.olive, 799, 1199, ["casual", "college"], ["streetwear"], "garment-washed cotton"],
  ["loom-jeans-denim", "Straight Fit Jeans", "loom", "men", "jeans", C.denim, 1799, 2799, ["casual", "college", "birthday"], ["classic", "streetwear"], "rigid denim"],
  ["loom-jeans-black", "Slim Fit Jeans", "loom", "men", "jeans", C.black, 1899, 2999, ["casual", "party", "date"], ["streetwear", "minimal"], "stretch denim"],
  ["loom-hoodie-grey", "Zip-Up Hoodie", "loom", "men", "jacket", C.grey, 1599, 2499, ["casual", "college"], ["streetwear", "sporty"], "brushed fleece"],
  ["loom-tee-lavender", "Boxy Cotton Tee", "loom", "women", "tshirt", C.lavender, 749, 1199, ["casual", "college"], ["minimal", "streetwear"], "combed cotton"],
  ["loom-jeans-indigo", "Straight Leg Jeans", "loom", "women", "jeans", C.indigo, 1799, 2799, ["casual", "college", "birthday"], ["classic", "minimal"], "rigid denim"],
  // Budget-friendly basics, so smaller budgets still produce complete outfits
  ["loom-poplin-sky", "Everyday Poplin Shirt", "loom", "men", "shirt", C.sky, 799, 1399, ["office", "farewell", "date", "birthday", "casual"], ["classic", "smart-casual"], "cotton poplin"],
  ["loom-chino-navy", "Everyday Chinos", "loom", "men", "trousers", C.navy, 899, 1499, ["office", "farewell", "casual", "college", "birthday"], ["classic", "smart-casual"], "cotton twill"],
  // Aranya: ethnic
  ["aranya-kurta-cream", "Textured Straight Kurta", "aranya", "men", "kurta", C.cream, 2199, 3499, ["festive", "wedding", "farewell", "birthday"], ["ethnic", "classic"], "cotton with tonal weave"],
  ["aranya-kurta-navy", "Cotton Silk Kurta", "aranya", "men", "kurta", C.navy, 2499, 3999, ["festive", "wedding", "farewell"], ["ethnic", "formal"], "cotton silk"],
  ["aranya-anarkali-mustard", "Block Print Anarkali Kurta", "aranya", "women", "kurta", C.mustard, 2599, 4199, ["festive", "wedding", "birthday"], ["ethnic", "boho"], "block-printed cotton"],
  ["aranya-kurta-emerald", "Straight Kurta with Pintucks", "aranya", "women", "kurta", C.emerald, 1999, 3299, ["office", "festive", "farewell"], ["ethnic", "classic"], "viscose crepe"],
  ["aranya-churidar-cream", "Cotton Churidar Pyjama", "aranya", "men", "trousers", C.cream, 1299, 1999, ["festive", "wedding", "farewell"], ["ethnic", "classic"], "cotton"],
  ["aranya-palazzo-black", "Straight Palazzo Pants", "aranya", "women", "trousers", C.black, 1499, 2399, ["festive", "office", "farewell", "birthday"], ["ethnic", "minimal"], "viscose crepe"],
  // Northline: sport
  ["northline-windbreaker-black", "Packable Windbreaker", "northline", "men", "jacket", C.black, 2799, 4499, ["casual", "college"], ["sporty", "streetwear"], "recycled ripstop nylon"],
  ["northline-tee-grey", "Dry-Fit Training Tee", "northline", "unisex", "tshirt", C.grey, 799, 1299, ["casual", "college"], ["sporty"], "moisture-wicking polyester"],
  ["northline-joggers-charcoal", "Tapered Joggers", "northline", "men", "trousers", C.charcoal, 1599, 2499, ["casual", "college"], ["sporty", "streetwear"], "French terry"],
  // Meridian: footwear
  ["meridian-sneaker-white", "Court Leather Sneakers", "meridian", "unisex", "shoes", C.white, 3299, 4999, ["casual", "college", "date", "birthday"], ["minimal", "classic", "smart-casual"], "full-grain leather"],
  ["meridian-derby-tan", "Leather Derby Shoes", "meridian", "men", "shoes", C.tan, 3999, 6499, ["office", "farewell", "wedding"], ["formal", "classic"], "calf leather"],
  ["meridian-loafer-black", "Penny Loafers", "meridian", "men", "shoes", C.black, 3499, 5499, ["office", "farewell", "party"], ["formal", "smart-casual"], "polished leather"],
  ["meridian-runner-navy", "Everyday Running Shoes", "meridian", "unisex", "shoes", C.navy, 2999, 4999, ["casual", "college"], ["sporty"], "engineered mesh"],
  ["meridian-heels-blush", "Block Heel Sandals", "meridian", "women", "shoes", C.blush, 2499, 3999, ["party", "wedding", "farewell", "birthday"], ["classic"], "faux suede"],
  ["meridian-slingback-black", "Pointed Slingback Heels", "meridian", "women", "shoes", C.black, 2699, 4299, ["party", "wedding", "farewell", "date", "birthday"], ["classic", "minimal"], "faux leather"],
  ["meridian-flats-black", "Pointed Ballet Flats", "meridian", "women", "shoes", C.black, 1999, 3199, ["office", "college", "farewell"], ["classic", "minimal"], "vegan leather"],
  ["meridian-jutti-gold", "Embroidered Juttis", "meridian", "women", "shoes", C.gold, 1799, 2899, ["festive", "wedding"], ["ethnic"], "embroidered fabric"],
  ["meridian-mojari-tan", "Leather Mojari Juttis", "meridian", "men", "shoes", C.tan, 2299, 3699, ["festive", "wedding", "farewell"], ["ethnic", "classic"], "hand-finished leather"],
  ["meridian-canvas-white", "Canvas Low-Tops", "meridian", "unisex", "shoes", C.white, 799, 1299, ["casual", "college", "birthday", "date", "farewell"], ["minimal", "smart-casual", "streetwear"], "cotton canvas"],
  ["meridian-sandal-tan", "Strappy Flat Sandals", "meridian", "women", "shoes", C.tan, 699, 1199, ["casual", "college", "birthday", "date", "farewell"], ["minimal", "classic"], "faux leather"],
  // Tidewater: watches
  ["tidewater-steel-dress", "Slim Steel Dress Watch", "tidewater", "unisex", "watch", C.steel, 4999, 7999, ["office", "farewell", "wedding", "party"], ["classic", "formal", "minimal"], "stainless steel"],
  ["tidewater-field-tan", "Field Watch, Leather Strap", "tidewater", "unisex", "watch", C.tan, 3999, 6499, ["casual", "college", "date"], ["classic", "smart-casual"], "steel case, leather strap"],
  ["tidewater-petite-gold", "Petite Gold Bracelet Watch", "tidewater", "women", "watch", C.gold, 4499, 6999, ["party", "wedding", "farewell", "birthday", "date"], ["minimal", "classic"], "gold-tone steel"],
  // Okra & Oak: bags and accessories
  ["okra-backpack-charcoal", "Everyday Canvas Backpack", "okra", "unisex", "bag", C.charcoal, 1999, 3299, ["college", "casual"], ["streetwear", "minimal"], "waxed canvas"],
  ["okra-messenger-tan", "Leather Messenger Bag", "okra", "men", "bag", C.tan, 4299, 6999, ["office", "farewell"], ["classic", "formal"], "vegetable-tanned leather"],
  ["okra-tote-cream", "Structured Canvas Tote", "okra", "women", "bag", C.cream, 1799, 2799, ["office", "college", "casual"], ["minimal"], "heavy canvas"],
  ["okra-clutch-gold", "Beaded Evening Clutch", "okra", "women", "bag", C.gold, 1999, 3299, ["party", "wedding", "farewell", "birthday", "festive"], ["classic"], "beaded satin"],
  ["okra-belt-tan", "Reversible Leather Belt", "okra", "men", "accessory", C.tan, 999, 1699, ["office", "farewell", "casual"], ["classic", "formal"], "genuine leather"],
  ["okra-sunglasses-black", "Acetate Wayfarer Sunglasses", "okra", "unisex", "accessory", C.black, 1499, 2499, ["casual", "college", "date"], ["classic", "streetwear"], "acetate"],
  ["okra-scarf-maroon", "Printed Silk-Blend Scarf", "okra", "women", "accessory", C.maroon, 1199, 1999, ["office", "festive", "birthday"], ["boho", "classic"], "silk blend"],
  // Vela: women's contemporary
  ["vela-wrap-emerald", "Satin Wrap Dress", "vela", "women", "dress", C.emerald, 3299, 5499, ["party", "farewell", "birthday", "date"], ["classic", "minimal"], "satin"],
  ["vela-slip-black", "Bias-Cut Slip Dress", "vela", "women", "dress", C.black, 2799, 4499, ["party", "date", "birthday"], ["minimal"], "satin crepe"],
  ["vela-floral-lavender", "Floral Midi Dress", "vela", "women", "dress", C.lavender, 2499, 3999, ["birthday", "casual", "date", "farewell"], ["boho"], "viscose"],
  ["vela-shirtdress-sky", "Poplin Shirt Dress", "vela", "women", "dress", C.sky, 2299, 3699, ["office", "college", "casual"], ["classic", "smart-casual"], "cotton poplin"],
  ["vela-blouse-blush", "Ruffle Neck Blouse", "vela", "women", "top", C.blush, 1499, 2399, ["office", "farewell", "date"], ["classic"], "georgette"],
  ["vela-tank-white", "Ribbed Knit Tank", "vela", "women", "top", C.white, 799, 1299, ["casual", "college"], ["minimal"], "ribbed cotton"],
  ["vela-trousers-navy", "High-Rise Pleated Trousers", "vela", "women", "trousers", C.navy, 2199, 3599, ["office", "farewell"], ["formal", "classic"], "crepe suiting"],
  ["vela-widejeans-denim", "Wide Leg Jeans", "vela", "women", "jeans", C.denim, 2199, 3499, ["casual", "college", "birthday"], ["streetwear"], "rigid denim"],
  ["vela-skirt-olive", "Satin Midi Skirt", "vela", "women", "skirt", C.olive, 1899, 2999, ["party", "farewell", "date", "birthday"], ["classic", "minimal"], "satin"],
  ["vela-blazer-cream", "Relaxed Linen Blazer", "vela", "women", "jacket", C.cream, 3499, 5799, ["office", "farewell", "wedding"], ["classic", "smart-casual"], "linen blend"],
];

const budgetWomen: Row[] = [
  ["vela-puff-cream", "Puff-Sleeve Cotton Top", "vela", "women", "top", C.cream, 699, 1199, ["farewell", "birthday", "date", "casual", "college", "office"], ["classic", "minimal"], "cotton"],
  ["vela-cottonpants-black", "Straight Cotton Pants", "vela", "women", "trousers", C.black, 999, 1699, ["office", "farewell", "college", "casual", "birthday"], ["classic", "minimal"], "cotton blend"],
  ["aranya-printed-rust", "Printed Cotton Kurta", "aranya", "women", "kurta", C.rust, 1099, 1799, ["casual", "college", "festive", "farewell", "birthday"], ["ethnic", "boho"], "printed cotton"],
];
rows.push(...budgetWomen);

export const products: Product[] = rows.map(build);

export const productById = (id: string): Product | undefined => products.find((p) => p.id === id);
export const categoryLabel = (c: Category): string => LABEL[c];
