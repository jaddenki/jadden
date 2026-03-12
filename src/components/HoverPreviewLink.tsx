'use client'

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { type AnchorHTMLAttributes, type MouseEvent, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type HoverPreviewLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
	previewSrc?: string
	previewAlt?: string
	previewText?: string
	previewWidth?: number
	previewHeight?: number
}

const SPRING = { type: 'spring' as const, visualDuration: 0.4, bounce: 0.5 }
const TILT_SPRING = { type: 'spring' as const, visualDuration: 0, bounce: 0.15 }
const OFFSET = { x: 8, y: 24 }
const FOLLOW_STRENGTH = 0.02
const TILT_SENSITIVITY = 0.6
const TILT_MAX_DEG = 5

const HOVER_MEDIA = '(hover: hover) and (pointer: fine)'

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
	const [hasHoverCapability, setHasHoverCapability] = useState(false)
	const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 })
	const prevX = useRef(0)

	const shouldReduceMotion = useReducedMotion()

	useEffect(() => {
		const mq = window.matchMedia(HOVER_MEDIA)
		setHasHoverCapability(mq.matches)
		const handler = () => setHasHoverCapability(mq.matches)
		mq.addEventListener('change', handler)
		return () => mq.removeEventListener('change', handler)
	}, [])

	const x = useMotionValue(0)
	const y = useMotionValue(0)
	const tilt = useMotionValue(0)
	const smoothTilt = useSpring(tilt, TILT_SPRING)

	const track = useCallback(
		(e: MouseEvent<HTMLAnchorElement>) => {
			if (!hasHoverCapability) return
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
		[x, y, tilt, hasHoverCapability],
	)

	const noAnimation = shouldReduceMotion === true

	const existingRel = (anchorProps.rel ?? '').split(/\s+/).filter(Boolean)
	const needsNoopener = anchorProps.target === '_blank'
	const safeRel =
		needsNoopener
			? [...new Set([...existingRel, 'noopener', 'noreferrer'])].join(' ')
			: anchorProps.rel

	return (
		<>
			<a
				{...anchorProps}
				rel={safeRel}
				onMouseEnter={(e) => {
					prevX.current = e.clientX
					if (!hasHoverCapability) {
						setTouchPosition({ x: e.clientX + OFFSET.x, y: e.clientY + OFFSET.y })
					} else {
						track(e)
					}
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

			{typeof document !== 'undefined' &&
				createPortal(
					<AnimatePresence>
						{hovered && (
							<motion.div
								className="hover-preview-float"
								initial={noAnimation ? false : { opacity: 0, scale: 0.87 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={
									noAnimation
										? { opacity: 0, scale: 0.8, transition: { duration: 0 } }
										: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } }
								}
								transition={noAnimation ? { duration: 0 } : SPRING}
								style={{
									position: 'fixed',
									...(hasHoverCapability
										? { left: x, top: y, rotate: smoothTilt }
										: { left: touchPosition.x, top: touchPosition.y, rotate: 0 }),
									...(previewSrc
										? { width: previewWidth, height: previewHeight, border: '2px solid var(--bg)', background: 'var(--bg)' }
										: { maxWidth: previewWidth }),
									transformOrigin: 'top left',
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
										loading="eager"
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
											padding: '0 4px 3px 4px',
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
					</AnimatePresence>,
					document.body,
				)}
		</>
	)
}
