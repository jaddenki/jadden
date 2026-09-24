const SOURCE_FILE = 'data-astro-source-file';
const SOURCE_LOC = 'data-astro-source-loc';

const overlay = document.createElement('div');
overlay.setAttribute('data-astro-grab-ignore', '');
Object.assign(overlay.style, {
	position: 'fixed',
	pointerEvents: 'none',
	zIndex: '2147483647',
	display: 'none',
	border: '2px solid #7c3aed',
	borderRadius: '4px',
	background: 'rgb(124 58 237 / 10%)',
	boxSizing: 'border-box',
});
document.documentElement.append(overlay);

let target: HTMLElement | null = null;

const sourceElement = (element: HTMLElement | null) =>
	element?.closest<HTMLElement>(`[${SOURCE_FILE}][${SOURCE_LOC}]`) ?? null;

const hideOverlay = () => {
	target = null;
	overlay.style.display = 'none';
};

document.addEventListener('pointermove', (event) => {
	const hovered = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
	target = sourceElement(hovered);

	if (!target || target.closest('[data-astro-grab-ignore]')) {
		hideOverlay();
		return;
	}

	const bounds = target.getBoundingClientRect();
	Object.assign(overlay.style, {
		display: 'block',
		left: `${bounds.left}px`,
		top: `${bounds.top}px`,
		width: `${bounds.width}px`,
		height: `${bounds.height}px`,
	});
});

document.addEventListener('mouseleave', hideOverlay);

document.addEventListener('keydown', async (event) => {
	if (!target || event.key.toLowerCase() !== 'c' || (!event.metaKey && !event.ctrlKey)) return;

	const sourceFile = target.getAttribute(SOURCE_FILE);
	const sourceLoc = target.getAttribute(SOURCE_LOC);
	if (!sourceFile || !sourceLoc) return;

	event.preventDefault();
	const element = target.outerHTML.replace(/\sdata-astro-source-(?:file|loc)="[^"]*"/g, '');
	await navigator.clipboard.writeText(`[${element} (at ${sourceFile}:${sourceLoc})]`);

	overlay.style.borderColor = '#16a34a';
	setTimeout(() => {
		overlay.style.borderColor = '#7c3aed';
	}, 180);
});
