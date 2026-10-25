This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Immersive design (design-4)

An interactive direction using near-black, violet and electric lime, a Three.js
sculpture, a coaching brief, and communication-focused program cards.
English, French and Arabic content centres on meetings, presentations,
negotiations and leadership rather than university learning.

The lazy-loaded WebGL2 scene reacts to the pointer with eased rotation and
lighting. Fine-pointer devices get a cursor halo, tilting cards and buttons, and
pointer-positioned hover glows without replacing the native cursor. Rendering
pauses when the hero is offscreen or the tab is hidden. Pixel ratio is capped at
1.5; GPU resources, observers and event listeners are disposed on unmount.
Reduced-motion preferences disable animation and use the static CSS sculpture.
WebGL2 initialization failure or context loss also uses that fallback with a
console warning. All decorative effects are hidden from assistive technology.
The header retains scroll progress, without a pause button or scroll hijacking.

Pricing, the four session bundles, individual-only lessons, EN/FR/AR, theme
switching, and WhatsApp booking remain unchanged.

Run `npm run dev -- --port 3005` to preview this branch independently.
`design-1`, `design-2`, and `design-3` preserve the other directions. No deployment is
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
