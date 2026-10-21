import { getCollection, type CollectionEntry } from "astro:content";

export type BlogPost = CollectionEntry<"blog">;

export async function getEntries(): Promise<BlogPost[]> {
	const entries = await getCollection("blog", ({ data }) => !data.draft);
	return entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// Pages are living lists (coursework, recommendations) kept out of the post feed.
export async function getPosts(): Promise<BlogPost[]> {
	return (await getEntries()).filter((entry) => !entry.data.page);
}

export async function getPages(): Promise<BlogPost[]> {
	return (await getEntries()).filter((entry) => entry.data.page);
}

// Matches the homepage project list ("10 2026").
export function formatIndexDate(date: Date): string {
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	return `${month} ${date.getUTCFullYear()}`;
}

export function formatPostDate(date: Date): string {
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
}

export interface IndexEntry {
	id: string;
	title: string;
	date?: Date;
}

// Lists rendered by their own routes (src/pages/blog/*.astro) instead of markdown.
export const COMPONENT_PAGES: IndexEntry[] = [
	{ id: "uses", title: "Uses" },
	{ id: "liking", title: "Liking" },
];

export function toIndexEntry(entry: BlogPost): IndexEntry {
	return { id: entry.id, title: entry.data.title, date: entry.data.date };
}

export async function getIndex(): Promise<{ posts: IndexEntry[]; lists: IndexEntry[] }> {
	const posts = (await getPosts()).map(toIndexEntry);
	const lists = [...(await getPages()).map(toIndexEntry), ...COMPONENT_PAGES];
	return { posts, lists };
}
