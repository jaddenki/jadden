// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.jaddens.page',
	integrations: [mdx(), react(), sitemap()],
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
	experimental: {
		fonts: [
			{
				provider: fontProviders.local(),
				name: 'GeistPixel',
				cssVariable: '--font-geist-pixel',
				options: {
					variants: [
						{
							weight: 400,
							style: 'normal',
							src: ['./src/assets/fonts/GeistPixel-Square.woff2'],
						},
					],
				},
			},
		],
	},
});
