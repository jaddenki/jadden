// Fetches a public Are.na channel and maps its blocks into a flat, render-ready
// list of "liking" entries. Public channels need no auth.

export type ArenaBlockClass = "Text" | "Link" | "Image" | "Attachment";

export interface LikingEntry {
	id: string;
	date: string; // ISO string, formatted at render time
	kind: ArenaBlockClass;
	content: string; // one-liner (Text) or title (Link/Image/Attachment)
	url?: string; // for Link / Attachment
	imageUrl?: string; // for Image, or Link-with-image
	isFavicon?: boolean; // when imageUrl is a favicon (Link entries)
}

// A hand-authored entry from src/data/liking-seed.json. Use this to seed the
// list with things from before the Are.na channel existed — Are.na can't
// backdate `connected_at`, so anything older than the channel goes here.
export interface SeedEntry {
	date: string; // ISO or YYYY-MM-DD (e.g. "2026-05-12")
	kind?: ArenaBlockClass; // defaults to "Text"
	content?: string;
	url?: string;
	imageUrl?: string;
}

// Minimal shape of the Are.na v2 block fields we actually read.
interface ArenaImage {
	display?: { url?: string };
	thumb?: { url?: string };
	original?: { url?: string };
}

interface ArenaBlock {
	id: number | string;
	class: string;
	content?: string | null;
	title?: string | null;
	generated_title?: string | null;
	description?: string | null;
	connected_at?: string | null;
	created_at?: string | null;
	source?: { url?: string } | null;
	attachment?: { url?: string } | null;
	image?: ArenaImage | null;
}

interface ArenaContentsResponse {
	contents?: ArenaBlock[];
}

const KNOWN_CLASSES: ArenaBlockClass[] = ["Text", "Link", "Image", "Attachment"];

function firstNonEmpty(...values: Array<string | null | undefined>): string {
	for (const v of values) {
		if (v && v.trim().length > 0) return v.trim();
	}
	return "";
}

// Build a favicon URL for a link's host, using the same Google favicon service
// the rest of the site uses. Returns "" if the URL can't be parsed.
function faviconFor(url: string): string {
	try {
		const { hostname } = new URL(url);
		return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
	} catch {
		return "";
	}
}

function mapBlock(block: ArenaBlock): LikingEntry | null {
	const kind = block.class as ArenaBlockClass;
	if (!KNOWN_CLASSES.includes(kind)) return null;

	const date = firstNonEmpty(block.connected_at, block.created_at);
	if (!date) return null;

	const imageUrl = firstNonEmpty(
		block.image?.display?.url,
		block.image?.thumb?.url,
		block.image?.original?.url,
	);

	const entry: LikingEntry = {
		id: String(block.id),
		date,
		kind,
		content: "",
	};

	switch (kind) {
		case "Text": {
			entry.content = firstNonEmpty(block.content);
			break;
		}
		case "Link": {
			entry.content = firstNonEmpty(
				block.title,
				block.generated_title,
				block.source?.url,
			);
			entry.url = firstNonEmpty(block.source?.url) || undefined;
			// Show the linked site's favicon as the thumbnail.
			const favicon = entry.url ? faviconFor(entry.url) : "";
			if (favicon) {
				entry.imageUrl = favicon;
				entry.isFavicon = true;
			}
			break;
		}
		case "Attachment": {
			// Treated like a Link: title + link to the attachment.
			entry.content = firstNonEmpty(block.title, block.generated_title);
			entry.url = firstNonEmpty(block.attachment?.url) || undefined;
			if (imageUrl) entry.imageUrl = imageUrl;
			break;
		}
		case "Image": {
			entry.content = firstNonEmpty(block.title, block.description);
			if (imageUrl) entry.imageUrl = imageUrl;
			break;
		}
	}

	// Skip anything we couldn't render meaningfully.
	if (!entry.content && !entry.imageUrl) return null;

	return entry;
}

/**
 * Turn hand-authored seed entries into LikingEntry objects so they can be
 * merged with the Are.na feed. Skips anything with no date or no content.
 */
export function normalizeSeedEntries(seed: SeedEntry[]): LikingEntry[] {
	return seed
		.filter((s) => s.date && (s.content || s.imageUrl))
		.map((s, i) => ({
			id: `seed-${s.date}-${i}`,
			date: s.date,
			kind: s.kind ?? "Text",
			content: s.content ?? "",
			url: s.url,
			imageUrl: s.imageUrl,
		}));
}

/**
 * Merge the Are.na feed with any local seed entries and return the combined
 * list sorted reverse-chronologically (newest first).
 */
export function mergeAndSort(
	arenaEntries: LikingEntry[],
	seed: SeedEntry[] = [],
): LikingEntry[] {
	return [...arenaEntries, ...normalizeSeedEntries(seed)].sort((a, b) =>
		b.date.localeCompare(a.date),
	);
}

/**
 * Fetch the given public Are.na channel and return its blocks as a
 * reverse-chronological list of LikingEntry. Never throws: on any failure it
 * returns an empty array so the route keeps rendering (and ISR keeps serving
 * the last good version).
 */
export async function fetchLikingEntries(
	slug: string,
	per = 25,
): Promise<LikingEntry[]> {
	try {
		const res = await fetch(
			`https://api.are.na/v2/channels/${encodeURIComponent(slug)}/contents?page=1&per=${per}`,
			{ headers: { Accept: "application/json" } },
		);
		if (!res.ok) return [];

		const data = (await res.json()) as ArenaContentsResponse;
		const entries = (data.contents ?? [])
			.map(mapBlock)
			.filter((e): e is LikingEntry => e !== null);

		// Reverse-chronological by date (newest first).
		entries.sort((a, b) => b.date.localeCompare(a.date));
		return entries;
	} catch {
		return [];
	}
}
