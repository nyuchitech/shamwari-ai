// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://shamwari.ai',

  // Static output, served by Workers static assets — same reasoning as
  // docs.shamwari.ai: no server runtime, so this repo holds no bindings and
  // no secrets, and the page loads fast on the connections most of the
  // audience actually has.
  output: 'static',
  build: { format: 'directory' },

  vite: { build: { assetsInlineLimit: 4096 } },
});
