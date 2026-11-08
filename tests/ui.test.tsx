import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShopProvider from "@/lib/store/ShopProvider";
import ProductActions from "@/components/ProductActions";
import CartView from "@/components/CartView";
import WishlistView from "@/components/WishlistView";
import ProductCard from "@/components/ProductCard";
import CompleteTheLook from "@/components/CompleteTheLook";
import StylistChat from "@/components/StylistChat";
import { productById } from "@/data/products";

const tee = productById("loom-tee-white")!;
const watch = productById("tidewater-steel-dress")!;
const soldOut = productById("loom-tee-olive")!;
const cartInStorage = () => JSON.parse(localStorage.getItem("stylesense.cart.v1") ?? "[]");
const wishInStorage = () => JSON.parse(localStorage.getItem("stylesense.wishlist.v1") ?? "[]");
const app = (ui: React.ReactNode) => render(<ShopProvider>{ui}</ShopProvider>);

describe("product detail: size, quantity, add to cart", () => {
  it("refuses to add without a size and says why", async () => {
    const u = userEvent.setup();
    app(<ProductActions product={tee} />);
    await u.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a size first.");
    expect(cartInStorage()).toEqual([]);
  });

  it("adds the chosen size and quantity, and persists to localStorage", async () => {
    const u = userEvent.setup();
    app(<ProductActions product={tee} />);
    await u.click(screen.getByRole("button", { name: "M" }));
    expect(screen.getByRole("button", { name: "M" })).toHaveAttribute("aria-pressed", "true");
    await u.click(screen.getByRole("button", { name: "Increase quantity" }));
    await u.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(cartInStorage()).toEqual([{ productId: tee.id, size: "M", qty: 2 }]);
    expect(screen.getByRole("button", { name: /Added to cart/ })).toBeInTheDocument();
    expect(screen.getAllByRole("status").some((n) => /Added 2 × Heavyweight Crew Tee, size M/.test(n.textContent ?? ""))).toBe(true);
  });

  it("quantity stepper stays within 1..10", async () => {
    const u = userEvent.setup();
    app(<ProductActions product={tee} />);
    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
    for (let i = 0; i < 12; i++) if (!(screen.getByRole("button", { name: "Increase quantity" }) as HTMLButtonElement).disabled) await u.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
    expect(screen.getByRole("group", { name: /Quantity/i }).querySelector("output")).toHaveTextContent("10");
  });

  it("free-size items need no size selection", async () => {
    const u = userEvent.setup();
    app(<ProductActions product={watch} />);
    expect(screen.queryByText(/Select size/)).not.toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(cartInStorage()).toEqual([{ productId: watch.id, size: "One Size", qty: 1 }]);
  });

  it("sold-out items cannot be added", () => {
    app(<ProductActions product={soldOut} />);
    expect(screen.getByRole("button", { name: "Sold out" })).toBeDisabled();
  });

  it("wishlist button on the detail page toggles and persists", async () => {
    const u = userEvent.setup();
    app(<ProductActions product={tee} />);
    await u.click(screen.getByRole("button", { name: "Save to wishlist" }));
    expect(wishInStorage()).toEqual([tee.id]);
    await u.click(screen.getByRole("button", { name: /Saved/ }));
    expect(wishInStorage()).toEqual([]);
  });
});

describe("cart page", () => {
  const seed = () => localStorage.setItem("stylesense.cart.v1", JSON.stringify([{ productId: tee.id, size: "M", qty: 2 }, { productId: watch.id, size: "One Size", qty: 1 }]));

  it("restores a saved cart after a 'reload' and shows correct totals", async () => {
    seed();
    app(<CartView />);
    expect(await screen.findByText("Heavyweight Crew Tee")).toBeInTheDocument();
    expect(screen.getByText("Slim Steel Dress Watch")).toBeInTheDocument();
    const total = tee.price * 2 + watch.price; // 699*2 + 4999
    const summary = screen.getByRole("complementary", { name: "Order summary" });
    expect(within(summary).getByText(/Items \(3\)/)).toBeInTheDocument();
    expect(within(summary).getByText(new RegExp(total.toLocaleString("en-IN")))).toBeInTheDocument();
  });

  it("updates quantity, removes a line, and persists each change", async () => {
    seed();
    const u = userEvent.setup();
    app(<CartView />);
    const teeRow = (await screen.findByText("Heavyweight Crew Tee")).closest("li")!;
    await u.click(within(teeRow).getByRole("button", { name: "Increase quantity" }));
    expect(cartInStorage().find((l: { size: string }) => l.size === "M").qty).toBe(3);
    await u.click(within(teeRow).getByRole("button", { name: "Decrease quantity" }));
    await u.click(within(teeRow).getByRole("button", { name: "Decrease quantity" }));
    await u.click(within(teeRow).getByRole("button", { name: "Decrease quantity" })); // 1 -> removes
    expect(screen.queryByText("Heavyweight Crew Tee")).not.toBeInTheDocument();
    expect(cartInStorage()).toHaveLength(1);
    await u.click(screen.getByRole("button", { name: "Remove" }));
    expect(await screen.findByText("Your cart is empty")).toBeInTheDocument();
    expect(cartInStorage()).toEqual([]);
  });

  it("'Save for later' moves an item to the wishlist", async () => {
    seed();
    const u = userEvent.setup();
    app(<CartView />);
    const row = (await screen.findByText("Slim Steel Dress Watch")).closest("li")!;
    await u.click(within(row).getByRole("button", { name: "Save for later" }));
    expect(wishInStorage()).toEqual([watch.id]);
    expect(cartInStorage().some((l: { productId: string }) => l.productId === watch.id)).toBe(false);
  });

  it("clear cart asks for confirmation first", async () => {
    seed();
    const u = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    app(<CartView />);
    await screen.findByText("Heavyweight Crew Tee");
    await u.click(screen.getByRole("button", { name: "Clear cart" }));
    expect(cartInStorage()).toHaveLength(2); // cancelled
    await u.click(screen.getByRole("button", { name: "Clear cart" }));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("Your cart is empty")).toBeInTheDocument();
  });

  it("survives corrupted localStorage without crashing", async () => {
    localStorage.setItem("stylesense.cart.v1", "{not json");
    localStorage.setItem("stylesense.wishlist.v1", "42");
    app(<CartView />);
    expect(await screen.findByText("Your cart is empty")).toBeInTheDocument();
  });

  it("warns when the browser blocks storage", async () => {
    const u = userEvent.setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    app(<><ProductActions product={watch} /><CartView /></>);
    await u.click(await screen.findByRole("button", { name: "Add to cart" }));
    expect(await screen.findByText(/browser is blocking storage/i)).toBeInTheDocument();
  });
});

describe("wishlist", () => {
  it("heart on a product card saves it and the wishlist page lists it after a reload", async () => {
    const u = userEvent.setup();
    const first = render(<ShopProvider><ProductCard product={tee} /></ShopProvider>);
    await u.click(screen.getByRole("button", { name: /Save Heavyweight Crew Tee to wishlist/ }));
    expect(wishInStorage()).toEqual([tee.id]);
    first.unmount();
    app(<WishlistView />);
    expect(await screen.findByText("Heavyweight Crew Tee")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Remove Heavyweight Crew Tee from wishlist/ }));
    expect(await screen.findByText("Nothing saved yet")).toBeInTheDocument();
  });

  it("free-size wishlist items can be added to cart directly; sized ones link to choose a size", async () => {
    localStorage.setItem("stylesense.wishlist.v1", JSON.stringify([watch.id, tee.id]));
    const u = userEvent.setup();
    app(<WishlistView />);
    await screen.findByText("Slim Steel Dress Watch");
    expect(screen.getByRole("link", { name: "Choose size" })).toHaveAttribute("href", `/product/${tee.id}`);
    await u.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(cartInStorage()).toEqual([{ productId: watch.id, size: "One Size", qty: 1 }]);
  });
});

describe("complete the look", () => {
  it("shows a priced outfit for a product", () => {
    app(<CompleteTheLook anchor={productById("kasa-oxford-white")!} />);
    expect(screen.getByRole("heading", { name: "Complete the look" })).toBeInTheDocument();
    expect(screen.getByText(/Complete outfit, \d pieces/)).toBeInTheDocument();
    expect(screen.getByText("Your pick")).toBeInTheDocument();
  });

  it("total-outfit mode respects the budget and reports it", async () => {
    const u = userEvent.setup();
    app(<CompleteTheLook anchor={productById("loom-tee-black")!} />);
    await u.click(screen.getByRole("button", { name: "Total outfit" }));
    const slider = screen.getByLabelText(/whole outfit/i) as HTMLInputElement;
    expect(Number(slider.value)).toBeGreaterThanOrEqual(3000);
    expect(screen.getByText(/Within your .* budget/)).toBeInTheDocument();
  });

  it("an impossible total budget is flagged as over budget, not hidden", async () => {
    const u = userEvent.setup();
    const { container } = app(<CompleteTheLook anchor={productById("kasa-blazer-navy")!} />);
    await u.click(screen.getByRole("button", { name: "Total outfit" }));
    const slider = screen.getByLabelText(/whole outfit/i) as HTMLInputElement;
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(slider, { target: { value: "1500" } });
    expect(container.textContent).toMatch(/over your .*1,500 budget/);
  });

  it("per-item mode caps each recommended piece", async () => {
    const u = userEvent.setup();
    app(<CompleteTheLook anchor={productById("loom-tee-black")!} />);
    await u.click(screen.getByRole("button", { name: "Per item" }));
    expect(screen.getByText(/Maximum for each piece/)).toBeInTheDocument();
  });

  it("unisex products let the shopper choose who it's styled for", async () => {
    const u = userEvent.setup();
    app(<CompleteTheLook anchor={productById("meridian-sneaker-white")!} />);
    expect(screen.getByRole("button", { name: "women" })).toHaveAttribute("aria-pressed", "true");
    await u.click(screen.getByRole("button", { name: "men" }));
    expect(screen.getByRole("button", { name: "men" })).toHaveAttribute("aria-pressed", "true");
  });

  it("saving an outfit puts every piece in the wishlist", async () => {
    const u = userEvent.setup();
    app(<CompleteTheLook anchor={productById("kasa-oxford-white")!} />);
    await u.click(screen.getByRole("button", { name: "Save outfit to wishlist" }));
    expect(wishInStorage().length).toBeGreaterThanOrEqual(4);
    expect(wishInStorage()).toContain("kasa-oxford-white");
  });
});

describe("AI stylist chat", () => {
  it("rejects an empty message with an explanation", async () => {
    const u = userEvent.setup();
    app(<StylistChat />);
    await u.click(screen.getByRole("button", { name: "Ask" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Describe the occasion/);
  });

  it("is honest that it is rule-based, not an AI model", () => {
    app(<StylistChat />);
    expect(screen.getByText(/No AI language model is connected yet/)).toBeInTheDocument();
  });

  it("asks who it's for, then builds outfits within the stated budget", async () => {
    const u = userEvent.setup();
    app(<StylistChat />);
    await u.type(screen.getByLabelText(/Describe the outfit/), "classy farewell outfit under ₹2500");
    await u.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText("Who is this outfit for?")).toBeInTheDocument();
    expect(screen.getByText(/Farewell/)).toBeInTheDocument(); // "what I understood" chip
    await u.click(screen.getByRole("button", { name: "women" }));
    expect(await screen.findByText(/Within your ₹2,500 budget/)).toBeInTheDocument();
  });

  it("example prompts work, and nonsense gets guidance instead of random products", async () => {
    const u = userEvent.setup();
    app(<StylistChat />);
    await u.click(screen.getByRole("button", { name: "Suggest a birthday outfit for my sister" }));
    expect(await screen.findAllByText(/Outfit \d: built around/)).not.toHaveLength(0);
    await u.type(screen.getByLabelText(/Describe the outfit/), "hello there");
    await u.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText(/couldn't pick out an occasion/)).toBeInTheDocument();
  });

  it("marks outfits as over budget when nothing fits", async () => {
    const u = userEvent.setup();
    app(<StylistChat />);
    await u.type(screen.getByLabelText(/Describe the outfit/), "farewell outfit for men under ₹500");
    await u.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText(/Nothing complete fits ₹500/)).toBeInTheDocument();
    expect((await screen.findAllByText(/over your ₹500 budget/)).length).toBeGreaterThan(0);
  });
});
