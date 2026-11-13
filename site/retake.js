// Fix a part. When a part Songbird added doesn't work (the riff is odd, the
// notes clash, it's the wrong sound, or there's just too much of it), pick
// the part, say what's off, and Songbird plays it another way. Less of it
// takes it out of the sections that need it least; More brings it back.
// Every change is one Undo.

const FIX_ISSUES = [
  ["notes", "The notes"],
  ["rhythm", "The rhythm or riff"],
  ["sound", "The sound"],
  ["busy", "Too busy"],
]

const fix = { issues: new Set(), working: false, said: "", layerId: null }

// Other sounds that can play the same job in the song.
const SWAP_SOUNDS = {
  chords: ["grand-piano", "electric-piano", "steel-guitar", "clean-guitar", "nylon-guitar", "organ", "warm-pad", "vibraphone", "marimba", "harp"],
  section: ["choir-aahs", "voice-oohs", "strings", "brass-section", "warm-pad", "church-organ"],
  bass: ["bass", "upright-bass", "synth-bass", "tuba"],
  solo: ["clean-guitar", "tenor-sax", "alto-sax", "trumpet", "flute", "vibraphone", "electric-piano", "violin", "clarinet", "synth-lead", "grand-piano", "nylon-guitar"],
}

// The nearest other sounds for each instrument, tried first.
const SIMILAR = {
  harp: ["nylon-guitar", "vibraphone", "marimba", "music-box"],
  vibraphone: ["bells", "marimba", "music-box", "electric-piano"],
  bells: ["music-box", "vibraphone", "marimba"],
  "music-box": ["bells", "vibraphone", "kalimba"],
  marimba: ["vibraphone", "kalimba", "harp"],
  flute: ["clarinet", "oboe", "violin", "voice-oohs", "alto-sax"],
  pizzicato: ["harp", "marimba", "nylon-guitar"],
  "clean-guitar": ["steel-guitar", "nylon-guitar", "jazz-guitar", "electric-piano"],
  "steel-guitar": ["nylon-guitar", "clean-guitar", "grand-piano"],
  "nylon-guitar": ["steel-guitar", "harp", "clean-guitar"],
  "jazz-guitar": ["clean-guitar", "electric-piano", "vibraphone"],
  "grand-piano": ["electric-piano", "organ", "steel-guitar", "warm-pad"],
  "electric-piano": ["grand-piano", "organ", "vibraphone"],
  organ: ["electric-piano", "grand-piano", "warm-pad"],
  "choir-aahs": ["voice-oohs", "strings", "warm-pad"],
  "voice-oohs": ["choir-aahs", "strings", "warm-pad"],
  strings: ["choir-aahs", "warm-pad", "church-organ"],
  "brass-section": ["strings", "choir-aahs", "organ"],
  "warm-pad": ["strings", "organ", "choir-aahs"],
  bass: ["upright-bass", "synth-bass", "tuba"],
  "upright-bass": ["bass", "synth-bass"],
  "synth-bass": ["bass", "upright-bass"],
  "tenor-sax": ["alto-sax", "trumpet", "clean-guitar", "flute"],
  "alto-sax": ["tenor-sax", "trumpet", "flute"],
  trumpet: ["alto-sax", "tenor-sax", "french-horn"],
  cello: ["violin", "french-horn", "tenor-sax"],
  violin: ["flute", "cello", "voice-oohs"],
}

// A shaker could be a tambourine, congas could be bongos.
const SWAP_HITS = { shaker: "tambourine", tambourine: "shaker", conga: "high-bongo", "low-conga": "low-bongo", "high-bongo": "conga", "low-bongo": "low-conga", cowbell: "woodblock", woodblock: "claves", claves: "cowbell" }
const HIT_NAMES = { shaker: "Shaker", tambourine: "Tambourine", conga: "Congas", "low-conga": "Congas", "high-bongo": "Bongos", "low-bongo": "Bongos", cowbell: "Cowbell", woodblock: "Woodblock", claves: "Claves" }

const TAKES = {
  strum: ["the usual strum", "two big strums a bar", "straight eighths", "an island strum", "chops on the off-beat"],
  held: ["long held chords", "each chord sung fresh", "chords pulsing on the beat"],
  stab: ["punches on the one and the push", "one punch a bar", "off-beat stabs", "long swells"],
  block: ["block chords", "one held chord at a time", "chords on every beat", "broken chords, one note at a time"],
  beat: ["chords on the beat", "chords on the off-beat"],
  bass: ["the root on one and the push", "root and fifth", "long held notes", "steady eighth notes", "octave jumps"],
  kit: ["the usual groove", "hi-hats on the beat only", "busier hi-hats", "a half-time feel"],
  hits: ["as written", "on the off-beat", "half as many hits", "doubled up"],
  fills: ["snare rolls", "tom rolls down", "just the crash", "a quick snare pickup"],
  line: ["as played", "on every beat", "on the off-beat"],
  section: ["your tune in three parts", "punches with the chords"],
}

const NOTE_TAKES = [
  { steady: undefined, plain: false, voicing: 0, said: "the first chords" },
  { steady: true, plain: true, voicing: 0, said: "simpler chords that change less" },
  { steady: true, plain: true, voicing: 1, said: "simpler chords, voiced differently" },
  { steady: true, plain: false, voicing: 2, said: "steady chords, lower down" },
]

function partKind(make) {
  if (!make) return null
  if (make.family === "drums") {
    if (make.fills) return "fills"
    const kinds = new Set((make.hits || []).map((hit) => hit.kind))
    if (make.hits && !kinds.has("kick") && !kinds.has("snare")) return "hits"
    return "kit"
  }
  if (make.play === "bass") return "bass"
  if (make.instrument === "brass-section" && make.play === "section") return "section"
  if (make.play === "chords" || (make.play === "section" && styleFor(make) === "held")) return styleFor(make)
  return "line"
}

function fixable(layer) {
  return !!(layer && layer.make && buffers.get(layer.id + ":audio"))
}

// ---------------------------------------------------------------------------
// Changes the engine can't make while planning: an octave, fewer notes,
// another drum feel, other percussion.

function reshapePlan(plan, choice, info) {
  const beat = plan.grid?.beat || 60 / Math.max(40, state.bpm || 92)
  const phase = plan.grid?.phase || 0
  const onGrid = (t, every) => {
    const n = (t - phase) / (beat * every)
    return Math.abs(n - Math.round(n)) < 0.12 / every
  }
  const busy = Math.min(0, choice.busy || 0)
  if (plan.events?.length) {
    if (choice.shift) {
      // On the off-beat: every note a half beat later.
      const by = beat * choice.shift
      plan.events = plan.events.map((event) => ({ ...event, time: event.time + by })).filter((event) => !plan.loop || event.time < plan.pass - 0.01)
    }
    if (choice.octave) {
      const low = (info?.low ?? 36) - 2
      const high = (info?.high ?? 96) + 2
      plan.events = plan.events.map((event) => {
        const midi = event.midi + 12 * choice.octave
        return midi >= low && midi <= high ? { ...event, midi } : event
      })
    }
    if (busy) {
      // Keep the notes on the beat (or the half bar), and let them ring on.
      // Chords thin to the half bar, then the bar.
      const kind = partKind(choice)
      const chordy = ["strum", "block", "held", "stab", "beat"].includes(kind)
      const every = (kind === "held" ? 4 : chordy ? 2 : 1) * (busy <= -2 ? 2 : 1)
      const kept = plan.events.filter((event) => onGrid(event.time, every))
      if (kept.length >= plan.events.length * 0.15 && kept.length) {
        const starts = [...new Set(kept.map((event) => Math.round(event.time * 1000)))].sort((a, b) => a - b)
        plan.events = kept.map((event) => {
          const at = starts.indexOf(Math.round(event.time * 1000))
          const next = at >= 0 && at + 1 < starts.length ? starts[at + 1] / 1000 : event.time + beat * every
          return { ...event, dur: Math.max(event.dur, Math.min(next - event.time - 0.02, beat * every * 1.5)) }
        })
      }
    }
  }
  if (plan.hits?.length) {
    let hits = plan.hits
    if (choice.kinds) hits = hits.map((hit) => (choice.kinds[hit.kind] ? { ...hit, kind: choice.kinds[hit.kind] } : hit))
    const kit = hits.some((hit) => hit.kind === "kick" || hit.kind === "snare")
    const take = choice.variant || 0
    if (choice.fills) {
      const mode = take % 4
      if (mode === 1) {
        const toms = ["high-tom", "mid-tom", "low-tom"]
        let n = 0
        hits = hits.map((hit) => (hit.kind === "snare" || hit.kind === "high-tom" ? { ...hit, kind: toms[Math.min(2, Math.floor((n++ % 8) / 3))] } : hit))
      } else if (mode === 2) hits = hits.filter((hit) => hit.kind === "crash" || hit.kind === "kick")
      else if (mode === 3) {
        // Only the last two hits of each roll.
        hits = hits.filter((hit, i) => hit.kind === "crash" || hit.kind === "kick" || hits.slice(i + 1, i + 3).some((next) => next.kind === "crash"))
      }
    } else if (kit && take % 4) {
      const mode = take % 4
      if (mode === 1) hits = hits.filter((hit) => hit.kind !== "hat" || onGrid(hit.time, 1))
      if (mode === 2) {
        const extra = hits.filter((hit) => hit.kind === "hat").map((hit) => ({ ...hit, time: hit.time + beat / 4, vel: hit.vel * 0.55 }))
        hits = hits.concat(extra.filter((hit) => !plan.loop || hit.time < plan.pass - 0.01))
      }
      if (mode === 3) {
        // Half time: the snare lands on three, the kick on one.
        hits = hits.flatMap((hit) => {
          const n = Math.round((hit.time - phase) / beat)
          const inBar = ((n % 4) + 4) % 4
          if (hit.kind === "snare" && onGrid(hit.time, 1)) return inBar === 3 ? [{ ...hit, time: hit.time - beat }] : []
          if (hit.kind === "kick" && onGrid(hit.time, 1) && inBar === 2) return []
          return [hit]
        })
      }
    } else if (!kit && take % 4) {
      const mode = take % 4
      if (mode === 1) hits = hits.map((hit) => ({ ...hit, time: hit.time + beat / 2 })).filter((hit) => !plan.loop || hit.time < plan.pass - 0.01)
      if (mode === 2) hits = hits.filter((_, i) => i % 2 === 0)
      if (mode === 3) hits = hits.concat(hits.map((hit) => ({ ...hit, time: hit.time + beat / 4, vel: hit.vel * 0.6 }))).filter((hit) => !plan.loop || hit.time < plan.pass - 0.01)
    }
    if (busy) {
      const every = busy <= -2 ? 2 : 1
      let keep = hits.filter((hit) => (kit ? ["kick", "snare", "crash", "clap"].includes(hit.kind) && hit.vel >= 0.35 : false) || onGrid(hit.time, every))
      // Nothing to take off the grid: every other hit instead.
      if (!keep.length || keep.length === hits.length) keep = hits.filter((hit, i) => hit.kind === "crash" || i % 2 === 0)
      hits = keep
    }
    plan.hits = hits.sort((a, b) => a.time - b.time)
  }
  return plan
}

// ---------------------------------------------------------------------------
// Another take

function nextSound(layer, make) {
  const kind = partKind(make)
  if (make.family === "drums") {
    if (kind === "hits") {
      const kinds = {}
      for (const hit of make.hits || []) {
        const now = make.kinds?.[hit.kind] || hit.kind
        if (SWAP_HITS[now]) kinds[hit.kind] = SWAP_HITS[now]
      }
      return Object.keys(kinds).length ? { kinds } : null
    }
    const at = KITS.findIndex((kit) => kit.id === (make.kit || "standard"))
    return { kit: KITS[(at + 1) % KITS.length].id }
  }
  const job = make.play === "bass" ? "bass" : make.play === "chords" ? "chords" : make.play === "section" ? "section" : "solo"
  const list = [...(SIMILAR[make.instrument] || []), ...SWAP_SOUNDS[job]]
  const tried = new Set([...(layer.tried || []), make.instrument])
  const next = list.find((id) => !tried.has(id) && instrumentInfo(id)) || SWAP_SOUNDS[job][(SWAP_SOUNDS[job].indexOf(make.instrument) + 1) % SWAP_SOUNDS[job].length]
  const info = instrumentInfo(next)
  if (!info || next === make.instrument) return null
  let play = make.play
  if (!info.plays.includes(play)) play = job === "section" && info.plays.includes("chords") ? "chords" : info.plays[0]
  return { instrument: next, family: info.family, play, rhythm: info.strum && play === "chords" ? "strum" : make.rhythm === "strum" ? "played" : make.rhythm, variant: 0 }
}

function retakeChoice(layer, issues) {
  const make = { ...layer.make }
  const said = []
  if (layer.arrangeRole === "fills") make.fills = true
  let kind = partKind(make)
  const want = new Set(issues.size ? issues : make.family === "drums" ? ["rhythm"] : ["rhythm", "notes"])
  // Drums have no notes to change: their rhythm is the thing to try.
  if (make.family === "drums" && want.has("notes")) {
    want.delete("notes")
    want.add("rhythm")
  }
  if (want.has("sound")) {
    const swap = nextSound(layer, make)
    if (swap) {
      Object.assign(make, swap)
      kind = partKind(make)
      if (swap.kinds) said.push(`it's ${[...new Set(Object.values(swap.kinds).map((id) => HIT_NAMES[id] || id))].join(" and ").toLowerCase()} now`)
      else if (swap.kit) said.push(`the ${KITS.find((kit) => kit.id === swap.kit)?.name || "kit"}`)
      else said.push(`it's ${instrumentInfo(swap.instrument)?.name.toLowerCase() || "a new sound"} now`)
    } else if (!issues.size || issues.size === 1) want.add("rhythm")
  }
  if (want.has("rhythm")) {
    if (kind === "section") {
      // A horn section following your tune can punch the chords instead.
      Object.assign(make, { play: "chords", variant: 0 })
      said.push("punches with the chords")
    } else if (kind === "line") {
      const now = make.shift ? 2 : make.rhythm === "beat" ? 1 : 0
      const next = (now + 1) % 3
      make.rhythm = next === 1 ? "beat" : "played"
      make.shift = next === 2 ? 0.5 : 0
      said.push(TAKES.line[next])
    } else {
      const list = TAKES[kind] || TAKES.block
      let variant = ((make.variant || 0) + 1) % list.length
      if (make.instrument === "brass-section" && kind === "stab" && variant === 0) {
        Object.assign(make, { play: "section" })
        said.push("your tune in three parts")
      } else said.push(list[variant])
      make.variant = variant
    }
  }
  if (want.has("notes") && make.family !== "drums") {
    if (kind === "line") {
      const order = [0, 1, -1]
      make.octave = order[(order.indexOf(make.octave || 0) + 1) % order.length]
      said.push(make.octave === 1 ? "an octave up" : make.octave === -1 ? "an octave down" : "back where it was")
    } else {
      make.notesTake = ((make.notesTake || 0) + 1) % NOTE_TAKES.length
      const pickNotes = NOTE_TAKES[make.notesTake]
      make.steady = pickNotes.steady
      make.plain = pickNotes.plain
      make.voicing = pickNotes.voicing
      said.push(pickNotes.said)
    }
  }
  if (want.has("busy")) {
    // Calmer: the sparest way this part can play, then fewer notes still.
    const sparse = { strum: 1, block: 1, stab: 1, bass: 2, kit: 1 }[kind]
    if (sparse != null && (make.variant || 0) !== sparse && !want.has("rhythm")) {
      make.variant = sparse
      said.push((TAKES[kind] || [])[sparse] || "calmer")
    } else if (kind === "held" && !make.steady) {
      Object.assign(make, { steady: true, plain: true })
      said.push("fewer chord changes")
    } else {
      make.busy = Math.max(-2, (make.busy || 0) - 1)
      said.push(make.busy <= -2 ? "only the big beats" : "fewer notes")
    }
  }
  return { make, said }
}

function fitLength(samples, length, loopSamples) {
  if (!length || samples.length === length) return samples
  if (loopSamples && samples.length < length) return tileTo(samples.subarray(0, loopSamples), length)
  const out = new Float32Array(length)
  out.set(samples.subarray(0, Math.min(length, samples.length)))
  return out
}

async function retakePart(layer, issues = fix.issues) {
  if (!fixable(layer)) return { text: "Pick a part Songbird added. Your own recordings stay as you made them.", warn: true }
  if (fix.working || state.transforming) return { text: "Still working on the last one." }
  const { make, said } = retakeChoice(layer, new Set(issues))
  fix.working = true
  state.transforming = true
  setFixNote(`Playing ${layer.name} another way…`)
  try {
    const source = state.layers.find((item) => item.id === make.sourceId) || null
    const songId = state.song?.id
    const made = await buildPart(make, source)
    if (state.song?.id !== songId || !state.layers.includes(layer)) return { text: "" }
    if (made.error) return { text: `I couldn't play ${layer.name} another way this time. Nothing changed.`, warn: true }
    const old = buffers.get(layer.id + ":audio")
    const samples = fitLength(made.samples, old?.length || 0, made.loopSamples)
    const loop = made.loopSamples && samples.length >= made.loopSamples ? made.loopSamples : 0
    snapshot([layer.id])
    const soundChanged = make.instrument !== layer.make.instrument || make.kit !== layer.make.kit || JSON.stringify(make.kinds || {}) !== JSON.stringify(layer.make.kinds || {})
    if (soundChanged) {
      layer.tried = [...new Set([...(layer.tried || []), layer.make.instrument].filter(Boolean))]
      const name = make.kinds ? HIT_NAMES[Object.values(make.kinds)[0]] || partName(make) : partName(make)
      layer.name = name
      layer.sound = name
      layer.family = make.family
      if (FAMILY_COLORS[make.family]) layer.color = FAMILY_COLORS[make.family]
    }
    make.take = (layer.make.take || 1) + 1
    layer.make = make
    layer.from = `take ${make.take}${said.length ? ` · ${said.join(", ")}` : ""}`
    buffers.set(layer.id + ":audio", loopedBuffer(samples, made.rate, loop))
    layer.peaks = peaksFromSamples(samples)
    rememberSong()
    renderTracks()
    playWhereItPlays(layer)
    return { text: `${layer.name}, take ${make.take}: ${said.join(", ") || "played another way"}. Try again, or Undo to go back.` }
  } catch (error) {
    console.error("Couldn't retake the part:", error)
    return { text: /sounds missing|Failed to fetch|Load failed|NetworkError|network/i.test(String(error)) ? "The instrument sounds didn't load. Check the connection and try again." : "That didn't work. Nothing changed.", warn: true }
  } finally {
    fix.working = false
    state.transforming = false
  }
}

// ---------------------------------------------------------------------------
// Less of it, more of it: which sections a part plays in

function songSections() {
  const total = state.lengthSec || 0
  if (state.sections?.length && total) return state.sections.map((section) => ({ name: section.name, start: section.start * total, end: section.end * total }))
  // No sections yet: four-bar stretches.
  const beat = 60 / Math.max(40, state.bpm || 92)
  const span = beat * 16
  const out = []
  for (let t = 0; t < total - 0.5; t += span) out.push({ name: "Part", start: t, end: Math.min(total, t + span) })
  return out
}

// How much of a section a part sits out: its rests, plus stretches where
// it simply has nothing to play (congas only in the choruses, say).
function restingIn(layer, section) {
  if (!heardIn(layer, section)) return 1
  let rest = 0
  for (const gap of layer.gaps || []) rest += Math.max(0, Math.min(gap.end, section.end) - Math.max(gap.start, section.start))
  return rest / Math.max(0.01, section.end - section.start)
}

function heardIn(layer, section) {
  const buffer = buffers.get(layer.id + ":audio")
  if (!buffer) return false
  const data = buffer.getChannelData(0)
  const rate = buffer.sampleRate
  const from = Math.max(0, Math.floor(section.start * rate))
  const to = Math.min(data.length, Math.floor(section.end * rate))
  // Sound in at least a quarter of it, so a ringing tail doesn't count.
  const win = Math.round(rate * 0.1)
  let windows = 0
  let loud = 0
  for (let at = from; at < to; at += win) {
    windows++
    for (let i = at; i < Math.min(to, at + win); i += 31) {
      if (Math.abs(data[i]) > 0.01) {
        loud++
        break
      }
    }
  }
  return windows > 0 && loud / windows > 0.25
}

// “Chorus” twice reads as “the first chorus” and “the second chorus”.
function sectionName(section, sections) {
  const same = sections.filter((item) => item.name === section.name)
  if (same.length < 2) return section.name
  const order = ["first", "second", "third", "fourth", "fifth", "sixth"]
  return `the ${order[same.indexOf(section)] || "next"} ${section.name.toLowerCase()}`
}

function importance(section, index, all) {
  if (/^Last chorus|Climax/.test(section.name)) return 6
  if (CHORUS.test(section.name)) return 5
  if (LIFT.test(section.name) || /Pre-chorus|Build/.test(section.name)) return 4
  if (/Verse 2|Bridge|Groove|Main/.test(section.name)) return 3
  if (/Verse/.test(section.name)) return 2
  if (QUIET.test(section.name)) return 0
  // Plain stretches: every other one, so what's left is spread out.
  return index % 2 ? 1 : 1.5
}

function withoutGap(gaps, start, end) {
  const out = []
  for (const gap of gaps) {
    if (gap.end <= start || gap.start >= end) out.push(gap)
    else {
      if (gap.start < start) out.push({ start: gap.start, end: start })
      if (gap.end > end) out.push({ start: end, end: gap.end })
    }
  }
  return out
}

function sectionList(names) {
  const unique = [...new Set(names)]
  if (unique.length <= 1) return unique[0] || ""
  return `${unique.slice(0, -1).join(", ")} and ${unique[unique.length - 1]}`
}

function playWhereItPlays(layer) {
  const sections = songSections()
  const first = sections.find((section) => restingIn(layer, section) < 0.5)
  play(first ? Math.max(0, first.start - 1) : 0)
}

function lessOf(layer) {
  if (!layer) return { text: "Pick the part you want less of.", warn: true }
  const sections = songSections()
  const on = sections.map((section, index) => ({ section, index, score: importance(section, index, sections) })).filter((item) => restingIn(layer, item.section) < 0.5)
  snapshot([layer.id])
  let text
  if (on.length > 1) {
    const drop = on.sort((a, b) => a.score - b.score || a.index - b.index).slice(0, Math.max(1, Math.floor(on.length / 2)))
    layer.gaps = mergeGaps([...(layer.gaps || []), ...drop.map((item) => ({ start: item.section.start, end: item.section.end }))])
    layer.gain = Math.round(Math.max(0.05, (layer.gain ?? 0.5) * 0.9) * 100) / 100
    const left = sections.filter((section) => restingIn(layer, section) < 0.5).map((section) => sectionName(section, sections))
    text = sections[0]?.name === "Part"
      ? `${layer.name} now rests every other stretch, and it's a little quieter. Undo puts it back.`
      : `${layer.name} rests in ${sectionList(drop.map((item) => sectionName(item.section, sections)))} now. It plays in ${sectionList(left)}. Undo puts it back.`
  } else {
    layer.gain = Math.round(Math.max(0.05, (layer.gain ?? 0.5) * 0.7) * 100) / 100
    text = on.length
      ? `${layer.name} only plays in ${sectionName(on[0].section, sections)}, so I turned it down. If it still doesn't fit, delete it in Mix.`
      : `I turned ${layer.name} down. If it still doesn't fit, delete it in Mix.`
  }
  refreshMix(layer)
  rememberSong()
  renderTracks()
  playWhereItPlays(layer)
  return { text }
}

function moreOf(layer) {
  if (!layer) return { text: "Pick the part you want more of.", warn: true }
  const sections = songSections()
  // Only where it has something to play and is resting.
  const off = sections.map((section, index) => ({ section, index, score: importance(section, index, sections) })).filter((item) => heardIn(layer, item.section) && restingIn(layer, item.section) >= 0.5)
  snapshot([layer.id])
  let text
  if (off.length) {
    const inner = off.filter((item) => item.score > 0)
    const pool = (inner.length ? inner : off).sort((a, b) => b.score - a.score || a.index - b.index)
    const add = pool.slice(0, Math.max(1, Math.ceil(pool.length / 2)))
    let gaps = layer.gaps || []
    for (const item of add) gaps = withoutGap(gaps, item.section.start, item.section.end)
    layer.gaps = mergeGaps(gaps)
    layer.gain = Math.round(Math.min(1, (layer.gain ?? 0.5) * 1.08) * 100) / 100
    if (layer.mute) layer.mute = false
    text = sections[0]?.name === "Part"
      ? `${layer.name} plays more of the song now. Undo puts it back.`
      : `${layer.name} now plays in ${sectionList(add.map((item) => sectionName(item.section, sections)))} too. Undo puts it back.`
  } else {
    layer.gain = Math.round(Math.min(1, (layer.gain ?? 0.5) * 1.3) * 100) / 100
    if (layer.mute) layer.mute = false
    text = `${layer.name} already plays everywhere it has a part, so I brought it up. Undo puts it back.`
  }
  refreshMix(layer)
  rememberSong()
  renderTracks()
  playWhereItPlays(layer)
  return { text }
}

// ---------------------------------------------------------------------------
// Said in Magic: “the guitar riff is weird”, “less congas”, “more strings”,
// “try another vibe on the horns”.

const PART_ALIASES = [
  [/\bguitars?\b|picking|strum/, (layer) => layer.family === "guitar" || (/guitar|banjo/i.test(layer.name) && layer.family !== "bass")],
  [/\bhorns?\b|brass|trumpet|trombone|sax/, (layer) => layer.family === "horns" || /horn|brass|trumpet|trombone|sax|tuba/i.test(layer.name)],
  [/choir|vocals|voices|singers|oohs?|aahs?/, (layer) => layer.family === "voices"],
  [/strings?|violin|cello/, (layer) => layer.family === "strings" && !/harp|pizz|plucked/i.test(layer.name)],
  [/\bbass\b/, (layer) => layer.make?.play === "bass" || layer.family === "bass"],
  [/drums?|kit|beat\b|groove/, (layer) => layer.family === "drums" && layer.arrangeRole !== "color" && layer.arrangeRole !== "fills"],
  [/fills?/, (layer) => layer.arrangeRole === "fills"],
  [/percussion/, (layer) => layer.arrangeRole === "color" && layer.family === "drums"],
  [/piano|keys|organ|chords/, (layer) => layer.family === "keys" || layer.arrangeRole === "chords"],
  [/solo|lead/, (layer) => layer.arrangeRole === "solo"],
  [/conga|bongo/, (layer) => /conga|bongo/i.test(layer.name)],
  [/shaker|tambourine|cowbell/, (layer) => /shaker|tambourine|cowbell/i.test(layer.name)],
  [/harp/, (layer) => /harp/i.test(layer.name)],
  [/flute/, (layer) => /flute/i.test(layer.name)],
  [/vibes|vibraphone|bells|music box/, (layer) => /vibraphone|bells|music box/i.test(layer.name)],
  [/pizz|plucked/, (layer) => /pizz|plucked/i.test(layer.name)],
  [/pad|synth/, (layer) => layer.family === "synths"],
]

function partNamed(text) {
  const made = state.layers.filter((layer) => layer.make)
  // What kind of part it is first (“the guitar” is the guitar, not the bass
  // guitar), then the part's own name.
  for (const [words, test] of PART_ALIASES) {
    if (!words.test(text)) continue
    const hit = made.find((layer) => layer.id === state.selected && test(layer)) || made.find(test)
    if (hit) return hit
  }
  const byName = made.find((layer) => {
    const words = String(layer.name || "").toLowerCase().split(/[^a-z]+/).filter((word) => word.length > 3 && !["chords", "section", "line"].includes(word))
    return words.some((word) => new RegExp(`\\b${word.replace(/s$/, "")}`).test(text))
  })
  if (byName) return byName
  if (/\b(it|this|that|this part|that part|the part)\b/.test(text)) {
    const picked = state.layers.find((layer) => layer.id === state.selected)
    if (picked?.make) return picked
  }
  return null
}

function issuesIn(text) {
  const out = new Set()
  if (/notes?|chords?|melody|harmony|clash|off key|sour|wrong key|out of tune/.test(text)) out.add("notes")
  if (/riff|rhythm|pattern|groove|strum|feel|timing|beat/.test(text)) out.add("rhythm")
  if (/\b(wrong|different|another|new|other) (sound|instrument|tone)|\bswap|\binstrument\b|\bthe (sound|tone) (is|isnt)|\btone\b/.test(text)) out.add("sound")
  if (/busy|too much going|cluttered|crowded|too many notes|simpler|calmer/.test(text)) out.add("busy")
  return out
}

async function fixRequest(text) {
  if (/(echo|reverb|room|delay|space|fade|louder|quieter|volume|turn (up|down)|bring (up|down)|hiss|noise|static)/.test(text)) return null
  const more = /\b(more of|more)\b/.test(text) && !/more (busy|notes)/.test(text)
  const less = /\b(less of|less|fewer|too much)\b/.test(text) && !/less busy/.test(text)
  const retake = /(another|different|new) (vibe|take|version|riff|feel|pattern|groove|way|sound|instrument|chords|notes)|try (again|another|something else|a different)|(is|sounds?|feels?|are|s) (weird|wrong|off|bad|odd|strange|funny|awful|terrible|cheesy|messy)|(weird|wrong|odd|strange|bad) (riff|notes|chords|rhythm|sound|pattern)|(not|isnt|arent|doesnt|dont) (quite )?(working|work|fit|right)|dont like|hate|redo|re-?do|swap|too busy|simpler|less busy/.test(text)
  if (!more && !less && !retake) return null
  const layer = partNamed(text)
  if (!layer) return null
  if (retake) return retakePart(layer, issuesIn(text))
  if (less) return lessOf(layer)
  return moreOf(layer)
}

// ---------------------------------------------------------------------------
// The Fix panel

function setFixNote(text) {
  fix.said = text
  const node = $("fix-note")
  if (node) node.textContent = text
}

function wherePlays(layer) {
  const sections = songSections()
  if (!sections.length || sections[0].name === "Part") return ""
  const on = sections.filter((section) => restingIn(layer, section) < 0.5).map((section) => sectionName(section, sections))
  if (!on.length) return "It rests the whole song right now."
  if (on.length === sections.length) return "It plays the whole song."
  return `It plays in ${sectionList(on)}.`
}

function fixPanel(head) {
  const layer = state.layers.find((item) => item.id === (fix.layerId || state.selected))
  if (!fixable(layer)) {
    const parts = state.layers.filter(fixable)
    return `${head("Fix a part")}
      <p class="hint">${parts.length ? "Pick a part Songbird added." : "Parts Songbird adds can be fixed here. Your own recordings stay as you made them."}</p>
      <div class="choices">${parts.map((item) => `<button class="chip" data-fix-open="${item.id}">${esc(item.name)}</button>`).join("")}</div>`
  }
  const busy = fix.working || state.transforming ? "disabled" : ""
  const fromYou = layer.make.sourceId && isRecording(state.layers.find((item) => item.id === layer.make.sourceId))
  const others = state.layers.filter((item) => fixable(item) && item.id !== layer.id)
  return `${head(`Fix ${esc(layer.name)}`)}
    <p class="hint">${layer.make.take > 1 ? `Take ${layer.make.take}. ` : ""}${esc(wherePlays(layer))}</p>
    <p class="ask">What's off? Pick any</p>
    <div class="choices" role="group" aria-label="What's off">
      ${FIX_ISSUES.map(([id, label]) => filterChip(label, `data-fix-issue="${id}" ${busy}`, fix.issues.has(id))).join("")}
    </div>
    ${filledButton(`${ms("autorenew")}${fix.working ? "Working…" : fix.issues.size ? "Try another take" : "Try another vibe"}`, `data-fix-do="retake" ${busy}`)}
    <p class="hint">${fix.issues.size ? "Songbird changes what you picked and keeps the rest." : "Nothing picked: Songbird changes the rhythm and the notes."}</p>
    ${fromYou && fix.issues.has("notes") && typeof openNoteCheck === "function" ? outlinedButton(`${ms("music_note")}Check the notes it follows`, `data-notes-open="${layer.make.sourceId}" ${busy}`) : ""}
    <p class="ask">How much of it</p>
    <div class="row">
      ${outlinedButton(`${ms("remove")}Less of it`, `data-fix-do="less" ${busy}`)}
      ${outlinedButton(`${ms("add")}More of it`, `data-fix-do="more" ${busy}`)}
    </div>
    <p class="hint">Less takes it out of the parts of the song that need it least. More brings it back in.</p>
    <p class="hint fix-note" id="fix-note" role="status">${esc(fix.said)}</p>
    ${others.length ? `<p class="ask">Fix another part</p>
    <div class="choices">${others.map((item) => `<button class="chip" data-fix-open="${item.id}" ${busy}>${esc(item.name)}</button>`).join("")}</div>` : ""}`
}

function fixCard(layer) {
  if (!fixable(layer)) return ""
  return `<button class="song-card fix-card" data-fix-open="${layer.id}">${ms("tune")}<span><b>Fix ${esc(layer.name)}</b><small>Wrong notes, an odd riff, or too much of it? Try another take, or less or more of it.</small></span>${ms("arrow_forward")}</button>`
}

function openFix(id) {
  if (id && state.layers.some((layer) => layer.id === id)) {
    state.selected = id
    state.magicScope = "layer"
  }
  if (fix.layerId !== (id || state.selected)) {
    fix.issues = new Set()
    fix.said = ""
  }
  fix.layerId = id || state.selected
  setPanel("fix")
  renderTracks()
}

async function runFix(action) {
  const layer = state.layers.find((item) => item.id === fix.layerId)
  if (!layer) return
  let reply
  if (action === "retake") {
    renderInspector()
    reply = await retakePart(layer, fix.issues)
  } else reply = action === "less" ? lessOf(layer) : moreOf(layer)
  if (reply?.text) {
    setFixNote(reply.text)
    $("save-status").textContent = reply.text
  }
  renderInspector()
}

document.body.addEventListener("click", (event) => {
  const node = event.target.closest?.("[data-fix-open],[data-fix-issue],[data-fix-do]")
  if (!node || node.disabled) return
  const d = node.dataset
  if (d.fixOpen != null) {
    openFix(d.fixOpen)
    return
  }
  if (d.fixIssue) {
    if (fix.issues.has(d.fixIssue)) fix.issues.delete(d.fixIssue)
    else fix.issues.add(d.fixIssue)
    renderInspector()
    return
  }
  if (d.fixDo) void runFix(d.fixDo)
})
