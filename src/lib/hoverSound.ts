const DEFAULTS = {
	selector: 'a[href], button:not([disabled]), [role="button"]',
	src: '/audio/magnetic-button-08.wav',
	volume: 0.1,
	pitch: 0.2,
	pitchVariation: 0.3,
	cooldownMs: 45,
}

export {}

type HoverSoundConfig = Partial<typeof DEFAULTS>

declare global {
	interface Window {
		hoverSound?: {
			configure: (config: HoverSoundConfig) => void
			mute: (muted?: boolean) => void
			play: (element?: HTMLElement | null) => void
		}
	}
}

const config = { ...DEFAULTS }
const buffers = new Map<string, Promise<AudioBuffer>>()
let context: AudioContext | null = null
let muted = false
let lastPlayedAt = 0

const getContext = () => {
	context ??= new AudioContext()
	return context
}

const loadBuffer = (src: string) => {
	const cached = buffers.get(src)
	if (cached) return cached

	const pending = fetch(src)
		.then((response) => {
			if (!response.ok) throw new Error(`Unable to load hover sound: ${response.status}`)
			return response.arrayBuffer()
		})
		.then((data) => getContext().decodeAudioData(data))

	buffers.set(src, pending)
	return pending
}

const numberFrom = (value: string | undefined, fallback: number) => {
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : fallback
}

const play = async (element?: HTMLElement | null) => {
	if (muted || element?.dataset.hoverSound === 'off') return

	const now = performance.now()
	const cooldownMs = Math.max(0, numberFrom(element?.dataset.hoverSoundCooldown, config.cooldownMs))
	if (now - lastPlayedAt < cooldownMs) return
	lastPlayedAt = now

	const audioContext = getContext()
	if (audioContext.state !== 'running') return

	try {
		const src = element?.dataset.hoverSoundSrc || config.src
		const volume = Math.max(0, numberFrom(element?.dataset.hoverSoundVolume, config.volume))
		const pitch = Math.max(0.01, numberFrom(element?.dataset.hoverSoundPitch, config.pitch))
		const variation = Math.max(0, numberFrom(element?.dataset.hoverSoundPitchVariation, config.pitchVariation))
		const cents = (Math.random() * 2 - 1) * variation * 1200
		const source = audioContext.createBufferSource()
		const gain = audioContext.createGain()

		source.buffer = await loadBuffer(src)
		source.detune.value = Math.log2(pitch) * 1200 + cents
		gain.gain.value = volume
		source.connect(gain).connect(audioContext.destination)
		source.start()
	} catch (error) {
		console.warn(error)
	}
}

const armAudio = () => {
	const audioContext = getContext()
	void audioContext.resume().then(() => loadBuffer(config.src)).catch(() => {})
}

window.hoverSound = {
	configure(nextConfig: HoverSoundConfig) {
		Object.assign(config, nextConfig)
	},
	mute(nextMuted: boolean = true) {
		muted = nextMuted
	},
	play,
}

document.addEventListener('pointerover', (event) => {
	if (event.pointerType === 'touch' || !(event.target instanceof Element)) return

	const target = event.target.closest<HTMLElement>(config.selector)
	if (!target || target.contains(event.relatedTarget as Node | null)) return
	void play(target)
})

document.addEventListener('pointerdown', armAudio, { once: true, capture: true })
document.addEventListener('keydown', armAudio, { once: true, capture: true })

if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
	void loadBuffer(config.src).catch(() => {})
}
