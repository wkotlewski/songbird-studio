import type { DrumHit, Layer, MidiNote } from '../types'
import { nudgeStoredClick } from './clickStrip'
import { getLayerBuffer, setLayerBuffer } from './engine'
import { repeatPhrase, shiftEvents } from './grid'
import { audibleEnd, rotateWindow } from './loopPrep'
import { beatDuration } from './metronome'

export function retimed<T extends { time: number }>(events: T[], index: number, time: number): T[] {
  if (index < 0 || index >= events.length) return events
  const next = Math.max(0, time)
  if (Math.abs(events[index].time - next) < 0.0005) return events
  return events.map((event, i) => (i === index ? { ...event, time: next } : event))
}

/** Slide the whole take by whole beats. Positive moves the music later. */
export function slideTake(layer: Layer, deltaSec: number, bpm: number, bars: number): Partial<Layer> | null {
  const beat = beatDuration(bpm)
  const snapped = Math.round(deltaSec / beat) * beat
  if (Math.abs(snapped) < beat * 0.45) return null
  const buffer = getLayerBuffer(layer.id)
  const phrase = repeatPhrase(layer, bpm, bars, buffer ? audibleEnd(buffer) : 0)
  if (buffer) {
    setLayerBuffer(layer.id, rotateWindow(buffer, -snapped, phrase))
    nudgeStoredClick(layer.id, -snapped, phrase)
  }
  return {
    notes: shiftEvents(layer.notes, -snapped, phrase),
    drums: shiftEvents(layer.drums, -snapped, phrase),
    clickPass: (layer.clickPass ?? 0) + 1,
  }
}

export function moveNote(notes: MidiNote[], index: number, time: number): MidiNote[] {
  return retimed(notes, index, time)
}

export function moveHit(drums: DrumHit[], index: number, time: number): DrumHit[] {
  return retimed(drums, index, time)
}
