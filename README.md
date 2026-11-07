# StyleSense AI

Multi-brand fashion shopping with an AI stylist (in progress). This repo is built in milestones.

## Status: Milestone 1 (catalogue foundation)

Implemented: homepage with occasion + budget picker, shop page (search, filters, sort, URL-shareable),
product pages, 50-item demo catalogue across 8 fictional brands, generated SVG product illustrations.

Not yet built: AI stylist chat, complete-the-look, size recommendation, colour analysis, virtual try-on,
wishlist/cart, Supabase, PWA.

## Run it

Requires Node 20+.

    npm install
    npm run dev        # http://localhost:3000

## Check it

    npm run typecheck  # TypeScript
    npm run lint       # ESLint
    npm run test:data  # validates the catalogue and filter logic
    npm run build      # production build

## Notes

- All brands and products are **fictional demo data**. No real purchase links exist (`merchantUrl` is `null`).
- Product images are generated SVG illustrations, so there are no external image URLs to break.
- No environment variables are needed yet. See `.env.example` for what later milestones will use.
