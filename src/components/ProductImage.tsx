import type { Product } from "@/types";

/**
 * Generated garment illustrations, tinted with each product's own colour.
 * They are clearly illustrations (not photos), have no network dependency, and
 * can never be a broken image. Swap this component for real <Image> tags once
 * you have licensed product photography.
 */
function isDark(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b < 90;
}

function Shape({ product }: { product: Product }) {
  const fill = product.color.hex;
  const line = isDark(fill) ? "#FFFFFF" : "#000000";
  const ld = { stroke: line, strokeOpacity: 0.28, strokeWidth: 1.5, fill: "none", strokeLinecap: "round" as const };
  const body = { fill, stroke: line, strokeOpacity: 0.3, strokeWidth: 1.5, strokeLinejoin: "round" as const };
  const shade = { fill: "#000", fillOpacity: 0.16 };

  switch (product.category) {
    case "tshirt":
      return (<g><path {...body} d="M70 40 L40 55 L18 100 L45 112 L55 95 L55 200 L145 200 L145 95 L155 112 L182 100 L160 55 L130 40 Q100 62 70 40Z" /><path {...ld} d="M70 40 Q100 62 130 40" /></g>);
    case "shirt":
      return (<g><path {...body} d="M72 38 L38 52 L20 150 L44 156 L56 100 L56 204 L144 204 L144 100 L156 156 L180 150 L162 52 L128 38 L100 56Z" /><path {...ld} d="M72 38 L100 70 L128 38 M100 70 L100 204" /><circle cx="100" cy="96" r="1.8" fill={line} fillOpacity=".4" /><circle cx="100" cy="128" r="1.8" fill={line} fillOpacity=".4" /><circle cx="100" cy="160" r="1.8" fill={line} fillOpacity=".4" /></g>);
    case "kurta":
      return (<g><path {...body} d="M72 32 L42 46 L24 120 L46 126 L58 90 L54 226 L146 226 L142 90 L154 126 L176 120 L158 46 L128 32 Q100 58 72 32Z" /><path {...ld} d="M100 50 L100 120 M54 226 L54 200 M146 226 L146 200" /><circle cx="100" cy="76" r="1.8" fill={line} fillOpacity=".4" /><circle cx="100" cy="98" r="1.8" fill={line} fillOpacity=".4" /></g>);
    case "top":
      return (<g><path {...body} d="M70 40 L62 70 L58 100 L64 196 L136 196 L142 100 L138 70 L130 40 Q100 70 70 40Z" /><path {...ld} d="M70 40 Q100 70 130 40" /></g>);
    case "dress":
      return (<g><path {...body} d="M76 30 L66 60 L60 100 L40 218 L160 218 L140 100 L134 60 L124 30 Q100 52 76 30Z" /><path {...ld} d="M60 100 Q100 112 140 100 M76 30 Q100 52 124 30" /></g>);
    case "jeans":
      return (<g><path {...body} d="M60 30 L140 30 L152 220 L112 220 L100 92 L88 220 L48 220Z" /><path {...ld} d="M60 46 L140 46 M100 46 L100 92" /><path {...ld} d="M118 46 Q126 60 122 70" /></g>);
    case "trousers":
      return (<g><path {...body} d="M62 30 L138 30 L146 220 L108 220 L100 84 L92 220 L54 220Z" /><path {...ld} d="M62 44 L138 44 M80 44 L76 218 M120 44 L124 218" /></g>);
    case "skirt":
      return (<g><path {...body} d="M66 44 L134 44 L170 204 L30 204Z" /><path {...ld} d="M66 56 L134 56 M100 56 L100 204" /></g>);
    case "jacket":
      return (<g><path {...body} d="M72 34 L36 48 L16 178 L42 184 L56 100 L56 210 L144 210 L144 100 L158 184 L184 178 L164 48 L128 34 L100 66Z" /><path {...ld} d="M72 34 L88 90 L100 66 L112 90 L128 34 M100 66 L100 210" /></g>);
    case "shoes":
      return (<g transform="translate(100 150) scale(1.22) translate(-100 -150)"><path {...body} d="M22 140 L22 168 L184 168 L184 158 Q184 148 170 144 L122 134 Q110 110 92 110 L74 110 Q66 128 52 132 L36 134 Q22 136 22 140Z" /><path {...shade} d="M22 166 L184 166 L184 174 Q184 188 170 188 L36 188 Q22 188 22 174Z" /><path {...ld} d="M92 112 L100 124 M104 118 L112 130 M74 112 L84 126" /></g>);
    case "watch":
      return (<g><rect {...body} x="82" y="18" width="36" height="204" rx="10" /><circle {...body} cx="100" cy="120" r="44" /><circle cx="100" cy="120" r="35" fill="#F7F6F2" stroke="#000" strokeOpacity=".2" /><path d="M100 120 L100 98 M100 120 L116 128" stroke="#17181C" strokeWidth="3" strokeLinecap="round" /><circle cx="100" cy="120" r="3" fill="#17181C" /></g>);
    case "bag": {
      const isBackpack = /backpack/i.test(product.name);
      const isClutch = /clutch/i.test(product.name);
      if (isClutch) return (<g><path {...body} d="M30 90 L170 90 L170 168 L30 168Z" /><path {...ld} d="M30 90 L100 134 L170 90" /></g>);
      if (isBackpack) return (<g><path d="M76 66 Q76 22 100 22 Q124 22 124 66" fill="none" stroke={fill} strokeWidth="7" strokeLinecap="round" /><path {...body} d="M54 60 Q100 44 146 60 L156 214 L44 214Z" /><path {...ld} d="M62 150 L138 150 M70 96 L130 96" /></g>);
      return (<g><path d="M72 104 Q72 46 100 46 Q128 46 128 104" fill="none" stroke={fill} strokeWidth="7" strokeLinecap="round" /><path {...body} d="M40 100 L160 100 L172 214 L28 214Z" /></g>);
    }
    default: {
      if (/belt/i.test(product.name)) return (<g><rect {...body} x="16" y="104" width="168" height="30" rx="5" /><rect x="84" y="98" width="32" height="42" rx="4" fill="#C9C7C0" stroke="#000" strokeOpacity=".3" /><rect x="94" y="108" width="12" height="22" rx="2" fill="none" stroke="#000" strokeOpacity=".3" strokeWidth="3" /></g>);
      if (/sunglasses/i.test(product.name)) return (<g><path {...body} d="M18 94 L182 94 L182 106 L174 106 Q168 146 140 146 Q112 146 106 106 L94 106 Q88 146 60 146 Q32 146 26 106 L18 106Z" /><path d="M32 104 Q38 136 60 136 Q82 136 86 104Z M114 104 Q118 136 140 136 Q162 136 168 104Z" fill="#8FB3C4" fillOpacity=".5" /></g>);
      return (<g><path {...body} d="M50 30 L150 30 L160 96 Q100 126 40 96Z" /><path {...body} d="M62 100 L96 112 L84 220 L48 214Z" /><path {...ld} d="M58 50 L142 50 M56 70 L144 70" /></g>);
    }
  }
}

export default function ProductImage({ product, className = "" }: { product: Product; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 240"
      role="img"
      aria-label={`Illustration of ${product.name} in ${product.color.name}`}
      className={`h-full w-full ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F1EFEA" />
          <stop offset="1" stopColor="#E2DFD7" />
        </linearGradient>
      </defs>
      <rect width="200" height="240" fill="url(#tile)" />
      <ellipse cx="100" cy="228" rx="52" ry="5" fill="#000" fillOpacity=".08" />
      <g transform="translate(100 120) scale(.82) translate(-100 -120)"><Shape product={product} /></g>
    </svg>
  );
}
