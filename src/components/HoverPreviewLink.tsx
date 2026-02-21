'use client'

import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { type AnchorHTMLAttributes, type MouseEvent, useCallback, useRef, useState } from 'react'

type HoverPreviewLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
	previewSrc?: string
	previewAlt?: string
	previewText?: string
	previewWidth?: number
	previewHeight?: number
}

const SPRING = { type: 'spring' as const, visualDuration: 0.5, bounce: 0.5 }
const TILT_SPRING = { type: 'spring' as const, visualDuration: 0, bounce: 0.25 }
const OFFSET = { x: 8, y: 24 }
const FOLLOW_STRENGTH = 0.02
const TILT_SENSITIVITY = 1.5
const TILT_MAX_DEG = 14

export function HoverPreviewLink({
	previewSrc,
	previewAlt = '',
	previewText,
	previewWidth = 200,
	previewHeight = 120,
	children,
	onMouseEnter,
	onMouseLeave,
	onMouseMove,
	...anchorProps
}: HoverPreviewLinkProps) {
	const [hovered, setHovered] = useState(false)
	const prevX = useRef(0)

	const x = useMotionValue(0)
	const y = useMotionValue(0)
	const tilt = useMotionValue(0)
	const smoothTilt = useSpring(tilt, TILT_SPRING)

	const track = useCallback(
		(e: MouseEvent<HTMLAnchorElement>) => {
			const rect = e.currentTarget.getBoundingClientRect()
			const halfW = rect.width / 2
			const halfH = rect.height / 2

			const deltaX = e.clientX - prevX.current
			prevX.current = e.clientX

			const tiltDeg = Math.max(-TILT_MAX_DEG, Math.min(TILT_MAX_DEG, deltaX * TILT_SENSITIVITY))
			tilt.set(tiltDeg)

			x.set(e.clientX + OFFSET.x + (e.clientX - rect.left - halfW) * FOLLOW_STRENGTH)
			y.set(e.clientY + OFFSET.y + (e.clientY - rect.top - halfH) * FOLLOW_STRENGTH)
		},
		[x, y, tilt],
	)

	return (
		<>
			<a
				{...anchorProps}
				onMouseEnter={(e) => {
					prevX.current = e.clientX
					track(e)
					setHovered(true)
					onMouseEnter?.(e)
				}}
				onMouseLeave={(e) => {
					setHovered(false)
					tilt.set(0)
					onMouseLeave?.(e)
				}}
				onMouseMove={(e) => {
					track(e)
					onMouseMove?.(e)
				}}
			>
				{children}
			</a>

			<AnimatePresence>
				{hovered && (
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ ...SPRING, opacity: { duration: 0.1 } }}
						style={{
							position: 'fixed',
							left: x,
							top: y,
							zIndex: 90,
							...(previewSrc
								? { width: previewWidth, height: previewHeight, border: '2px solid var(--bg)', background: 'var(--bg)' }
								: { maxWidth: previewWidth }),
							transformOrigin: 'top left',
							rotate: smoothTilt,
							boxShadow: '2px 2px 4px rgba(0,0,0,0.12)',
							overflow: 'hidden',
							pointerEvents: 'none',
						}}
					>
						{previewSrc ? (
							<img
								src={previewSrc}
								alt={previewAlt}
								width={previewWidth}
								height={previewHeight}
								loading="lazy"
								draggable={false}
								style={{
									width: '100%',
									height: '100%',
									objectFit: 'cover',
									display: 'block',
								}}
							/>
						) : previewText ? (
							<span
								style={{
									display: 'block',
									padding: '0px 4px',
									background: 'var(--text)',
									color: 'var(--bg)',
									whiteSpace: 'pre-wrap',
								}}
							>
								{previewText}
							</span>
						) : null}
					</motion.div>
				)}
			</AnimatePresence>
		</>
	)
}
