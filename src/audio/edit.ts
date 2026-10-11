/** Map a timeline selection into one repeat, so deleting a gap closes every copy. */
export function phraseCut(
  range: { start: number; end: number },
  phrase: number,
): { start: number; end: number } | null {
  const span = range.end - range.start
  if (span < 0.05) return null
  if (phrase <= 0.08) return { start: Math.max(0, range.start), end: Math.max(range.start, range.end) }
  const startCycle = Math.floor(range.start / phrase + 1e-9)
  const endCycle = Math.floor(Math.max(range.start, range.end - 0.02) / phrase + 1e-9)
  if (startCycle === endCycle) {
    const start = range.start - startCycle * phrase
    const end = Math.min(phrase, range.end - startCycle * phrase)
    if (end - start < 0.05) return null
    return { start, end }
  }
  const start = range.start - startCycle * phrase
  if (phrase - start < 0.05) return null
  return { start, end: phrase }
}

/** Remove [start, end) and pull later events forward by the same amount. */
export function closeEvents<T extends { time: number; duration: number }>(
  events: T[],
  start: number,
  end: number,
): T[] {
  const gap = end - start
  if (gap <= 0.001 || !events.length) return events
  const out: T[] = []
  for (const event of events) {
    const eventEnd = event.time + event.duration
    if (eventEnd <= start + 0.008) {
      out.push(event)
      continue
    }
    if (event.time >= end - 0.008) {
      out.push({ ...event, time: Math.max(0, event.time - gap) })
      continue
    }
    if (event.time >= start - 0.008 && eventEnd <= end + 0.008) continue
    if (event.time < start && eventEnd > end) {
      out.push({ ...event, duration: Math.max(0.02, event.duration - gap) })
      continue
    }
    if (event.time < start) {
      out.push({ ...event, duration: Math.max(0.02, start - event.time) })
      continue
    }
    out.push({ ...event, time: start, duration: Math.max(0.02, eventEnd - end) })
  }
  return out.sort((a, b) => a.time - b.time)
}

/** Copy events inside [start, end) and place that copy immediately after the section. */
export function duplicateEvents<T extends { time: number; duration: number }>(
  events: T[],
  start: number,
  end: number,
): T[] {
  const gap = end - start
  if (gap <= 0.001 || !events.length) return events
  const out: T[] = []
  for (const event of events) {
    const eventEnd = event.time + event.duration
    const overlaps = eventEnd > start + 0.008 && event.time < end - 0.008
    if (event.time >= end - 0.008) {
      out.push({ ...event, time: event.time + gap })
      continue
    }
    if (!overlaps) {
      out.push(event)
      continue
    }
    if (eventEnd > end + 0.008) {
      out.push({ ...event, duration: event.duration + gap })
      continue
    }
    out.push(event)
    const clipStart = Math.max(event.time, start)
    const clipEnd = Math.min(eventEnd, end)
    if (clipEnd - clipStart >= 0.02) {
      out.push({ ...event, time: end + (clipStart - start), duration: clipEnd - clipStart })
    }
  }
  return out.sort((a, b) => a.time - b.time)
}
