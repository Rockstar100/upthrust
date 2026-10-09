# Upthrust Design

A single landing page built from the supplied Figma file (Homepage frame, 1440 × 3331). The page is static HTML. The form handler is the only server route.

## Stack

Astro and Tailwind. Astro puts the copy in the HTML, which is what this page needs for speed and SEO. Tailwind is only the base layer. The layout lives in `src/styles/global.css`.

The desktop layout uses the Figma coordinates directly. Each section is a container, and one Figma pixel is `100cqi / 1440`, so at 1440 every layer sits where it sits in the file and it scales evenly above and below that. Below 768 the hero uses its own 375-wide composition, and the service slides and footer switch to a stacked flow below 1024.

The trade-off against a hosted CMS is that a content edit is a file change and a rebuild. That stays fast and has no secrets. A hosted CMS would add a client and another service for one page.

## Structure

```text
src/content/site/home.json     hero notes, logo names, footer, form copy
src/content/services/*.json    the four service slides
src/components/                header, hero, logo rail, services, footer, contact dialog
src/pages/index.astro          the page
src/pages/api/submit.ts        contact and newsletter handler
public/hero, public/brand      vectors copied out of Figma
public/services                bento cards and copper-curve backdrops per slide
scripts/build-figma-assets.cjs turns the raw Figma captures in tmp/ into the files above
scripts/extract-grid.cjs       crops the Figma "curve lines" grid that sits behind the services
scripts/warp-grid.cjs          draws the grid strip at the foot of the footer
```

## Editing content

Change the JSON files above. `npm run dev` refreshes the page. Services are ordered by the `order` field. After launch, the safe update is a commit and a redeploy.

The hero type (BOLD DESIGN, THAT, PERFORMS), the side notes, the logo rail, and the footer wordmark are the outlined vectors from Figma, so they match the file exactly. Their text is also in the HTML for screen readers and search. The service slides, footer links, and newsletter are live text.

## Forms and tracking

Contact us and every Contact button open a dialog.

- Required: name, email, message. Errors show on the field.
- A successful submit replaces the form with a confirmation.
- The server checks the same fields and appends the entry to `data/submissions.json` (gitignored).
- Only after a 200 response, the page pushes `{ event: "form_submit", form_id: "contact" }` onto `window.dataLayer`.

The footer newsletter needs a valid email and the consent box. On success it pushes `{ event: "form_submit", form_id: "newsletter" }` and stores the email in the same file with `type: "newsletter"`.

Verify in the browser console with `dataLayer.filter((e) => e.event === "form_submit")`, then open `data/submissions.json`.

Set `PUBLIC_GTM_ID` in `.env` if a container should load. It loads after idle. The dataLayer event is pushed even when that id is empty. Copy `.env.example`. Do not commit `.env`.

`SITE_URL` is the canonical origin. No trailing slash.

## Run

```sh
npm install
npm run dev
```

Production:

```sh
npm run build
npm run preview
```

`npm start` runs the Node server from `dist/server/entry.mjs`.

Deploy with the Vercel CLI once it is logged in:

```sh
npx vercel
```

Set `SITE_URL` to the deployed origin and redeploy so the canonical and Open Graph URLs match.

## Assets

Every picture on the page comes from the Figma file through Copy as SVG / Copy as PNG and the image-fill downloads: the statue, the blueprint, the hero type, the logos, the header logo, the footer wordmark, the four bento cards, the copper curve, and the services grid. The statue is cropped the way the Figma frame crops its fill, and exported at 2× (1092 × 1370). The curve on each slide is cut from the same 4320-wide curve at the offsets used in Figma.

## AI tools

Cursor was used to scaffold the project, pull layers out of Figma, and write the page. Each section was checked against a 2× export of the Figma frame with a pixel diff at 1440, and in the browser at 375 and 768.

## Limits

- The grid strip at the foot of the footer is redrawn by `scripts/warp-grid.cjs`. The services grid is the Figma layer.
- The file shows one slide at a time with no controls. The page adds arrows and dots so the four slides can be reached.
- Footer copy such as "add description here" and "Lorem ipsum" is the placeholder text from the file.
- There is no hosted URL yet. Vercel and Netlify were not logged in on this machine.
