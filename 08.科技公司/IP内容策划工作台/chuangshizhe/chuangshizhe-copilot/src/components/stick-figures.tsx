"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface FigureData {
  color: string
  w: number
  h: number
  vb: string
  body: string
  hair: string
  eyeL: { cx: number; cy: number; r: number; pr: number; hr: number }
  eyeR: { cx: number; cy: number; r: number; pr: number; hr: number }
  mouth: string
  shadow: { cx: number; cy: number; rx: number; ry: number }
}

const FIGURE_DATA: FigureData[] = [
  {
    color: "#FF6B4A", w: 90, h: 100, vb: "0 0 90 100",
    body: "M 45 0 C 76.5 0, 90 35.7, 90 42 L 90 55 L 85.5 100 L 4.5 100 L 0 55 L 0 42 C 0 35.7, 13.5 0, 45 0 Z",
    hair: "M 31.5 12.6 C 27 2.1, 45 0.84, 54 8.4",
    eyeL: { cx: 29, cy: 30, r: 6, pr: 3, hr: 1.2 },
    eyeR: { cx: 61, cy: 30, r: 6, pr: 3, hr: 1.2 },
    mouth: "M 41 54 Q 45 60 49 54",
    shadow: { cx: 45, cy: 65.2, rx: 16.2, ry: 8.7 },
  },
  {
    color: "#6C5CE7", w: 80, h: 135, vb: "0 0 80 135",
    body: "M 40 0 C 68 0, 80 48.2, 80 56.7 L 80 74.25 L 76 135 L 4 135 L 0 74.25 L 0 56.7 C 0 48.2, 12 0, 40 0 Z",
    hair: "M 28 17 C 24 2.84, 40 1.13, 48 11.34",
    eyeL: { cx: 23, cy: 34, r: 6, pr: 3, hr: 1.2 },
    eyeR: { cx: 57, cy: 34, r: 6, pr: 3, hr: 1.2 },
    mouth: "M 36 58 Q 40 64 44 58",
    shadow: { cx: 40, cy: 88, rx: 14.4, ry: 11.75 },
  },
  {
    color: "#2D3436", w: 78, h: 115, vb: "0 0 78 115",
    body: "M 39 0 C 66.3 0, 78 41.06, 78 48.3 L 78 63.25 L 74.1 115 L 3.9 115 L 0 63.25 L 0 48.3 C 0 41.06, 11.7 0, 39 0 Z",
    hair: "M 27.3 14.5 C 23.4 2.42, 39 0.97, 46.8 9.66",
    eyeL: { cx: 25, cy: 28, r: 6, pr: 3, hr: 1.2 },
    eyeR: { cx: 53, cy: 28, r: 6, pr: 3, hr: 1.2 },
    mouth: "M 35 52 Q 39 58 43 52",
    shadow: { cx: 39, cy: 75, rx: 14.04, ry: 10 },
  },
  {
    color: "#FDCB6E", w: 70, h: 88, vb: "0 0 70 88",
    body: "M 35 0 C 59.5 0, 70 31.42, 70 36.96 L 70 48.4 L 66.5 88 L 3.5 88 L 0 48.4 L 0 36.96 C 0 31.42, 10.5 0, 35 0 Z",
    hair: "M 24.5 11.1 C 21 1.85, 35 0.74, 42 7.39",
    eyeL: { cx: 23, cy: 26, r: 6, pr: 3, hr: 1.2 },
    eyeR: { cx: 47, cy: 26, r: 6, pr: 3, hr: 1.2 },
    mouth: "M 31 50 Q 35 56 39 50",
    shadow: { cx: 35, cy: 57.4, rx: 12.6, ry: 7.66 },
  },
]

function calculatePupilOffset(
  eyeCx: number, eyeCy: number, eyeR: number, pupilR: number,
  mouseX: number, mouseY: number, figureScale: number
) {
  const eyeScreenX = eyeCx * figureScale
  const eyeScreenY = eyeCy * figureScale
  const dx = mouseX - eyeScreenX
  const dy = mouseY - eyeScreenY
  const distance = Math.sqrt(dx * dx + dy * dy)
  const maxOffset = (eyeR - pupilR - 0.3) * figureScale
  if (distance < 1) return { px: 0, py: 0 }
  const angle = Math.atan2(dy, dx)
  const offset = Math.min(distance * 1.2, maxOffset)
  return { px: Math.cos(angle) * offset, py: Math.sin(angle) * offset }
}

export function StickFigure({
  data, offset, zIndex, mousePos, eyesClosed, phoneFocused, isBlue,
}: {
  data: FigureData
  offset: number
  zIndex: number
  mousePos: { x: number; y: number } | null
  eyesClosed: boolean
  phoneFocused: boolean
  isBlue: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pupilL, setPupilL] = useState({ px: 0, py: 0 })
  const [pupilR, setPupilR] = useState({ px: 0, py: 0 })
  const [bodyTilt, setBodyTilt] = useState({ sx: 1, sy: 1, skewX: 0 })

  const updateEyes = useCallback(() => {
    if (!mousePos || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const figureScale = data.w / rect.width
    const mx = mousePos.x - rect.left
    const my = mousePos.y - rect.top
    setPupilL(calculatePupilOffset(data.eyeL.cx, data.eyeL.cy, data.eyeL.r, data.eyeL.pr, mx, my, figureScale))
    setPupilR(calculatePupilOffset(data.eyeR.cx, data.eyeR.cy, data.eyeR.r, data.eyeR.pr, mx, my, figureScale))
  }, [mousePos, data])

  const updateBodyTilt = useCallback(() => {
    if (!mousePos || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = mousePos.x - cx
    const dy = mousePos.y - cy
    const maxSkew = 6
    const skewX = Math.max(-maxSkew, Math.min(maxSkew, dx * 0.02))
    const maxStretch = 0.04
    const sy = 1 + Math.max(-maxStretch, Math.min(maxStretch, -dy * 0.0005))
    setBodyTilt({ sx: 1, sy, skewX })
  }, [mousePos])

  useEffect(() => {
    if (!mousePos) return
    let rafId: number
    const tick = () => {
      updateEyes()
      updateBodyTilt()
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [mousePos, updateEyes, updateBodyTilt])

  const blueStretch = isBlue && phoneFocused ? 1.25 : 1
  const blueSkew = isBlue && phoneFocused ? -8 : 0
  const blueTranslateY = isBlue && phoneFocused ? -12 : 0

  const sx = bodyTilt.sx
  const sy = bodyTilt.sy * blueStretch
  const totalSkewX = bodyTilt.skewX + blueSkew

  const eyeL = data.eyeL
  const eyeR = data.eyeR

  return (
    <div ref={containerRef} className="absolute flex items-end" style={{ left: `calc(50% + ${offset}px)`, bottom: 0, zIndex }}>
      <svg width={data.w} height={data.h} viewBox={data.vb} style={{ overflow: "visible" }}>
        <g style={{
          transform: `translateY(${blueTranslateY}px)`,
          transformOrigin: `${data.w / 2}px ${data.h}px`,
          transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}>
          <g style={{
            transform: `scale(${sx}, ${sy}) skewX(${totalSkewX}deg)`,
            transformOrigin: `${data.w / 2}px ${data.h}px`,
            transition: "transform 0.3s ease-out",
          }}>
            <path d={data.body} fill={data.color} />
            <path d={data.hair} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={data.w * 0.07} strokeLinecap="round" />
            <ellipse cx={data.shadow.cx} cy={data.shadow.cy} rx={data.shadow.rx} ry={data.shadow.ry} fill="rgba(0,0,0,0.06)" />

            {!eyesClosed ? (
              <>
                <circle cx={eyeL.cx} cy={eyeL.cy} r={eyeL.r} fill="white" />
                <circle cx={eyeL.cx + pupilL.px} cy={eyeL.cy + pupilL.py} r={eyeL.pr} fill="#1A1A2E" />
                <circle cx={eyeL.cx + pupilL.px - 1} cy={eyeL.cy + pupilL.py - eyeL.r * 0.25} r={eyeL.hr} fill="white" />
                <circle cx={eyeR.cx} cy={eyeR.cy} r={eyeR.r} fill="white" />
                <circle cx={eyeR.cx + pupilR.px} cy={eyeR.cy + pupilR.py} r={eyeR.pr} fill="#1A1A2E" />
                <circle cx={eyeR.cx + pupilR.px - 1} cy={eyeR.cy + pupilR.py - eyeR.r * 0.25} r={eyeL.hr} fill="white" />
              </>
            ) : (
              <>
                <path d={`M ${eyeL.cx - eyeL.r} ${eyeL.cy} Q ${eyeL.cx} ${eyeL.cy + eyeL.r * 0.8} ${eyeL.cx + eyeL.r} ${eyeL.cy}`}
                  stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round" fill="none" />
                <line x1={eyeL.cx - eyeL.r + 1} y1={eyeL.cy} x2={eyeL.cx - eyeL.r - 1} y2={eyeL.cy - 2} stroke="rgba(0,0,0,0.3)" strokeWidth="1" strokeLinecap="round" />
                <line x1={eyeL.cx + eyeL.r - 1} y1={eyeL.cy} x2={eyeL.cx + eyeL.r + 1} y2={eyeL.cy - 2} stroke="rgba(0,0,0,0.3)" strokeWidth="1" strokeLinecap="round" />
                <path d={`M ${eyeR.cx - eyeR.r} ${eyeR.cy} Q ${eyeR.cx} ${eyeR.cy + eyeR.r * 0.8} ${eyeR.cx + eyeR.r} ${eyeR.cy}`}
                  stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round" fill="none" />
                <line x1={eyeR.cx - eyeR.r + 1} y1={eyeR.cy} x2={eyeR.cx - eyeR.r - 1} y2={eyeR.cy - 2} stroke="rgba(0,0,0,0.3)" strokeWidth="1" strokeLinecap="round" />
                <line x1={eyeR.cx + eyeR.r - 1} y1={eyeR.cy} x2={eyeR.cx + eyeR.r + 1} y2={eyeR.cy - 2} stroke="rgba(0,0,0,0.3)" strokeWidth="1" strokeLinecap="round" />
              </>
            )}
            <path d={data.mouth} stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </g>
        </g>
      </svg>
    </div>
  )
}

export function useMouseTracking() {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", h)
    return () => window.removeEventListener("mousemove", h)
  }, [])
  return mousePos
}

export function StickFigures({
  phoneFocused,
  passwordFocused,
}: {
  phoneFocused?: boolean
  passwordFocused?: boolean
}) {
  const mousePos = useMouseTracking()
  const eyesClosed = passwordFocused === true
  const phoneF = phoneFocused === true

  const OFFSETS = [-65, -15, 32, 75]
  const Z_INDEXES = [3, 1, 2, 4]

  return (
    <div className="flex-1 flex flex-col justify-end relative overflow-visible pb-4" style={{ minHeight: 240 }}>
      <div className="relative w-full flex items-end justify-center flex-1 overflow-visible" style={{ paddingTop: 60 }}>
        <div className="absolute rounded-full" style={{ bottom: 0, width: 300, height: 2, background: "rgba(255,255,255,0.2)" }} />
        {FIGURE_DATA.map((data, i) => (
          <StickFigure
            key={i}
            data={data}
            offset={OFFSETS[i]}
            zIndex={Z_INDEXES[i]}
            mousePos={mousePos}
            eyesClosed={eyesClosed}
            phoneFocused={phoneF}
            isBlue={i === 1}
          />
        ))}
      </div>
      <div className="w-full flex justify-center mt-2 h-5 relative">
        <span className="text-xs font-medium inline-block text-primary/70" style={{ opacity: phoneF ? 1 : 0, transition: "opacity 0.3s" }}>
          让我看看～
        </span>
        <span className="text-xs font-medium inline-block text-primary/70" style={{ opacity: eyesClosed ? 1 : 0, transition: "opacity 0.3s" }}>
          我们不看！
        </span>
      </div>
    </div>
  )
}
