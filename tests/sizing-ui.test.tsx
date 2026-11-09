import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShopProvider from "@/lib/store/ShopProvider";
import ProductActions from "@/components/ProductActions";
import SizeProfileForm from "@/components/SizeProfileForm";
import SizeComparison from "@/components/SizeComparison";
import { productById } from "@/data/products";

const KEY = "stylesense.profile.v1";
const MEN = { unit: "cm", fit: "regular", height: 175, chest: 98, waist: 82, hips: 98, shoulder: 44.5 };
const seed = (p: object) => localStorage.setItem(KEY, JSON.stringify(p));
const stored = () => JSON.parse(localStorage.getItem(KEY) ?? "null");
const app = (ui: React.ReactNode) => render(<ShopProvider>{ui}</ShopProvider>);
const region = async () => within(await screen.findByRole("region", { name: "Size suggestion" }));
const suggestedSize = async () => (await region()).getByText(/^(XS|S|M|L|XL|XXL|\d\d)$/, { selector: "p" }).textContent;

describe("measurement profile form", () => {
  it("saves measurements in cm and a fit preference to localStorage", async () => {
    const u = userEvent.setup();
    app(<SizeProfileForm />);
    await u.type(await screen.findByLabelText(/^Height/), "175");
    await u.type(screen.getByLabelText(/^Chest/), "98");
    await u.type(screen.getByLabelText(/^Waist/), "82");
    await u.type(screen.getByLabelText(/^Hips/), "98");
    await u.type(screen.getByLabelText(/^Shoulder width/), "44.5");
    await u.click(screen.getByRole("button", { name: /Relaxed/ }));
    await u.click(screen.getByRole("button", { name: "Save measurements" }));
    expect(stored()).toEqual({ unit: "cm", fit: "relaxed", height: 175, chest: 98, waist: 82, hips: 98, shoulder: 44.5 });
    expect(await screen.findByText("Saved on this device")).toBeInTheDocument();
  });

  it("switching to inches converts what you typed, and saving in inches stores cm", async () => {
    const u = userEvent.setup();
    app(<SizeProfileForm />);
    await u.type(await screen.findByLabelText(/^Chest/), "98");
    await u.click(screen.getByRole("button", { name: "Inches (in)" }));
    expect(screen.getByLabelText(/^Chest/)).toHaveValue("38.6");
    await u.click(screen.getByRole("button", { name: "Save measurements" }));
    expect(stored()).toMatchObject({ unit: "in", chest: 98 });
    await u.click(screen.getByRole("button", { name: "Centimetres (cm)" }));
    expect(screen.getByLabelText(/^Chest/)).toHaveValue("98");
  });

  it("rejects implausible values and wrong-unit typos, and saves nothing", async () => {
    const u = userEvent.setup();
    app(<SizeProfileForm />);
    await u.type(await screen.findByLabelText(/^Chest/), "38"); // inches typed while in cm mode
    await u.type(screen.getByLabelText(/^Waist/), "abc");
    await u.click(screen.getByRole("button", { name: "Save measurements" }));
    const alerts = screen.getAllByRole("alert").map((a) => a.textContent ?? "");
    expect(alerts.some((t) => /between 60 and 160 cm/.test(t))).toBe(true);
    expect(alerts.some((t) => /as a number in cm/.test(t))).toBe(true);
    expect(screen.getByLabelText(/^Chest/)).toHaveAttribute("aria-invalid", "true");
    expect(stored()).toBeNull();
  });

  it("asks for at least one measurement", async () => {
    const u = userEvent.setup();
    app(<SizeProfileForm />);
    await u.click(await screen.findByRole("button", { name: "Save measurements" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/at least one measurement/);
    expect(stored()).toBeNull();
  });

  it("restores a saved profile after a 'reload', in the unit it was saved in", async () => {
    seed({ unit: "in", fit: "slim", chest: 98, waist: 82 });
    app(<SizeProfileForm />);
    expect(await screen.findByDisplayValue("38.6")).toBeInTheDocument(); // 98 cm shown in inches
    expect(screen.getByDisplayValue("32.3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inches (in)" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Slim/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("deletes the profile after confirmation", async () => {
    seed(MEN);
    const u = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    app(<SizeProfileForm />);
    await waitFor(() => expect(screen.getByLabelText(/^Chest/)).toHaveValue("98"));
    await u.click(screen.getByRole("button", { name: "Delete my measurements" }));
    expect(stored()).not.toBeNull(); // cancelled
    await u.click(screen.getByRole("button", { name: "Delete my measurements" }));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(stored()).toBeNull();
    expect(screen.getByLabelText(/^Chest/)).toHaveValue("");
  });

  it("survives a corrupted stored profile", async () => {
    localStorage.setItem(KEY, "{definitely not json");
    app(<SizeProfileForm />);
    expect(await screen.findByLabelText(/^Chest/)).toHaveValue("");
  });
});

describe("size suggestion on the product page", () => {
  const kasa = productById("kasa-oxford-white")!;

  it("invites you to add measurements when there is no profile", async () => {
    app(<ProductActions product={kasa} />);
    const link = await screen.findByRole("link", { name: "Add my measurements" });
    expect(link).toHaveAttribute("href", "/size-profile");
  });

  it("recommends a size with confidence, reasons, illustrative chart and disclaimer", async () => {
    seed(MEN);
    app(<ProductActions product={kasa} />);
    const r = await region();
    expect(await suggestedSize()).toBe("M");
    expect(r.getByRole("img", { name: "High confidence" })).toBeInTheDocument();
    expect(r.getByText(/falls within size M's range of 95–100 cm/)).toBeInTheDocument();
    expect(r.getByText(/Between sizes/)).toBeInTheDocument();
    expect(r.getByText(/not a guarantee of fit/)).toBeInTheDocument();
    expect(r.getByText(/Illustrative chart/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "M" }).textContent).toContain("★"); // suggested size is marked
  });

  it("'Select size' picks it, and the cart gets that size", async () => {
    seed(MEN);
    const u = userEvent.setup();
    app(<ProductActions product={kasa} />);
    await u.click((await region()).getByRole("button", { name: "Select size M" }));
    expect(screen.getByRole("button", { name: "M" })).toHaveAttribute("aria-pressed", "true");
    await u.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(JSON.parse(localStorage.getItem("stylesense.cart.v1")!)).toEqual([{ productId: kasa.id, size: "M", qty: 1 }]);
  });

  it("previewing slim / relaxed changes the size without changing the saved profile", async () => {
    seed(MEN);
    const u = userEvent.setup();
    app(<ProductActions product={kasa} />);
    await region();
    await u.click(screen.getByRole("button", { name: "slim" }));
    expect(await suggestedSize()).toBe("S");
    await u.click(screen.getByRole("button", { name: "relaxed" }));
    expect(await suggestedSize()).toBe("L");
    expect(stored().fit).toBe("regular");
  });

  it("the same body gets different sizes at different brands", async () => {
    seed(MEN);
    const sizes: string[] = [];
    for (const id of ["kasa-oxford-white", "loom-tee-white", "northline-tee-grey"]) {
      const { unmount } = app(<ProductActions product={productById(id)!} />);
      sizes.push(String(await suggestedSize()));
      unmount();
    }
    expect(sizes).toEqual(["M", "S", "L"]);
  });

  it("explains what's missing instead of guessing", async () => {
    seed({ unit: "cm", fit: "regular", waist: 82 });
    app(<ProductActions product={kasa} />);
    expect(await screen.findByText(/Add your chest to get a size suggestion/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Update my measurements" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Size suggestion" })).not.toBeInTheDocument();
  });

  it("shows low confidence and a warning for a body outside the chart", async () => {
    seed({ unit: "cm", fit: "regular", chest: 140, waist: 130, shoulder: 58 });
    app(<ProductActions product={kasa} />);
    const r = await region();
    expect(r.getByRole("img", { name: "Low confidence" })).toBeInTheDocument();
    expect(r.getByText(/no size here is a good match/)).toBeInTheDocument();
  });

  it("warns when optional measurements are missing and confidence is not high", async () => {
    seed({ unit: "cm", fit: "regular", chest: 98 });
    app(<ProductActions product={kasa} />);
    const r = await region();
    expect(r.getByText(/Add your shoulder width and waist/)).toBeInTheDocument();
    expect(r.queryByRole("img", { name: "High confidence" })).not.toBeInTheDocument();
  });

  it("explains in inches for an inches profile", async () => {
    seed({ ...MEN, unit: "in" });
    app(<ProductActions product={kasa} />);
    expect(((await region()).getByText(/falls within size M's range/)).textContent).toMatch(/37\.4–39\.4 in/);
  });

  it("shoes get an honest note, not a made-up size", async () => {
    seed(MEN);
    app(<ProductActions product={productById("meridian-derby-tan")!} />);
    expect(await screen.findByText(/depends on foot length/)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Size suggestion" })).not.toBeInTheDocument();
  });

  it("free-size items show no size suggestion at all", async () => {
    seed(MEN);
    app(<ProductActions product={productById("tidewater-steel-dress")!} />);
    await screen.findByRole("button", { name: "Add to cart" });
    expect(screen.queryByText(/Find your size/)).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Size suggestion" })).not.toBeInTheDocument();
  });
});

describe("size comparison across brands", () => {
  it("renders nothing without a profile", () => {
    const { container } = app(<SizeComparison />);
    expect(container.querySelector("table")).toBeNull();
  });

  it("lists a size per brand and the labels differ", async () => {
    seed(MEN);
    const u = userEvent.setup();
    app(<SizeComparison />);
    await screen.findByRole("heading", { name: "Your size at different brands" });
    await u.click(screen.getByRole("button", { name: "men's styles" }));
    const rows = screen.getAllByRole("row").slice(1);
    const sizes = rows.map((r) => within(r).queryAllByRole("cell")[1]?.textContent).filter(Boolean);
    expect(rows.length).toBeGreaterThanOrEqual(6);
    expect(new Set(sizes).size).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole("link", { name: "Oxford Button-Down Shirt" })).toHaveAttribute("href", "/product/kasa-oxford-white");
  });
});
