import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import React from "react";

// Next.js pieces that need a running app: replaced with minimal stand-ins.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));
vi.mock("next/image", () => ({
  default: (p: { src: string; alt: string }) => React.createElement("img", { src: p.src, alt: p.alt }),
}));

// jsdom doesn't implement scrollIntoView (real browsers do).
Element.prototype.scrollIntoView = vi.fn();

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
