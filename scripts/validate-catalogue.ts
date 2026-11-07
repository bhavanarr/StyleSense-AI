import { brands } from "../src/data/brands";
import { products } from "../src/data/products";
import { queryProducts, OCCASIONS } from "../src/lib/catalogue";

let failures = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
  if (!ok) failures++;
};

const ids = products.map((p) => p.id);
check(new Set(ids).size === ids.length, `all ${ids.length} product ids are unique`);
check(products.every((p) => brands.some((b) => b.id === p.brandId)), "every product references a real brand");
check(brands.every((b) => products.some((p) => p.brandId === b.id)), "every brand has at least one product");
check(products.every((p) => p.price > 0 && p.mrp > p.price), "price > 0 and MRP > price for every product");
check(products.every((p) => p.sizes.length > 0), "every product has sizes");
check(products.every((p) => p.merchantUrl === null && p.isDemo), "no invented merchant URLs; all flagged demo");
check(products.every((p) => /^#[0-9A-Fa-f]{6}$/.test(p.color.hex)), "colour hex values are valid");
check(products.some((p) => !p.inStock), "demo includes sold-out items");

// Outfit coverage: each occasion needs a top-or-dress AND footwear for both men and women,
// otherwise complete-the-look would have nothing sensible to recommend.
for (const g of ["men", "women"] as const) {
  for (const o of OCCASIONS) {
    const pool = queryProducts({ gender: g, occasion: o });
    const hasBase = pool.some((p) => p.group === "top" || p.group === "dress");
    const hasShoes = pool.some((p) => p.group === "footwear");
    check(hasBase && hasShoes, `${g} / ${o}: has a top-or-dress and footwear (${pool.length} items)`);
  }
}

check(queryProducts({ q: "linen" }).length >= 2, "search 'linen' finds products");
check(queryProducts({ maxPrice: 1000 }).every((p) => p.price <= 1000), "max-price filter respected");
const strict = queryProducts({ sort: "price-asc" }).map((p) => p.price);
check(strict.every((v, i) => i === 0 || v >= strict[i - 1]), "price-asc is correctly ordered");
check(queryProducts({ gender: "men" }).every((p) => p.gender !== "women"), "men filter excludes women's items");

console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
