import { useMemo, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { DrumHit, MelodyVoicing, MidiNote } from '../types'
import { getLayerBuffer } from '../audio/engine'
import { repeatPhrase, tileEvents, wrapTime } from '../audio/grid'
import { audibleEnd } from '../audio/loopPrep'
import { beatDuration } from '../audio/metronome'
import { voiceMelody } from '../audio/voicing'

const LAYER_COLORS = ['#7dcea0', '#e8b86d', '#9b8ec4', '#e07a5f', '#8ecae6']

type Drag = {
  kind: 'note' | 'drum'
  layerId: string
  index: number
  origin: number
  pointer: number
  applied: number
}

function sourceNoteIndex(notes: MidiNote[], phrase: number, time: number, midi: number): number {
  const local = wrapTime(time, phrase)
  let best = -1
  let bestD = 0.045
  notes.forEach((note, i) => {
    if (note.midi !== midi) return
    const d = Math.abs(wrapTime(note.time, phrase) - local)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

function sourceHitIndex(drums: DrumHit[], phrase: number, time: number, piece: DrumHit['piece']): number {
  const local = wrapTime(time, phrase)
  let best = -1
  let bestD = 0.045
  drums.forEach((hit, i) => {
    if (hit.piece !== piece) return
    const d = Math.abs(wrapTime(hit.time, phrase) - local)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

export function PianoRoll({
  layers,
  duration,
  playhead,
  bpm = 92,
  bars = 4,
  songKey = 'C',
  onMoveNote,
  onMoveHit,
}: {
  layers: { id: string; notes: MidiNote[]; drums: DrumHit[]; duration?: number; voicing?: MelodyVoicing }[]
  duration: number
  playhead: number
  bpm?: number
  bars?: number
  songKey?: string
  onMoveNote?: (layerId: string, index: number, time: number) => void
  onMoveHit?: (layerId: string, index: number, time: number) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<Drag | null>(null)
  const width = 720
  const height = 180
  const t = Math.max(duration, 1.2)
  const { minM, maxM } = useMemo(() => {
    const midis = layers.flatMap((layer) => voiceMelody(layer.notes, layer.voicing ?? 'triads', songKey).map((n) => n.midi))
    if (!midis.length) return { minM: 48, maxM: 72 }
    return { minM: Math.min(...midis) - 2, maxM: Math.max(...midis) + 2 }
  }, [layers, songKey])
  const yFor = (midi: number) => {
    const span = Math.max(1, maxM - minM)
    return height - ((midi - minM) / span) * (height - 16) - 8
  }

  const timeAt = (clientX: number) => {
    const svg = svgRef.current
    if (!svg) return 0
    const rect = svg.getBoundingClientRect()
    return Math.max(0, ((clientX - rect.left) / Math.max(1, rect.width)) * t)
  }

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const current = drag.current
    if (!current) return
    const beat = beatDuration(bpm)
    const delta = Math.round((timeAt(e.clientX) - current.pointer) / beat) * beat
    if (Math.abs(delta - current.applied) < 0.0005) return
    current.applied = delta
    const next = Math.max(0, current.origin + delta)
    if (current.kind === 'note') onMoveNote?.(current.layerId, current.index, next)
    else onMoveHit?.(current.layerId, current.index, next)
  }

  const onPointerUp = () => {
    drag.current = null
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="pointer-events-auto block min-h-0 w-full flex-1 touch-none bg-ink"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {layers.map((layer, li) => {
        const fill = LAYER_COLORS[li % LAYER_COLORS.length]
        const buffer = getLayerBuffer(layer.id)
        const phrase = repeatPhrase(
          { duration: layer.duration || duration, notes: layer.notes, drums: layer.drums },
          bpm,
          bars,
          buffer ? audibleEnd(buffer) : 0,
        )
        const source = voiceMelody(layer.notes, layer.voicing ?? 'triads', songKey)
        const notes = tileEvents(
          source.map((n) => ({ ...n, time: wrapTime(n.time, phrase) })),
          phrase,
          t,
        )
        const drums = tileEvents(
          layer.drums.map((h) => ({ ...h, time: wrapTime(h.time, phrase) })),
          phrase,
          t,
        )
        return (
          <g key={layer.id}>
            {notes.map((n, i) => {
              const index = sourceNoteIndex(layer.notes, phrase, n.time, n.midi)
              const draggable = index >= 0 && Boolean(onMoveNote)
              return (
                <rect
                  key={`n-${layer.id}-${i}`}
                  x={(n.time / t) * width}
                  y={yFor(n.midi) - 4}
                  width={Math.max(3, (n.duration / t) * width)}
                  height={8}
                  rx={2}
                  fill={fill}
                  opacity={0.35 + n.velocity / 200}
                  style={{ cursor: draggable ? 'ew-resize' : undefined }}
                  onPointerDown={
                    draggable
                      ? (e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          svgRef.current?.setPointerCapture(e.pointerId)
                          const sourceTime = layer.notes[index]?.time ?? wrapTime(n.time, phrase)
                          drag.current = {
                            kind: 'note',
                            layerId: layer.id,
                            index,
                            origin: sourceTime,
                            pointer: timeAt(e.clientX),
                            applied: 0,
                          }
                        }
                      : undefined
                  }
                >
                  {draggable ? <title>Drag to line this note up with the beat</title> : null}
                </rect>
              )
            })}
            {drums.map((h, i) => {
              const row =
                h.piece === 'kick'
                  ? 158
                  : h.piece === 'snare'
                    ? 134
                    : h.piece === 'clap'
                      ? 110
                      : h.piece === 'rim'
                        ? 86
                        : h.piece === 'tom'
                          ? 62
                          : h.piece === 'crash'
                            ? 14
                            : 38
              const index = sourceHitIndex(layer.drums, phrase, h.time, h.piece)
              const draggable = index >= 0 && Boolean(onMoveHit)
              const x = (h.time / t) * width
              return (
                <g key={`d-${layer.id}-${i}`}>
                  <rect
                    x={x - 6}
                    y={row + li * 2}
                    width={16}
                    height={18}
                    fill="transparent"
                    style={{ cursor: draggable ? 'ew-resize' : undefined }}
                    onPointerDown={
                      draggable
                        ? (e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            svgRef.current?.setPointerCapture(e.pointerId)
                            drag.current = {
                              kind: 'drum',
                              layerId: layer.id,
                              index,
                              origin: layer.drums[index]?.time ?? wrapTime(h.time, phrase),
                              pointer: timeAt(e.clientX),
                              applied: 0,
                            }
                          }
                        : undefined
                    }
                  >
                    {draggable ? <title>Drag to line this hit up with the beat</title> : null}
                  </rect>
                  <rect
                    x={x}
                    y={row + li * 2}
                    width={4}
                    height={18}
                    rx={1}
                    fill={fill}
                    opacity={0.4 + h.velocity / 220}
                    pointerEvents="none"
                  />
                </g>
              )
            })}
          </g>
        )
      })}
      <line
        x1={(playhead / t) * width}
        x2={(playhead / t) * width}
        y1={0}
        y2={height}
        stroke="#e8b86d"
        strokeWidth={1.5}
        opacity={0.35}
        pointerEvents="none"
      />
    </svg>
  )
}
