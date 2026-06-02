"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface CharDef {
  color: string
  w: number
  h: number
  eyeY: number
  eyeSpacing: number
  isPeeker?: boolean
}

interface Props {
  passwordVisible: boolean
  focusField: "none" | "account" | "password"
}

const CHARS: CharDef[] = [
  { color: "#FF6B4A", w: 90, h: 100, eyeY: 30, eyeSpacing: 16 },
  { color: "#6C5CE7", w: 80, h: 135, eyeY: 34, eyeSpacing: 17, isPeeker: true },
  { color: "#2D3436", w: 78, h: 115, eyeY: 28, eyeSpacing: 14 },
  { color: "#FDCB6E", w: 70, h: 88,  eyeY: 26, eyeSpacing: 12 },
]

const EYE_R = 6
const PUPIL_R = 3
const MAX_PUPIL = 3

// ─── Single Character ───────────────────────────────────────────────────────

function Char({
  c,
  px, py,
  closed,
  tiltAngle,
  stretchAmount,
}: {
  c: CharDef
  px: number
  py: number
  closed: boolean
  tiltAngle: number
  stretchAmount: number
}) {
  const { color, w, h, eyeY, eyeSpacing } = c
  const cx = w / 2
  const totalH = h + stretchAmount

  // Body path: head stays the same shape, body elongates below
  // Head region: top ~40% stays constant
  // Body region: bottom ~60% stretches
  const headH = h * 0.42
  const bodyBottom = totalH

  const bodyPath = `
    M ${cx} 0
    C ${w * 0.85} 0, ${w} ${headH * 0.85}, ${w} ${headH}
    L ${w} ${bodyBottom * 0.55}
    L ${w * 0.95} ${bodyBottom}
    L ${w * 0.05} ${bodyBottom}
    L 0 ${bodyBottom * 0.55}
    L 0 ${headH}
    C 0 ${headH * 0.85}, ${w * 0.15} 0, ${cx} 0
    Z
  `

  // Eyes stay in the head region (not affected by stretch)
  const eyesY = eyeY

  return (
    <svg
      width={w}
      height={totalH}
      viewBox={`0 0 ${w} ${totalH}`}
      style={{
        transition: "height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        overflow: "visible",
      }}
    >
      {/* Body (tilts as a whole) */}
      <g
        style={{
          transform: `rotate(${tiltAngle}deg)`,
          transformOrigin: `${cx}px ${totalH}px`,
          transition: "transform 0.3s ease-out",
        }}
      >
        {/* Main body shape */}
        <path d={bodyPath} fill={color} />

        {/* Inner highlight — stays in head region */}
        <path
          d={`
            M ${cx - w * 0.15} ${headH * 0.3}
            C ${cx - w * 0.2} ${headH * 0.05}, ${cx} ${headH * 0.02}, ${cx + w * 0.1} ${headH * 0.2}
          `}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={w * 0.07}
          strokeLinecap="round"
        />

        {/* Belly shadow — moves down as body stretches */}
        <ellipse
          cx={cx}
          cy={headH + (bodyBottom - headH) * 0.4}
          rx={w * 0.18}
          ry={(bodyBottom - headH) * 0.15}
          fill="rgba(0,0,0,0.06)"
        />

        {/* Eyes — fixed in head region */}
        {closed ? (
          <>
            <path
              d={`M ${cx - eyeSpacing - 5} ${eyesY} Q ${cx - eyeSpacing} ${eyesY + 5} ${cx - eyeSpacing + 5} ${eyesY}`}
              stroke="#1A1A2E"
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={`M ${cx + eyeSpacing - 5} ${eyesY} Q ${cx + eyeSpacing} ${eyesY + 5} ${cx + eyeSpacing + 5} ${eyesY}`}
              stroke="#1A1A2E"
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : (
          <>
            <circle cx={cx - eyeSpacing} cy={eyesY} r={EYE_R} fill="white" />
            <circle cx={cx - eyeSpacing + px} cy={eyesY + py} r={PUPIL_R} fill="#1A1A2E" />
            <circle cx={cx - eyeSpacing + px * 0.3 - 1} cy={eyesY + py * 0.3 - 1.5} r={1.2} fill="white" />

            <circle cx={cx + eyeSpacing} cy={eyesY} r={EYE_R} fill="white" />
            <circle cx={cx + eyeSpacing + px} cy={eyesY + py} r={PUPIL_R} fill="#1A1A2E" />
            <circle cx={cx + eyeSpacing + px * 0.3 - 1} cy={eyesY + py * 0.3 - 1.5} r={1.2} fill="white" />
          </>
        )}

        {/* Mouth */}
        <path
          d={`M ${cx - 4} ${eyesY + 24} Q ${cx} ${eyesY + 30} ${cx + 4} ${eyesY + 24}`}
          stroke="rgba(0,0,0,0.2)"
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function LoginCharacters({
  passwordVisible,
  focusField,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [target, setTarget] = useState({ x: 0, y: 0 })
  const [eye, setEye] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    setTarget({
      x: Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width / 2))),
      y: Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height / 2))),
    })
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [handleMouseMove])

  useEffect(() => {
    let raf: number
    const tick = () => {
      setEye((p) => ({
        x: p.x + (target.x - p.x) * 0.12,
        y: p.y + (target.y - p.y) * 0.12,
      }))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])

  const closed = passwordVisible
  const peekAmount = (!closed && focusField === "account") ? 50 : 0

  // Layout: blue character at the back (z-index: 1)
  const layout = [
    { xOffset: -65, zIndex: 3, bottom: 0 },
    { xOffset: -15, zIndex: 1, bottom: 0 },
    { xOffset: 32,  zIndex: 2, bottom: 0 },
    { xOffset: 75,  zIndex: 4, bottom: 0 },
  ]

  return (
    <div
      ref={containerRef}
      className="relative w-full flex items-end justify-center"
      style={{ minHeight: "220px", paddingTop: "60px" }}
    >
      {/* Ground line */}
      <div
        className="absolute rounded-full"
        style={{
          bottom: 0,
          width: 300,
          height: 2,
          background: "rgba(255,255,255,0.2)",
        }}
      />

      {/* Characters */}
      {CHARS.map((c, i) => {
        const l = layout[i]
        const isPeeking = c.isPeeker && focusField === "account" && !closed
        const stretch = isPeeking ? peekAmount : 0

        return (
          <div
            key={i}
            className="absolute flex items-end"
            style={{
              left: `calc(50% + ${l.xOffset}px)`,
              bottom: `${l.bottom}px`,
              zIndex: l.zIndex,
            }}
          >
            <Char
              c={c}
              px={closed ? 0 : eye.x * MAX_PUPIL}
              py={closed ? 0 : eye.y * MAX_PUPIL}
              closed={closed}
              tiltAngle={eye.x * 8}
              stretchAmount={stretch}
            />
          </div>
        )
      })}

      {/* Hint */}
      <div
        className="absolute text-xs pointer-events-none text-white/40"
        style={{
          bottom: -18,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: !closed && focusField === "account" ? 1 : 0,
          transition: "opacity 0.4s",
        }}
      >
        让我看看～
      </div>
      <div
        className="absolute text-xs pointer-events-none text-white/40"
        style={{
          bottom: -18,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: closed ? 1 : 0,
          transition: "opacity 0.4s",
        }}
      >
        我们不看！
      </div>
    </div>
  )
}
