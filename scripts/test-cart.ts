import { addLine, cartTotals, MAX_QTY, parseCart, parseWishlist, removeLine, setQty, toggleId, validateAdd } from "../src/lib/store/cart";
import { productById } from "../src/data/products";

let failures = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failures++; };

const tee = productById("loom-tee-white")!;         // sizes S..XXL, in stock
const soldOut = productById("loom-tee-olive")!;      // sold out
const watch = productById("tidewater-steel-dress")!; // One Size

// add
let cart = addLine([], tee.id, "M");
check(cart.length === 1 && cart[0].qty === 1, "add creates a line with qty 1");
cart = addLine(cart, tee.id, "M");
check(cart.length === 1 && cart[0].qty === 2, "adding same product+size merges into qty 2");
cart = addLine(cart, tee.id, "L");
check(cart.length === 2, "different size is a separate line");
check(addLine(cart, tee.id, "XS") === cart, "size not offered for the product is rejected");
check(addLine(cart, soldOut.id, "M") === cart, "sold-out product is rejected");
check(addLine(cart, "nope", "M") === cart, "unknown product is rejected");
check(validateAdd(tee.id, null) !== null, "missing size is reported");
check(validateAdd(watch.id, "One Size") === null, "free-size item validates");

// qty
cart = setQty(cart, tee.id, "M", 5);
check(cart.find((l) => l.size === "M")!.qty === 5, "setQty updates quantity");
cart = setQty(cart, tee.id, "M", 999);
check(cart.find((l) => l.size === "M")!.qty === MAX_QTY, `quantity is capped at ${MAX_QTY}`);
const before = cart.length;
cart = setQty(cart, tee.id, "L", 0);
check(cart.length === before - 1, "setting quantity to 0 removes the line");
cart = setQty(cart, tee.id, "M", NaN);
check(cart.length === before - 2, "NaN quantity removes the line instead of corrupting it");

// totals
let c2 = addLine([], tee.id, "M", 2);
c2 = addLine(c2, watch.id, "One Size");
const t = cartTotals(c2);
check(t.count === 3, "total item count is 3");
check(t.subtotal === tee.price * 2 + watch.price, `subtotal is ${t.subtotal}`);
check(t.mrpTotal - t.subtotal === t.savings && t.savings > 0, "savings = MRP total - subtotal");
check(removeLine(c2, watch.id, "One Size").length === 1, "remove deletes only that line");
check(cartTotals([]).subtotal === 0, "empty cart totals zero");

// persistence parsing (simulates corrupted/tampered localStorage)
check(parseCart(null).length === 0, "null storage -> empty cart");
check(parseCart("{not json").length === 0, "invalid JSON -> empty cart, no throw");
check(parseCart('{"a":1}').length === 0, "non-array JSON -> empty cart");
const messy = JSON.stringify([
  { productId: tee.id, size: "M", qty: 2 },
  { productId: tee.id, size: "M", qty: 1 },         // duplicate -> merged
  { productId: "ghost", size: "M", qty: 1 },         // unknown product
  { productId: tee.id, size: "ZZ", qty: 1 },         // bad size
  { productId: tee.id, size: "L", qty: 9999 },       // clamped
  { productId: tee.id, size: "S", qty: -3 },         // invalid qty
  { productId: 5, size: "S", qty: 1 }, null, "x",   // junk
]);
const parsed = parseCart(messy);
check(parsed.length === 2, "messy storage keeps only the 2 valid lines");
check(parsed.find((l) => l.size === "M")?.qty === 3, "duplicate lines merged on load");
check(parsed.find((l) => l.size === "L")?.qty === MAX_QTY, "huge stored quantity is clamped on load");
const roundTrip = parseCart(JSON.stringify(c2));
check(JSON.stringify(roundTrip) === JSON.stringify(c2), "cart survives a JSON round trip unchanged");

// wishlist
check(parseWishlist('["loom-tee-white","loom-tee-white","ghost",7]').join() === "loom-tee-white", "wishlist dedupes and drops unknown ids");
check(parseWishlist("garbage").length === 0, "bad wishlist JSON -> empty");
let w = toggleId([], "a"); check(w.join() === "a", "toggle adds");
w = toggleId(w, "a"); check(w.length === 0, "toggle removes");

console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll cart/wishlist checks passed");
process.exit(failures ? 1 : 0);
