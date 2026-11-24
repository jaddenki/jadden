// Day-by-day log from a public Are.na channel. No auth. Never throws: an empty
// channel or a failed request becomes an empty list so the static build still
// succeeds.

export interface LogEntry {
	id: string;
	loggedAt: string;
	text: string;
	imageUrl?: string;
	href?: string;
}

interface ArenaImageFile {
	url?: string;
}

interface ArenaBlock {
	id: number | string;
	class?: string;
	content?: string | null;
	content_html?: string | null;
	title?: string | null;
	generated_title?: string | null;
	description?: string | null;
	connected_at?: string | null;
	created_at?: string | null;
	source?: { url?: string | null } | null;
	attachment?: { url?: string | null } | null;
	image?: {
		display?: ArenaImageFile;
		large?: ArenaImageFile;
		original?: ArenaImageFile;
		thumb?: ArenaImageFile;
	} | null;
}

interface ArenaContentsResponse {
	contents?: ArenaBlock[];
}

const PER_PAGE = 100;
const MAX_PAGES = 25;

function firstNonEmpty(...values: Array<string | null | undefined>): string {
	for (const value of values) {
		if (value && value.trim()) return value.trim();
	}
	return "";
}

function textFromHtml(value: string): string {
	return value
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/p>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function imageUrlFor(block: ArenaBlock): string {
	if (block.class !== "Image") return "";
	return firstNonEmpty(
		block.image?.display?.url,
		block.image?.large?.url,
		block.image?.original?.url,
		block.image?.thumb?.url,
	);
}

function textFor(block: ArenaBlock): string {
	const fromHtml = block.content_html ? textFromHtml(block.content_html) : "";
	const title = firstNonEmpty(block.title);
	const generated = firstNonEmpty(block.generated_title);
	const usableGenerated = generated && generated !== "Untitled" ? generated : "";
	const description = firstNonEmpty(block.description);

	if (block.class === "Text") return firstNonEmpty(block.content, fromHtml);
	if (block.class === "Image") return firstNonEmpty(title, description, usableGenerated);
	return firstNonEmpty(title, usableGenerated, block.content, fromHtml, description);
}

function toLogEntry(block: ArenaBlock): LogEntry | null {
	// connected_at is when the block was logged on the channel; created_at is
	// the fallback for blocks that don't carry a connection time.
	const loggedAt = firstNonEmpty(block.connected_at, block.created_at);
	if (!loggedAt || Number.isNaN(Date.parse(loggedAt))) return null;

	const text = textFor(block);
	const imageUrl = imageUrlFor(block);
	if (!text && !imageUrl) return null;

	const href =
		block.class === "Link"
			? firstNonEmpty(block.source?.url) || undefined
			: block.class === "Attachment"
				? firstNonEmpty(block.attachment?.url) || undefined
				: undefined;

	return {
		id: String(block.id),
		loggedAt,
		text,
		imageUrl: imageUrl || undefined,
		href,
	};
}

async function fetchContentsPage(slug: string, page: number): Promise<ArenaBlock[] | null> {
	const url = `https://api.are.na/v2/channels/${encodeURIComponent(slug)}/contents?page=${page}&per=${PER_PAGE}`;
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const res = await fetch(url, {
				headers: { Accept: "application/json" },
				signal: AbortSignal.timeout(12_000),
			});
			if (res.ok) {
				const data = (await res.json()) as ArenaContentsResponse;
				return Array.isArray(data.contents) ? data.contents : [];
			}
			if (res.status !== 429 && res.status < 500) return null;
		} catch {
			// Network, timeout, or a bad payload. Try again, then give up.
		}
		await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
	}
	return null;
}

// Returns null when Are.na fails, so ISR keeps the last good page.
export async function fetchLogEntries(slug: string): Promise<LogEntry[] | null> {
	try {
		const blocks: ArenaBlock[] = [];
		const seen = new Set<string>();

		for (let page = 1; page <= MAX_PAGES; page++) {
			const contents = await fetchContentsPage(slug, page);
			if (!contents) {
				if (page === 1) {
					console.warn(`[log] Are.na channel "${slug}" didn't load.`);
					return null;
				}
				console.warn(`[log] Stopped after page ${page - 1} of Are.na channel "${slug}".`);
				break;
			}
			if (contents.length === 0) break;

			let fresh = 0;
			for (const block of contents) {
				const id = String(block.id);
				if (seen.has(id)) continue;
				seen.add(id);
				fresh++;
				blocks.push(block);
			}
			if (fresh === 0 || contents.length < PER_PAGE) break;
		}

		return blocks
			.map(toLogEntry)
			.filter((entry): entry is LogEntry => entry !== null)
			.sort((a, b) => Date.parse(b.loggedAt) - Date.parse(a.loggedAt));
	} catch (error) {
		console.warn(`[log] Are.na channel "${slug}" didn't load.`, error);
		return null;
	}
}
