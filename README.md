# StyleSense AI

Multi-brand fashion shopping with an AI stylist. Built in milestones.

## Status: Milestone 3 (size intelligence)

| Feature | Status |
|---|---|
| Homepage, shop, search, filters, sort, product pages | Implemented |
| Cart (add, remove, quantity, totals), saved in the browser | Implemented |
| Wishlist, saved in the browser | Implemented |
| Size selection and quantity on product pages | Implemented |
| Complete the Look (colour, style, occasion scoring) | Implemented |
| Budget modes: per item and total outfit | Implemented |
| Stylist page (Gemini chat with catalogue-backed outfit suggestions) | Implemented; rule-based fallback |
| Mobile bottom navigation, loading / empty / error states | Implemented |
| Measurement profile (cm / inches, fit preference), saved in the browser | Implemented |
| Brand-specific size suggestions with reasons, confidence and warnings | Implemented (illustrative charts) |
| Real-photo support (data-driven, illustration fallback) | Prepared, no photos added |
| Gemini conversational AI | Implemented using the Google GenAI SDK |
| Shoe sizing (needs foot length) | Not built |
| Colour analysis, virtual try-on | Not built |
| Supabase (accounts, database), PWA install | Not built |
| Checkout / payments | Not available (demo catalogue) |

## Run it

Requires Node 20+.

    npm install
    npm run dev        # http://localhost:3000

To enable Gemini, copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` to a Google AI Studio API key. Keep it server-only (never use a `NEXT_PUBLIC_` prefix); the key is read only by `/api/stylist`. If it is absent or Gemini is unavailable, the built-in rule-based stylist responds instead.

The stylist uses Google's official [Google GenAI SDK](https://ai.google.dev/gemini-api/docs/libraries) with `gemini-3.8-flash`, listed on the [Gemini API pricing page](https://ai.google.dev/gemini-api/docs/pricing) as eligible for free-tier use. Free-tier quotas and model availability can change; this project does not configure paid billing or Google Cloud services.

## Check it

    npm run typecheck  # TypeScript
    npm run lint       # ESLint
    npm run build      # production build
    npm test           # all suites (catalogue, cart, outfit engine, stylist, sizing, UI)
    npm run example:sizing   # a worked size-recommendation example

## How it works

- `src/data/`: demo catalogue (fictional brands, no real purchase links).
- `src/lib/store/`: cart and wishlist. Pure logic in `cart.ts`, React state + localStorage in `ShopProvider.tsx`.
- `src/lib/recommend/`: outfit engine and colour rules. Pure TypeScript, no network. Candidates scoring under 0.7 are never shown, so empty slots are preferred to random filler.
- `src/lib/sizing/` + `src/data/sizeCharts.ts`: measurement profile, size charts and the size algorithm. See `docs/SIZING.md`. **Every size chart is illustrative** (fictional brands); suggestions are guidance, not a guarantee of fit.
- `src/app/api/stylist/route.ts`: server-only Gemini API route. Conversation input is bounded and interpreted into structured intent; the API key is never sent to or logged by the browser.
- `src/lib/stylist/`: Gemini intent interpretation is combined with the existing catalogue parser and deterministic outfit engine. Product IDs, names, prices, stock, and budget totals come from the local demo catalogue, never from model-generated product claims. The keyword parser remains the route and network fallback.
- With a key configured, up to 12 recent chat messages are sent to Google for Gemini processing; chat history is not saved by the app.
- Budgets: *per item* caps every piece. *Total outfit* drops optional pieces, then swaps for cheaper matches, and flags the outfit as over budget if it still doesn't fit.

## Adding real product photos

Only add photos you have rights to use. Edit `src/data/productPhotos.ts`:

    "kasa-oxford-white": [{ src: "/products/kasa-oxford-white.jpg", alt: "...", credit: "...", licenseNote: "..." }]

Put local files in `public/products/`. For remote images, allow the host in `next.config.mjs`.
If a photo is missing or fails to load, the generated illustration is shown instead.

## Notes

- All brands and products are **fictional demo data**. `merchantUrl` is `null` until a verified link is added.
- Gemini requires a server-only `GEMINI_API_KEY` in `.env.local`; without it, the rule-based stylist remains available. See `.env.example`.
- Cart, wishlist and measurements live in this browser only (localStorage). Clearing site data clears them.
