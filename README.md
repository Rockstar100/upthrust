# Upthrust Design

A single landing page built from the supplied Figma file. The page is static HTML. The contact form is the only server route.

## Stack

Astro and Tailwind. Astro puts the copy in the HTML, which is what this page needs for speed and SEO. Tailwind is only the base layer. The layout lives in `src/styles/global.css` so the type and grid can follow the frames.

The trade-off against a hosted CMS is that a content edit is a file change and a rebuild. That stays fast, has no secrets, and is easy to show in an interview. A hosted CMS would add a client and another service for one page.

## Structure

```text
src/content/site/home.json     headlines, footer, form copy
src/content/services/*.json    the four service cards
src/components/                header, hero, services, footer, contact dialog
src/pages/index.astro          the page
src/pages/api/submit.ts        form handler
public/images/                 WebP posters rendered from the GLBs
public/models/                 recoloured GLBs, loaded only as an enhancement
```

## Editing content

Change the JSON files above. `npm run dev` refreshes the page. Services are ordered by the `order` field. After launch, the safe update is a commit and a redeploy. The production HTML is built, so a live URL does not change until that rebuild.

Body copy under Strategy and Insight, and the short lines on the service cards, were not legible in the Figma frames. The headlines, the hero lines, the client names, and the service titles are from the file. The display face in the file was not supplied as a font file, so the page uses Archivo 900 italic.

## Form and tracking

Contact us, Contact, and the footer Contact link open a dialog.

- Required: name, email, message. Errors show on the field.
- A successful submit replaces the form with a confirmation.
- The server checks the same fields and appends the entry to `data/submissions.json` (gitignored).
- Only after a 200 response, the page pushes `{ event: "form_submit", form_id: "contact" }` onto `window.dataLayer`.

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

`public/models` comes from the Drive GLBs. The curve was given a copper base colour because the export had no colour. Posters in `public/images` are what the page paints. On a desktop without reduced motion, the hero swaps in `<model-viewer>` after idle. The curve stays an image.

## AI tools

Cursor was used to scaffold the project, read the Figma frames, render the GLBs, and write the page. The layout, copy decisions, and form flow were reviewed in the browser at 375, 768-class, and 1440.

## Limits

- Footer link columns under the wordmark were too small to read, so they are a short editable stand-in.
- Service card images in the file were not in the asset pack. The cards use simple built visuals.
- The live 3D bust is an enhancement. The poster is the image that loads first.
- There is no hosted URL yet. Vercel and Netlify were not logged in on this machine.
