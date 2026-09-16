// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://urbackend.bitbros.in',
  integrations: [
    react(),
    sitemap({
      filter: (page) => page === 'https://urbackend.bitbros.in/',
    }),
  ],
  adapter: vercel()
});
