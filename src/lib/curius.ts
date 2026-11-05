export interface CuriusLink {
	id: number;
	link: string;
	title: string;
	toRead: boolean;
	createdDate: string;
	highlights: string[];
}

interface RawLink {
	id: number;
	link: string;
	title: string;
	toRead: boolean | null;
	createdDate: string;
	highlights?: { highlight: string }[];
}

const PAGE_SIZE = 30;
const BATCH = 6;

async function fetchPage(userId: number, page: number): Promise<RawLink[]> {
	const res = await fetch(`https://curius.app/api/users/${userId}/links?page=${page}`);
	if (!res.ok) return [];
	const { userSaved } = (await res.json()) as { userSaved?: RawLink[] };
	return userSaved ?? [];
}

export async function fetchCuriusLinks(userId: number): Promise<CuriusLink[]> {
	const raw: RawLink[] = [];
	try {
		for (let start = 0; start < 60; start += BATCH) {
			const pages = await Promise.all(
				Array.from({ length: BATCH }, (_, i) => fetchPage(userId, start + i)),
			);
			for (const page of pages) raw.push(...page);
			if (pages.some((page) => page.length < PAGE_SIZE)) break;
		}
	} catch {}

	const seen = new Set<number>();
	return raw
		.filter((item) => !seen.has(item.id) && seen.add(item.id))
		.sort((a, b) => b.createdDate.localeCompare(a.createdDate))
		.map((item) => ({
			id: item.id,
			link: item.link,
			title: item.title,
			toRead: item.toRead === true,
			createdDate: item.createdDate,
			highlights: (item.highlights ?? []).map((h) => h.highlight.trim()).filter(Boolean),
		}));
}
