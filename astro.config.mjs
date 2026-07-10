// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.jaddens.page',
	// The site stays static by default; only routes that opt out with
	// `export const prerender = false` (currently just /now) are rendered on
	// demand and cached via ISR, so new Are.na blocks appear without a rebuild.
	adapter: vercel({
		isr: {
			expiration: 60 * 15, // 15 min
		},
	}),
	integrations: [mdx(), react(), sitemap()],
	redirects: {
		'/gradient': '/gradient/index.html',
	},
	build: {
		inlineStylesheets: 'auto',
	},
	prefetch: true,
	image: {
		remotePatterns: [
			{ protocol: 'https', hostname: 'github.com', pathname: '/**' },
			{ protocol: 'https', hostname: 'www.google.com', pathname: '/**' },
			{ protocol: 'https', hostname: 'www.jam.ms', pathname: '/**' },
		],
	},
});
