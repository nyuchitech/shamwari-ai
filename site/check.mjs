// Post-build checks on dist/. Astro covers types and syntax; these are the
// things it cannot know about. Modelled on docs-site/check.mjs.
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );

const files = walk('dist');
const pages = files.filter((f) => f.endsWith('.html'));
const fail = [];
if (pages.length < 1) fail.push('expected at least 1 built page, found 0');

const assets = new Set(files.map((f) => f.replace(/^dist/, '')));
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(f, 'utf8'));

// The one permitted family of uses: naming the phrase in order to reject it.
const PERMITTED = ['not the same as being open source', 'Say open weights, not open source'];

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const where = page.replace(/^dist\//, '') || 'index.html';
  const baseVars = [
    ...[...html.matchAll(/:root\s*\{([^}]*)\}/g)].map((m) => m[1]),
    ...css.flatMap((c) => [...c.matchAll(/:root\s*\{([^}]*)\}/g)].map((m) => m[1])),
  ].join('');

  // Internal links either point at an in-page anchor, an asset that exists,
  // or an external URL — this is a single page, so there is no route table
  // to check hrefs against.
  for (const [, href] of html.matchAll(/href="(\/[^"#]*)"/g)) {
    if (/\.[a-z0-9]{2,5}$/i.test(href) && !assets.has(href)) {
      fail.push(`${where}: missing asset ${href}`);
    }
  }
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
    if (!new RegExp(`id="${id}"`).test(html)) fail.push(`${where}: dead anchor #${id}`);
  }

  // Language discipline from CLAUDE.md, mirrored from docs-site.
  const flat = html.replace(/\s+/g, ' ');
  for (let i = flat.search(/open[ -]sourc/i); i !== -1; ) {
    const ctx = flat.slice(Math.max(0, i - 90), i + 90);
    if (!PERMITTED.some((ok) => ctx.includes(ok))) {
      fail.push(`${where}: says "open source" outside the rule that forbids it — …${ctx.slice(60, 150)}…`);
    }
    const next = flat.slice(i + 10).search(/open[ -]sourc/i);
    i = next === -1 ? -1 : i + 10 + next;
  }
  // "your data stays in Africa" / national-sovereignty framing is banned for
  // Cloud — sovereignty on this site means user-sovereign, never residency.
  if (/data (stays|remains) in africa/i.test(flat)) {
    fail.push(`${where}: claims data residency, which Cloud cannot promise — see the language table in CLAUDE.md`);
  }

  // A colour defined only inside a prefers-color-scheme or [data-theme]
  // block renders one theme's text on the other theme's ground.
  for (const [, name] of html.matchAll(/var\((--[a-z-]+)/g)) {
    if (!baseVars.includes(name + ':')) fail.push(`${where}: token ${name} has no base :root value`);
  }

  // No client JavaScript: nothing on this page needs it.
  if (/<script(?![^>]*type="application\/ld\+json")/i.test(html)) {
    fail.push(`${where}: ships a <script> tag`);
  }
}

// The audience is assumed to be on a slow connection.
const biggest = Math.max(...pages.map((p) => statSync(p).size));
if (biggest > 51_200) fail.push(`largest page is ${biggest} bytes, over the 50KB budget`);

if (fail.length) {
  console.error('FAIL\n' + [...new Set(fail)].map((f) => '  - ' + f).join('\n'));
  process.exit(1);
}
console.log(
  `ok — ${pages.length} page(s), largest ${biggest} bytes, anchors and assets resolve, ` +
    `tokens have base values, no client JS, language rules held`,
);
