# Upthrust Design

A single landing page built from the supplied Figma file (Homepage frame, 1440 × 3331). The page is static HTML on Vercel's CDN. The form handler and the CMS sign-in are the only server routes.

## Stack

Astro, Tailwind, Vercel, Decap CMS, Vercel Blob.

Astro puts the copy in the HTML, which is what this page needs for speed and SEO. Tailwind is only the base layer. The layout lives in `src/styles/global.css`.

The desktop layout uses the Figma coordinates directly. Each section is a container, and one Figma pixel is `100cqi / 1440`, so at 1440 every layer sits where it sits in the file and it scales evenly above and below that. Below 768 the hero uses its own 375-wide composition, and the service slides and footer switch to a stacked flow below 1024.

Content is JSON in the repo, edited through Decap CMS. Decap is git-based: a save is a commit, and the commit triggers a Vercel deploy. There is no content database to host or back up, and every change has history and can be reverted. The trade-off is that a published edit takes a build (under a minute) to go live.

## Structure

```text
src/content/site/home.json     hero notes, logo names, footer, form copy
src/content/services/*.json    the four service slides
src/content.config.ts          schema for both, checked at build time
src/components/                header, hero, logo rail, services, footer, contact dialog
src/pages/index.astro          the page
src/pages/api/submit.ts        contact and newsletter handler
src/lib/submissions.ts         storage: Vercel Blob when deployed, data/submissions.json locally
src/pages/api/auth.ts          GitHub sign-in for the CMS
src/pages/api/callback.ts
src/pages/robots.txt.ts        robots.txt and sitemap.xml, built from SITE_URL
src/pages/sitemap.xml.ts
public/admin/                  Decap CMS (index.html + config.yml)
public/hero, public/brand      vectors copied out of Figma
public/services                bento cards and copper-curve backdrops per slide
scripts/build-figma-assets.cjs turns the raw Figma captures in tmp/ into the files above
scripts/extract-grid.cjs       crops the Figma "curve lines" grid behind the services and along the foot of the footer
```

## Editing content

On the live site, open `/admin/`, sign in with GitHub, edit, and Publish. The site rebuilds in about a minute.

Locally, run `npm run dev` and `npm run cms` in two terminals, then open `http://localhost:4321/admin/index.html`. Edits are written straight to the JSON files; commit them as usual.

Editors can change the page copy, footer links, form text, and the service slides (add, remove, reorder with the Position field, swap the card image). Uploaded images go to `public/uploads`.

The hero type (BOLD DESIGN, THAT, PERFORMS), the side notes, the logo rail, and the footer wordmark are the outlined vectors from Figma, so they match the file exactly. Their text in the CMS is what screen readers and search engines read. Changing the artwork itself means replacing the SVG.

There are no testimonials or FAQs because the design has none. Either would be one more folder collection, the same shape as `services`.

## Forms and tracking

Contact us and every Contact button open a dialog.

- Required: name, email, message. Errors show on the field.
- A successful submit replaces the form with a confirmation.
- The server checks the same fields again, drops honeypot hits, and stores the entry.
- Only after a 200 response, the page pushes `{ event: "form_submit", form_id: "contact" }` onto `window.dataLayer`.

The footer newsletter needs a valid email and the consent box. On success it pushes `{ event: "form_submit", form_id: "newsletter" }`.

Where entries go:

- Deployed: one private JSON file per entry in Vercel Blob, under `submissions/<contact|newsletter>/<date>/<id>.json`. Browse them in the Vercel dashboard under Storage. Private blobs are not reachable by URL.
- Local: `data/submissions.json` (gitignored).

Verify tracking in the browser console with `dataLayer.filter((e) => e.event === "form_submit")`. With a GTM container set, use GTM Preview: the `form_submit` custom event appears after a successful submit, and a Custom Event trigger on `form_submit` can fire a GA4 or Ads conversion tag.

## Environment variables

Copy `.env.example` to `.env` for local work. Do not commit `.env`. On Vercel they are set under Project → Settings → Environment Variables.

| Name | Purpose |
| --- | --- |
| `SITE_URL` | Canonical origin, no trailing slash. Falls back to the Vercel production domain. |
| `PUBLIC_GTM_ID` | GTM container id. Optional; loads after idle. The dataLayer event is pushed either way. |
| `BLOB_READ_WRITE_TOKEN` | Set by Vercel when a Blob store is connected. Unset locally. |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth app for CMS sign-in. Callback URL `https://<domain>/api/callback`. |

## Run

```sh
npm install
npm run dev
```

Production build: `npm run build`. The output is in `.vercel/output`.

## Deploy

```sh
npx vercel login
npx vercel link
npx vercel blob create-store upthrust-submissions --access private --yes
npx vercel --prod
```

For the CMS, create a GitHub OAuth app (GitHub → Settings → Developer settings → OAuth Apps) with the callback above, then add its id and secret to the project and redeploy. Connect the GitHub repo in Vercel so CMS commits deploy automatically.

After launch, every change, whether a CMS edit or code, is a commit. Vercel builds a preview for branches and pull requests, and a bad deploy can be rolled back to the previous one from the dashboard.

## Assets

Every picture on the page comes from the Figma file through Copy as SVG / Copy as PNG and the image-fill downloads: the statue, the blueprint, the hero type, the logos, the header logo, the footer wordmark, the four bento cards, the copper curve, and the services grid. The statue is cropped the way the Figma frame crops its fill, and exported at 2× (1092 × 1370). The curve on each slide is cut from the same 4320-wide curve at the offsets used in Figma.

## AI tools

Cursor was used to scaffold the project, pull layers out of Figma, and write the page. Each section was checked against a 2× export of the Figma frame with a pixel diff at 1440, and in the browser at 375 and 768.

## Limits

- The file shows one slide at a time with no controls. The page adds arrows and dots so the four slides can be reached.
- Footer copy such as "add description here" and "Lorem ipsum" is the placeholder text from the file.
- Submissions are stored, not emailed. A notification (Resend or similar) would be the next step.
- `decap-server` (local CMS only, dev dependency) carries audit warnings. Production dependencies audit clean.
