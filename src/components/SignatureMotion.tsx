'use client'

import { type Easing, motion, type SVGMotionProps, type Variants } from 'motion/react'
import { cn } from '@/lib/utils'

const PATH_DURATIONS = [1, 0.9, 0.7] as const
const PATH_EASINGS: Easing[] = [
	[0.4, 0, 0.2, 1],
	[0.4, 0, 0.6, 1],
	[0.35, 0, 0.25, 1],
]
const PATH_DELAYS = PATH_DURATIONS.reduce<number[]>(
	(acc, _, i) => [...acc, i === 0 ? 0 : acc[i - 1] + PATH_DURATIONS[i - 1]],
	[],
)

const container: Variants = { initial: {}, animate: {} }
const createDrawVariant = (index: number): Variants => ({
	initial: { opacity: 0, pathLength: 0.01 },
	animate: {
		opacity: 1,
		pathLength: 1,
		transition: {
			opacity: { duration: 0.01, delay: PATH_DELAYS[index] },
			pathLength: {
				ease: PATH_EASINGS[index],
				duration: PATH_DURATIONS[index],
				delay: PATH_DELAYS[index],
			},
		},
	},
})

export type SignatureProps = SVGMotionProps<SVGSVGElement>

export const SignatureMotion = ({ className, ...props }: SignatureProps) => (
	<motion.svg
		width="75"
		height="44"
		viewBox="0 0 388 227"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		className={cn(
			'h-auto w-full overflow-hidden drop-shadow-md',
			typeof className === 'string' ? className : undefined,
		)}
		variants={container}
		initial="initial"
		animate="animate"
		{...props}
	>
		<motion.path
			d="M93.2464 111.045C86.801 108.896 70.1031 103.98 52.0743 95.5777C40.5616 90.2124 27.0333 77.4367 18.5398 69.8609C7.07928 59.6389 4.32683 53.4198 2.85123 48.6153C1.14835 43.0707 5.66077 33.1982 16.0342 21.0245C21.9393 14.0947 33.8093 10.4091 46.2427 11.1144C58.6761 11.8197 72.5054 18.2474 81.6748 26.2334C90.8442 34.2193 94.9345 43.5687 99.379 55.7867C103.824 68.0046 108.498 82.8078 111.88 97.3484C115.262 111.889 117.21 125.718 117.629 141.023C118.048 156.328 116.88 172.69 114.427 185.111C111.975 197.533 108.274 205.519 101.011 211.97C93.7481 218.421 83.0353 223.096 72.9392 223.849C62.8432 224.601 53.6886 221.29 49.5569 212.28C45.4252 203.27 46.5939 188.661 51.6758 174.416C56.7578 160.171 65.7176 146.731 77.248 135.814C88.7783 124.898 115.262 111.379 128.911 105.999"
			stroke="currentColor"
			strokeWidth="5"
			strokeLinecap="round"
			variants={createDrawVariant(0)}
		/>
		<motion.path
			d="M107.911 30.9994C118.492 26.9303 122.053 17.9994 125.668 10.9994C129.322 3.92429 128.491 16.5073 131.911 44.4994C135.332 72.4915 134.672 118.964 137.783 149.084C141.451 184.605 140.309 193.978 138.84 201.143C136.166 214.176 128.711 220.167 125.668 222.723C124.299 223.873 122.82 224.11 121.534 223.336C118.392 221.449 117.485 215.297 116.992 204.047C116.644 196.116 117.083 183.643 122.053 159.106C127.023 134.57 136.762 98.3413 144.214 75.0032C151.665 51.6652 156.535 42.3158 161.283 34.4803C169.919 20.2304 179.218 11.2692 187.168 5.96291C193.902 1.46877 201.069 1.98469 206.664 3.94134C212.442 5.96176 216.226 14.5332 220.057 24.9303C224.175 36.109 224.507 48.9501 224.61 60.926C224.704 71.8061 218.389 89.4606 208.911 96.9994C192.201 110.29 161.783 103.499 154.911 97.9994"
			stroke="currentColor"
			strokeWidth="5"
			strokeLinecap="round"
			variants={createDrawVariant(1)}
		/>
		<motion.path
			d="M166.411 117.499C166.995 123.148 167.58 128.797 173.724 129.759C191.577 132.554 206.518 122.812 212.113 123.591C217.124 125.928 224.402 129.092 256.614 132.524C283.957 134.398 333.626 136.541 384.8 138.748"
			stroke="currentColor"
			strokeWidth="5"
			strokeLinecap="round"
			variants={createDrawVariant(2)}
		/>
	</motion.svg>
)
