This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Custom domain and search discovery

The production domain is `https://nexusacademy.ma`, hosted on the existing free
Cloudflare Pages project, with both apex and www attached as custom domains.
No paid web-hosting plan is required. Domain-level redirects must be configured
in Cloudflare Rules; Pages `_redirects` does not support hostname matching.

Marketing pages are statically rendered at `/fr/`, `/en/` and `/ar/`, each with
localized metadata, a self-referencing canonical and reciprocal language
alternatives. The unprefixed homepage redirects permanently to `/fr/` through `public/_redirects`
on Cloudflare; its exported fallback also uses French and canonicalizes to `/fr/`.
Language navigation preserves campaign query parameters and the section hash.
Dashboard language preferences remain independent of the public URL.
`/sitemap.xml` lists only public language pages; `/robots.txt` excludes `/admin/`,
which also retains its noindex metadata. These are crawl controls, not access
controls: dashboard data still requires authentication and database permissions.

After `npm run build`, run `node --test tests/seo-export.test.mjs` to verify raw
localized HTML, canonical/alternate links, sitemap and dashboard noindex.
Once the domain is live, verify a Domain property in Google Search Console
and submit `https://nexusacademy.ma/sitemap.xml`. This requires the owner's
Google account; it is not automatically provisioned by deployment.

## Teacher diagnostic conversion

Apply `supabase/migrations/202610260006_teacher_conversion.sql` before deploying
the updated web dashboard or building the Android app. No past diagnostic
completion or payment is inferred from Confirmed status.

Admins record the actual diagnostic completion time and first payment receipt
time (including a deposit) in the client follow-up form. The diagnostic teacher
is captured on completion and retained through later teaching reassignments.
To correct a wrongly attributed diagnostic, clear its payment and completion,
save, correct the assignment, then record the actual completion/payment again.
Dates use the admin device's local timezone, as does the existing callback field.

Teacher cards show completed diagnostic sessions, paying clients and
`paying clients / completed diagnostics × 100`, rounded to one decimal.
Without completed diagnostics the rate is shown as a dash, not 0%.
Upcoming appointments and no-shows do not count. Each enquiry can record one
completed diagnostic; repeat completed sessions count in the denominator.
Clients are deduplicated by normalized email for payment attribution. Each
client's earliest recorded payment is credited once to the teacher of their
earliest completed diagnostic before that payment, even across duplicate
enquiries. Removed teachers retain their statistics. Counts are lifetime totals,
not payment verification or revenue reporting; admins must enter actual receipts.
Refresh the teacher directory after another admin changes records.

Run `node --test tests/teacher-conversion.test.mjs` for database regression tests.

## Cinematic design (design-5)

A cinematic, symmetrical direction with dusty rose, mint, mustard and cream.
Jost provides vintage geometric lettering alongside Georgia display typography
and Noto Sans Arabic. Original Three.js scenery adds a pastel miniature executive
classroom, matching windows, curtains, a ticking wall clock and warm matte props.
Stepped study-note motion evokes handcrafted stop-motion; no film artwork is used.
Curtains open on arrival, flashcards bob in the air, notebook pages turn and the
camera gently drifts even without pointer input. A floating set label, rotating
ribbon arrows carry motion beyond the canvas.
These additional effects only run when reduced motion is not requested.
Dark mode uses a distinct burgundy-and-forest evening palette across the header,
hero and lower sections. The room switches materials, blue window
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
console warning. Decorative canvas effects are hidden from assistive technology.
The header retains scroll progress, without a pause button or scroll hijacking.

The hero room spans the full container, replacing the separate coaching brief.
React Three Fiber raycasts the laptops, whiteboard, wall clock, both floating
papers and the coral-trimmed book on each of the three shelf levels directly;
there are no numbered circles. Each interactive group uses React Spring to scale
smoothly to 115%. A custom postprocessing Kawase blur pass softens the room before
the selected object's layer is rendered sharply, including objects sharing its
depth. Drei Html cards stay attached to their object and are clamped inside the
canvas. Click or tap to pin, use Escape or close to dismiss, and request a callback
with the feature prefilled. Plus Jakarta Sans, Royal Purple/Sunset Coral accents,
Tailwind glass utilities and theme-aware surfaces style the cards.
The named controls below the canvas provide keyboard, touch and static
fallback access without covering the model. Content remains localized in EN/FR/AR.
Reduced-motion users see the static room and cards, without spring or blur motion.
Flexible Scheduling belongs to the clock. The left paper introduces meeting
confidence and the right paper presentation skills. The three interactive shelf books
cover professional vocabulary, negotiation and career preparation. Every card is
localized in English, French and Arabic and can prefill an enquiry topic.
Nested book targets retain their shelf parent so they follow the room correctly.
The papers pause their local drift while active for stable hover interaction.
Interactive books use three distinct, randomly shuffled pastel cover colors.
They slide forward and open their hinged covers over 850ms when active,
turning their inner page surfaces (not their spines) toward the current camera,
then close and return on dismissal. Their original shelf slots remain hittable
during travel. Books clear the shelf before rotating toward the camera and opening;
closing reverses those phases before returning to the slot. Decorative page text
does not raycast, avoiding oversized line hit areas that selected adjacent books.
The desk notebook turns its page upward, keeping the full page above the tabletop.
Its ambient page turn lasts 2.5 seconds once every 45 seconds of scene time,
with an initial 30-second pause; interactive shelf books still respond immediately.
Shelf-book covers and spines enclose the full curved page thickness, preventing
the first pages from protruding through the opposite cover when closed or turning.
Other objects scale over 500ms, with a 650ms card entrance and
a gently delayed 700ms message fade. Hover cards remain mounted for a matching
650ms fade-out, with exiting controls inert and scene captions hidden until the
card disappears. Returning to an object during its exit reverses the fade.
The hover dismissal timer keeps a card open while its content is hovered or
focused, including when canvas pointer-out arrives after the card pointer-enter.
Reduced-motion fallbacks skip these effects.
The Meetings & Leadership program card uses an original static 2D boardroom
illustration with three expressive colleagues, a presenter and chart, knitted and
tweed clothing patterns, detailed hair, round glasses, notebooks and coffee.
Golden window light, soft background detail and subtle grain give it a warm
handcrafted look. It is an inline SVG with no animation, WebGL or external image
request. Other program images and enquiry actions are unchanged.
“Book your free diagnostic session” opens a free 20-minute diagnostic request, including preferred
availability. The team confirms the appointment; no instant calendar booking is
implied. It uses the existing `consultation` request type, also labelled as a free
diagnostic in the admin dashboard. Package enquiries remain separate, with their
original paid bundle prices and `course-info` request type.
The entire selected object's mesh hierarchy is excluded from the blur input and
redrawn sharply, avoiding blurred edge duplicates. Cards use projected object
bounds to minimize overlap and keep their glass blur away from the focal object.
Interactive objects carry fine coral edge trims with a slow, low-amplitude
shimmer and a localized visual key. Trims follow the actual meshes (including
opening book covers), brighten for dark mode, and recede on unselected objects
while a card is open. They do not receive raycasts or introduce numbered markers.
Static/reduced-motion visitors retain the named feature buttons without shimmer.
While any information card is open, the scene heading, interaction key and
bottom caption are hidden so their separate overlay layers cannot cover its text.
They return immediately when the card closes, including in the static fallback.
The package summary emphasizes its total with larger type, a separated price
area and a taller callback button. Price changes reveal over 650ms and the CTA
has an occasional soft sheen; both stop under reduced-motion preferences.
Price updates are announced politely and all four bundle prices are unchanged.
Pricing labels, inclusions and disclaimers use larger, readable type; the
redundant “No subscription / choose a pack” intro is removed in all languages.
Enquiry and admin native selects explicitly match the active color scheme;
option text and backgrounds are paired to preserve dropdown contrast.
The room sits on a Moroccan/Turkish-inspired woven carpet with a deep burgundy
field, indigo borders, antique-gold stepped medallions, dense diamond motifs, fine weave lines and
individual tassels. It receives room shadows, follows workspace movement and
adapts to evening lighting. The static fallback includes the same carpet motif.
The planter holds a detailed olive-inspired indoor tree: a tapered curved trunk,
eighteen branching stems and 324 instanced, curved leaves with varied tones and
subtle central veins. The terracotta pot includes a rolled rim, decorative rings,
visible soil and small stones. Shared leaf geometry keeps the canopy lightweight.
Open books use two page
stacks attached to the cover hinges, without a detached central page block or
wire outlines across their reading surfaces.
The page stacks taper into a shared binding with coincident hinge origins,
curved reading surfaces, curved printed lines and fine fore-edge details.
The wall clock displays device-synchronized `Africa/Casablanca` time with hour,
minute and second hands, including Morocco's seasonal time changes. Its static
fallback also updates hour/minute hands; hidden 3D scenes catch up on resume.
The focus renderer tone-maps highlights before blurring, avoiding HDR sun/moon
brightness spreading into glowing halos during interaction.
The initial full-page loading bar measures three readiness milestones: page load,
fonts and the first rendered 3D frame (or confirmed static fallback). Content stays
hidden and inert until ready, avoiding partial-layout flashes. After 12 seconds,
an explicit slow-loading message offers manual access rather than trapping users.
The hero pricing teaser is removed in all languages; package prices are unchanged.
The enlarged room sits between softly inset Moroccan-inspired arches, with a
bookcase, potted plant, floor lamp and an extended shadow-receiving stage on wide
screens. Peripheral furnishings recede on narrow screens to preserve hotspot
spacing. Daylight includes a rotating, softly shining sun and warm floor-light
patterns; night reveals a cratered full moon, cooler shadows and a lit floor lamp.
The sun and moon are solid Three.js objects parented to the room, so perspective,
pointer rotation and idle drift move them with the scene rather than the page
background. The sun's rays rotate; the full moon gently bobs and rocks its cratered
surface, with a softly breathing glow for both. Celestial motion uses the same
render loop and pauses offscreen. Static SVG versions appear only for reduced
motion or WebGL fallback, without duplicating the canvas orbs.

Pricing, the four session bundles, individual-only lessons, EN/FR/AR and theme
switching remain unchanged. In design 5, consultation/contact and package booking
now open a matching enquiry popup instead of sending visitors to WhatsApp.
The selected bundle follows the request; the team calls to finalize the offer.

## Client enquiries and private dashboard

The cinematic site uses a responsive readability scale: body copy is at least
16px, secondary labels at least 14px, form inputs 16px, and primary controls at
least 44px tall. Program cards stack on mobile, and the compact navigation takes
over on narrower desktops to accommodate larger labels and translated copy.
The enquiry dialog and private dashboard follow the same readable sizing.

`/admin/` provides password sign-in, an allowlisted-admin enquiry inbox, search,
status filters, callback scheduling and private notes, in EN/FR/AR and both themes.
The dashboard includes animated counts, filterable pipeline cards, animated list
reordering, a brief welcome animation and a transitioning client detail panel.
Reduced-motion preferences disable these effects. Counts describe loaded records,
not a real-time feed. The total card clears the status filter.

Admin sign-in offers an unchecked-by-default **Remember me on this device**
option on the website and Android. Opting in stores Supabase session tokens in
local storage so a session can resume after restarting; passwords are never
stored by the dashboard. Unchecked logins use per-tab/session storage as before.
Use remembered sessions only on trusted, screen-locked devices. Explicit sign-out
removes tokens from both stores, and existing server-side admin checks still
apply on every startup. Session expiry, revocation, clearing app/site data or
uninstalling can require signing in again.

Quality-of-life controls include password visibility, a one-click search/filter
reset, unsaved-change badges and confirmation before switching client, leaving
for the homepage or signing out. Browser refresh/close warnings are best-effort
(mobile OS termination cannot be intercepted); drafts are not stored persistently.
Ctrl+Enter or Command+Enter saves the focused follow-up/session form, with normal
validation. Switching to statistics keeps the client's current drafts mounted.

Client details include a manual **Session & welcome message** workflow. Assign a
teacher, enter the agreed date and time in Morocco, optionally paste an existing
meeting link, and save. The dashboard prepares a welcoming message in the client's
stored EN/FR/AR language, including their name, teacher and appointment time.
Copy it and send it to the group you create yourself. There is no group API,
automatic booking or automatic sending. Unsaved appointment edits cannot be copied
as confirmed details; the original availability text is never treated as a booking.
**Teachers** manages a shared admin-only list, initially Mohammed. Removing a teacher
prevents new assignments while retaining names on existing appointments.
Teacher cards show unique clients by email: overall assignment history, currently
assigned clients, and Active / Paused / Not started / Finished teaching activity.
Teaching activity is separate from enquiry conversion. New assignments, including
teacher changes, start as **Not started**; save an activity change on the client's
session form once the teaching relationship begins or changes. Overall history
retains reassignments from this update onward, not unknowable past assignments.
For multiple enquiries from one email, Active takes precedence over Paused,
Not started and Finished, so each client counts once per teacher.

Profiles include weekday/weekend/flexible preferences, Morocco-time availability,
private notes, languages, specialties and an optional active-client capacity target.
Capacity is advisory, not an assignment limit. Counts query all records, not just
the loaded inbox, refresh after session saves and can be refreshed manually.
Removed teachers remain available in **Show removed teachers** for historical review.
Profile edits have unsaved-change guards and optimistic concurrency checks.
Apply [the teacher-profile migration](supabase/migrations/202610260005_teacher_profiles.sql)
after the meeting migration before deploying these features.
Apply [the meeting migration](supabase/migrations/202610260004_meeting_welcome.sql)
before deploying this dashboard to the website or Android app. Appointments and
teachers are shared between devices, not stored only on the phone.
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

## Android dashboard

The shared web and Android dashboard uses short entrance transitions, animated
metrics and charts, status-colored cards, and loading feedback. Trend points can
be explored by touch/pointer or with Left/Right, Home and End while the graph is
focused. All values retain the existing conversion definitions and accessible
data table. Reduced-motion preferences disable decorative movement and counters;
inbox drafts remain mounted when switching between enquiries and statistics.

The Capacitor Android app (`ma.nexusacademy.dashboard`) bundles the static
dashboard at its root URL. It uses the same Supabase accounts, permissions,
enquiries and statistics. There is no hosted website URL embedded as a remote
WebView source. An internet connection is required for private business data;
sessions use session storage by default, or persistent local storage when
**Remember me** is selected. Neither is an encrypted OS credential vault.

`npm run android:sync` sets `NEXT_PUBLIC_NEXUS_ANDROID_APP=1` only for the Android
build, tests the exported root and admin pages, and updates native assets.
The app root renders the dashboard directly: Capacitor serves root `index.html`
for extensionless routes, so setting a start path alone does not select the
exported admin HTML. The app has no public-homepage links, visitor analytics
prompt or marketing enquiry dialog. A normal `npm run build` still exports the
public website, unchanged; run it before deploying `out` as the public site.
Android
requires Java 21 and SDK 36. Alternatively run **Android dashboard APK** in
GitHub Actions after configuring these non-secret repository variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `FIREBASE_ANDROID_CONFIG`: the Firebase Android client `google-services.json`
  contents for this package (client configuration, not a service account key).

The workflow produces a **debug-signed test APK**, not a Play Store release.
Download its `nexus-dashboard-test-apk` artifact and sideload only on trusted
test devices. Debug builds use a temporary development signing key; later builds
may require uninstalling the old app. Before distribution, configure a stable
release signing key in protected GitHub secrets and disable debugging.
Never put Firebase service account credentials or Android signing keys in the
repository, public variables or APK.

Push notifications are Android-only and opt-in after admin sign-in. They use
Firebase Cloud Messaging, not Firebase Authentication or Google Analytics.
Alerts contain generic text and a random enquiry reference, not client details.
Delivery requires Google Play services, connectivity and Android permission;
force-stopped apps do not receive alerts until reopened. See the
[push backend setup](supabase/README.md#android-push-notifications) before testing.

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

## Deploy on Cloudflare Pages

The website uses Next.js static export; Supabase remains its separate backend.
Deploy it as a Pages site, not a server-rendered Next.js Worker:

- Connect `MarouaneOuchala/nexus-website-`, production branch `main`.
- Build command: `npm run build`; output directory: `out`; root: repository root.
- Set `NODE_VERSION=24`, `NEXT_PUBLIC_SUPABASE_URL`, and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the build environment. Use only the
  public Supabase key, never a service-role key. Configure preview environments
  too if needed. Leave `NEXT_PUBLIC_BASE_PATH` unset.
- No Pages Functions, paid hosting plan, or Next.js adapter is required.
- Test the generated `pages.dev` URL, `/admin/`, enquiry dialogs, analytics
  consent, assets and 404 responses before connecting a custom domain.
- Add the domain through Pages **Custom domains** and follow the displayed DNS
  instructions. Preserve existing email DNS records and leave previous hosting
  unchanged until the new domain is verified.

The Pages Free plan currently allows 500 builds/month, 20,000 files and 25 MiB
per asset; static asset requests are free. Domain registration, email and
Supabase are separate services with separate limits and potential costs.
See [Cloudflare's static Next.js guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/)
and [Pages limits](https://developers.cloudflare.com/pages/platform/limits/).

Vercel remains an alternative deployment target, but its Hobby plan is restricted
to non-commercial personal use; a business deployment needs an appropriate paid
plan. Do not remove the old deployment until the replacement has been tested.
