"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/types";
import ProductImage from "./ProductImage";

/**
 * The single place that decides what picture to show for a product.
 * Real photography (product.images, from src/data/productPhotos.ts) is used when present;
 * the generated illustration is the fallback, including if a photo fails to load.
 * To go live with real photos you only edit data, not components.
 */
export default function ProductMedia({ product, className = "", sizes = "(min-width: 1024px) 25vw, 50vw", priority = false }: {
  product: Product; className?: string; sizes?: string; priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const photo = product.images?.[0];
  if (!photo || failed) return <ProductImage product={product} className={className} />;
  return (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
