This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Cinematic design (design-5)

A cinematic, symmetrical direction with dusty rose, mint, mustard and cream.
Jost provides vintage geometric lettering alongside Georgia display typography
and Noto Sans Arabic. Original Three.js scenery adds a pastel miniature executive
classroom, matching windows, curtains, a ticking wall clock and warm matte props.
Stepped study-note motion evokes handcrafted stop-motion; no film artwork is used.
Curtains open on arrival, flashcards bob in the air, notebook pages turn and the
camera gently drifts even without pointer input. A floating set label, rotating
ribbon arrows and sequential agenda highlights carry motion beyond the canvas.
These additional effects only run when reduced motion is not requested.
Dark mode uses a distinct burgundy-and-forest evening palette across the header,
hero, coaching brief and lower sections. The room switches materials, blue window
light and warm key lighting live; the static SVG shares the evening colors.
English, French and Arabic content centres on meetings, presentations,
negotiations and leadership rather than university learning.

The lazy-loaded WebGL2 scene depicts a meeting table, two laptops, a notebook,
floating study notes and a presentation screen with animated chart bars. It
reacts to the pointer with eased rotation and lighting. This is a professional
practice setting, not an advertisement for group lessons. Fine-pointer devices get a cursor halo, tilting cards and buttons, and
pointer-positioned hover glows without replacing the native cursor. Rendering
pauses when the hero is offscreen or the tab is hidden. Pixel ratio is capped at
1.5; GPU resources, observers and event listeners are disposed on unmount.
Reduced-motion preferences disable animation and use a static SVG workspace.
WebGL2 initialization failure or context loss also uses that fallback with a
console warning. All decorative effects are hidden from assistive technology.
The header retains scroll progress, without a pause button or scroll hijacking.

Pricing, the four session bundles, individual-only lessons, EN/FR/AR and theme
switching remain unchanged. In design 5, consultation/contact and package booking
now open a matching enquiry popup instead of sending visitors to WhatsApp.
The selected bundle follows the request; the team calls to finalize the offer.

## Client enquiries and private dashboard

`/admin/` provides password sign-in, an allowlisted-admin enquiry inbox, search,
status filters, callback scheduling and private notes, in EN/FR/AR and both themes.
The popup requires a callback phone and consent; it confirms submission only after
Supabase saves the record. Missing configuration and network failures are explicit.

Follow the [Supabase Free setup guide](supabase/README.md) to create a project,
apply the migration, provision an admin and configure the two public connection
values in an ignored `.env.local`. **The backend is not connected automatically.**
Never put service-role keys or admin passwords in browser code.
Run `npm run test:enquiries` for local Postgres permission/validation tests.

Run `npm run dev -- --port 3006` to preview this branch independently.
`design-1` through `design-4` preserve the other directions. No deployment is
performed when switching between these local branches.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
