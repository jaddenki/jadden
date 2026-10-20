'use client'

import { motion, useMotionValue } from 'motion/react'
import { type AnchorHTMLAttributes, type MouseEvent, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type HoverPreviewLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
	previewSrc?: string
	previewSrcs?: string[]
	previewAlt?: string
	previewText?: string
	previewWidth?: number
	previewHeight?: number
}

const OFFSET = { x: 8, y: 24 }
const FOLLOW_STRENGTH = 0.02

const HOVER_MEDIA = '(hover: hover) and (pointer: fine)'

export function HoverPreviewLink({
	previewSrc,
	previewSrcs,
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

	useEffect(() => {
		const mq = window.matchMedia(HOVER_MEDIA)
		setHasHoverCapability(mq.matches)
		const handler = () => setHasHoverCapability(mq.matches)
		mq.addEventListener('change', handler)
		return () => mq.removeEventListener('change', handler)
	}, [])

	const x = useMotionValue(0)
	const y = useMotionValue(0)

	const track = useCallback(
		(e: MouseEvent<HTMLAnchorElement>) => {
			if (!hasHoverCapability) return
			const rect = e.currentTarget.getBoundingClientRect()
			const halfW = rect.width / 2
			const halfH = rect.height / 2

			x.set(e.clientX + OFFSET.x + (e.clientX - rect.left - halfW) * FOLLOW_STRENGTH)
			y.set(e.clientY + OFFSET.y + (e.clientY - rect.top - halfH) * FOLLOW_STRENGTH)
		},
		[x, y, hasHoverCapability],
	)

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
					hovered && (
						<motion.div
							className="hover-preview-float"
							style={{
								position: 'fixed',
								...(hasHoverCapability
									? { left: x, top: y }
									: { left: touchPosition.x, top: touchPosition.y }),
								...(previewSrcs
									? { display: 'flex', gap: 2, border: '2px solid var(--bg)', background: 'var(--bg)' }
									: previewSrc
									? { width: previewWidth, height: previewHeight, border: '2px solid var(--bg)', background: 'var(--bg)' }
									: { maxWidth: previewWidth }),
								boxShadow: '2px 2px 4px rgba(0,0,0,0.12)',
								overflow: 'hidden',
								pointerEvents: 'none',
							}}
						>
							{previewSrcs ? (
								previewSrcs.map((src) => (
									<img
										key={src}
										src={src}
										alt={previewAlt}
										width={160}
										height={120}
										loading="eager"
										draggable={false}
										style={{ display: 'block', objectFit: 'cover' }}
									/>
								))
							) : previewSrc ? (
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
					),
					document.body,
				)}
		</>
	)
}
