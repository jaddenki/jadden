// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** @type {Map<string, Array<{ tag: string, location: string }>>} */
const astroSourceLines = new Map();

/** @param {string} sourceFile */
function getAstroSourceLocations(sourceFile) {
	const cachedLocations = astroSourceLines.get(sourceFile);
	if (cachedLocations) return cachedLocations;

	const source = readFileSync(resolve(sourceFile), 'utf8');
	const locations = [];
	for (const match of source.matchAll(/<([a-z][\w:-]*)(?=\s|>|\/)/g)) {
		const line = source.slice(0, match.index).split('\n').length;
		const lineStart = source.lastIndexOf('\n', match.index - 1) + 1;
		locations.push({ tag: match[1], location: `${line}:${match.index - lineStart + 1}` });
	}
	astroSourceLines.set(sourceFile, locations);
	return locations;
}

// https://astro.build/config
export default defineConfig({
	site: 'https://www.jaddens.page',
	vite: {
		plugins: [
			{
				name: 'astro-grab-source-annotations',
				enforce: 'post',
				apply: 'serve',
				transform(code, id) {
					if (!id.includes('.astro') || code.includes('data-astro-source-file')) return;

					const sourceFile = id.split('?')[0].slice(process.cwd().length + 1);
					const locations = getAstroSourceLocations(sourceFile);
					let locationIndex = 0;
					return code.replace(
						/<([a-z][\w:-]*)(\s|>|\/)/g,
						(match, tag, ending) => {
							const location = locations.slice(locationIndex).findIndex((item) => item.tag === tag);
							if (location < 0) return match;
							locationIndex += location + 1;
							return `<${tag} data-astro-source-file=${JSON.stringify(sourceFile)} data-astro-source-loc=${JSON.stringify(locations[locationIndex - 1].location)}${ending}`;
						},
					);
				},
			},
		],
	},
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
	// Prefetch every internal link as soon as it enters the viewport, so
	// navigation serves the next page from memory instead of the network.
	prefetch: {
		prefetchAll: true,
		defaultStrategy: 'viewport',
	},
	image: {
		remotePatterns: [
			{ protocol: 'https', hostname: 'github.com', pathname: '/**' },
			{ protocol: 'https', hostname: 'www.google.com', pathname: '/**' },
			{ protocol: 'https', hostname: 'www.jam.ms', pathname: '/**' },
		],
	},
});
