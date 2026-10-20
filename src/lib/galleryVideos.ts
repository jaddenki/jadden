export {};

type Connection = EventTarget & { saveData?: boolean };
const connection = (navigator as Navigator & { connection?: Connection }).connection;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktop = window.matchMedia('(min-width: 769px)');
const allowAutoplay = () => !reducedMotion.matches && !connection?.saveData;

for (const gallery of document.querySelectorAll<HTMLElement>('.projects-gallery')) {
	const videos = [...gallery.querySelectorAll<HTMLVideoElement>('video[data-src]')];
	if (!videos.length) continue;

	let pageHidden = false;
	const states = new Map(videos.map((video) => [video, {
		nearby: false,
		visible: false,
		manual: null as 'play' | 'pause' | null,
	}]));

	const shouldPlay = (video: HTMLVideoElement) => {
		const state = states.get(video)!;
		return state.visible && !document.hidden && !pageHidden &&
			state.manual !== 'pause' && (state.manual === 'play' || allowAutoplay());
	};

	const load = (video: HTMLVideoElement) => {
		if (video.hasAttribute('src')) return;
		video.muted = true;
		video.preload = 'metadata';
		video.src = video.dataset.src!;
		video.load();
	};

	const updateControl = (video: HTMLVideoElement) => {
		const tile = video.closest<HTMLElement>('.gallery-video-tile')!;
		const action = video.paused ? 'Play' : 'Pause';
		tile.dataset.playing = String(!video.paused);
		if (tile instanceof HTMLButtonElement) {
			tile.setAttribute('aria-label', `${action} ${tile.dataset.videoLabel}`);
			const label = tile.querySelector('.gallery-video-action');
			if (label) label.textContent = action;
		}
	};

	const sync = (video: HTMLVideoElement) => {
		const state = states.get(video)!;
		if (shouldPlay(video)) {
			load(video);
			if (video.paused) void video.play().catch(() => updateControl(video));
		} else {
			video.pause();
			if (state.nearby && allowAutoplay() && !document.hidden && !pageHidden) load(video);
		}
	};

	for (const video of videos) {
		const tile = video.closest<HTMLElement>('.gallery-video-tile')!;
		video.addEventListener('playing', () => {
			// A pending play request may finish after scrolling away or hiding the tab.
			if (!shouldPlay(video)) video.pause();
			else tile.dataset.hasPlayed = 'true';
			updateControl(video);
		});
		video.addEventListener('pause', () => updateControl(video));
		video.addEventListener('error', () => {
			video.pause();
			delete tile.dataset.hasPlayed;
			updateControl(video);
		});
		if (tile instanceof HTMLButtonElement) {
			tile.addEventListener('click', () => {
				const state = states.get(video)!;
				state.manual = video.paused ? 'play' : 'pause';
				sync(video);
			});
		}
	}

	// Viewport-rooted playback observes both the page viewport and the gallery's
	// scroll clipping. Never play an offscreen tile just because it is preloaded.
	const playbackObserver = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			const video = entry.target as HTMLVideoElement;
			states.get(video)!.visible = entry.isIntersecting && entry.intersectionRatio >= 0.1;
			sync(video);
		}
	}, { threshold: [0, 0.1] });
	for (const video of videos) playbackObserver.observe(video);

	let preloadObserver: IntersectionObserver;
	const observeNearby = () => {
		preloadObserver?.disconnect();
		for (const state of states.values()) state.nearby = false;
		// Desktop scrolls inside the fixed gallery; mobile scrolls the document.
		preloadObserver = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				const video = entry.target as HTMLVideoElement;
				states.get(video)!.nearby = entry.isIntersecting;
				sync(video);
			}
		}, { root: desktop.matches ? gallery : null, rootMargin: '300px 0px' });
		for (const video of videos) preloadObserver.observe(video);
	};
	observeNearby();
	desktop.addEventListener('change', observeNearby);

	const syncAll = () => videos.forEach(sync);
	const onPreferenceChange = () => {
		for (const state of states.values()) if (state.manual === 'play') state.manual = null;
		syncAll();
	};
	reducedMotion.addEventListener('change', onPreferenceChange);
	connection?.addEventListener('change', onPreferenceChange);
	document.addEventListener('visibilitychange', syncAll);
	window.addEventListener('pagehide', () => { pageHidden = true; syncAll(); });
	window.addEventListener('pageshow', () => { pageHidden = false; syncAll(); });
}
