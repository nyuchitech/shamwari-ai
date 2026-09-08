# shamwari.ai

The public landing page. Astro, static output, served by Cloudflare Workers
static assets — the same shape as `docs-site/`, built independently of it so
a copy edit here never touches a repo that can deploy inference.

```bash
npm install
npm run dev              # astro dev
npm run build             # astro build -> dist/
npm run check             # astro check + node check.mjs (run after a build)
npm run deploy             # astro build && wrangler deploy
```

The custom domains have to be attached to the account before the first
deploy; `wrangler.jsonc` declares `shamwari.ai` and `www.shamwari.ai` as
custom-domain routes.

## Layout

```
src/pages/index.astro       the whole page — one file, no routing
src/layouts/Site.astro      masthead, footer, page shell
src/components/             StatusPill, SovereigntyDiagram
src/styles/tokens.css       the sodalite palette, same values as docs-site
```

## Why one page

There is nothing to launch yet that a second page would meaningfully cover —
see "Deliberately not in this phase" in the root `CLAUDE.md`. When there's a
pricing page, a blog, or a status page worth having, they're new files here,
not a rewrite.

## Why static, and why no client JavaScript

Same reasoning as `docs-site/`: the audience is assumed to be on a slow
connection, and a page arguing that Shamwari is built for exactly that
connection would be undercutting itself if it shipped a framework runtime to
say so. `output: 'static'`, no islands, no hydration.

## check.mjs

Modelled on `docs-site/check.mjs`, adjusted for a single page: internal
anchors resolve, every CSS custom property has a base `:root` value, no page
ships a `<script>` tag, the page stays under the 50KB budget, and the page
never says "open source" or claims Cloud keeps data "in Africa" — both are
language-discipline rules from the root `CLAUDE.md`, and this is the page
most likely to slip on them by accident.

## Keeping this honest

Every status claim on the page (what's live, what's building, what's
planned) has to match the "Current state" table in the root `CLAUDE.md`. If
that table changes, this page is the thing that's now out of date — not the
other way around.
