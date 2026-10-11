import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

export function Waveform({
  buffer,
  color = '#9b8ec4',
  span,
  cycle,
  compact,
  onSlide,
  onSeek,
}: {
  buffer?: AudioBuffer
  color?: string
  span?: number
  /** Repeat length. Shorter than the buffer skips the padded silence between copies. */
  cycle?: number
  compact?: boolean
  onSlide?: (deltaSeconds: number) => void
  onSeek?: (time: number) => void
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ time: number; moved: boolean } | null>(null)
  const [nudge, setNudge] = useState(0)
  const spanRef = useRef(span)
  spanRef.current = span

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !buffer) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    const data = buffer.getChannelData(0)
    const cycleLen = cycle && cycle > 0.05 ? Math.min(cycle, buffer.duration) : buffer.duration
    const total = Math.max(span ?? cycleLen, cycleLen)
    const windowEnd = Math.min(data.length, Math.max(1, Math.floor((cycleLen / buffer.duration) * data.length)))
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.85
    ctx.beginPath()
    for (let x = 0; x < w; x++) {
      let min = 1
      let max = -1
      const t0 = (x / w) * total
      const t1 = ((x + 1) / w) * total
      const local0 = t0 % cycleLen
      const local1 = t1 % cycleLen
      const i0 = Math.min(windowEnd - 1, Math.floor((local0 / buffer.duration) * data.length))
      const i1 = Math.min(windowEnd, Math.max(i0 + 1, Math.floor((local1 / buffer.duration) * data.length)))
      const scan = (from: number, to: number) => {
        for (let i = from; i < to; i++) {
          const v = data[i] ?? 0
          if (v < min) min = v
          if (v > max) max = v
        }
      }
      if (local1 < local0) {
        scan(i0, windowEnd)
        scan(0, i1)
      } else {
        scan(i0, i1)
      }
      const y1 = ((1 - max) / 2) * h
      const y2 = ((1 - min) / 2) * h
      ctx.moveTo(x, y1)
      ctx.lineTo(x, y2)
    }
    ctx.stroke()
  }, [buffer, color, span, cycle])

  const timeAt = (clientX: number) => {
    const canvas = ref.current
    if (!canvas) return 0
    const rect = canvas.getBoundingClientRect()
    const total = Math.max(spanRef.current ?? buffer?.duration ?? 1, 0.5)
    return Math.max(0, ((clientX - rect.left) / Math.max(1, rect.width)) * total)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!onSlide && !onSeek) return
    e.stopPropagation()
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { time: timeAt(e.clientX), moved: false }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return
    const delta = timeAt(e.clientX) - drag.current.time
    if (Math.abs(delta) > 0.04) drag.current.moved = true
    const canvas = ref.current
    if (!canvas) return
    const width = canvas.getBoundingClientRect().width
    const total = Math.max(spanRef.current ?? buffer?.duration ?? 1, 0.5)
    setNudge(drag.current.moved ? (delta / total) * width : 0)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const current = drag.current
    drag.current = null
    setNudge(0)
    if (!current) return
    const time = timeAt(e.clientX)
    const delta = time - current.time
    if (!current.moved) onSeek?.(time)
    else onSlide?.(delta)
  }

  return (
    <canvas
      ref={ref}
      width={720}
      height={80}
      title={onSlide ? 'Drag to slide this take on the grid' : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ transform: nudge ? `translateX(${nudge}px)` : undefined }}
      className={`pointer-events-auto w-full touch-none bg-ink ${onSlide ? 'cursor-ew-resize' : ''} ${compact ? 'h-10 shrink-0' : 'h-full min-h-0 flex-1'}`}
    />
  )
}
