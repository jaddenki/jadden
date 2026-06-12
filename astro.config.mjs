// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.jaddens.page',
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
		],
	},
});
