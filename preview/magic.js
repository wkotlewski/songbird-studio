// Songbird Magic: say what you want, the way you'd ask a photo app to
// "remove the background". Every request becomes real edits on the layers,
// each one undoable. The understanding is on this device: common phrasings
// for tightening, noise, key, tempo, fades, levels, adding parts, and
// turning a layer into an instrument. When it doesn't understand, it says so.

const FAMILIES = [
  { id: "drums", name: "Drums", icon: "🥁" },
  { id: "keys", name: "Piano & keys", icon: "🎹" },
  { id: "guitar", name: "Guitar", icon: "🎸" },
  { id: "bass", name: "Bass", icon: "🎚️" },
  { id: "strings", name: "Strings", icon: "🎻" },
  { id: "horns", name: "Horns & sax", icon: "🎺" },
  { id: "voices", name: "Voices", icon: "🎤" },
  { id: "woodwinds", name: "Woodwinds", icon: "🎶" },
  { id: "mallets", name: "Bells & mallets", icon: "🔔" },
  { id: "world", name: "World", icon: "🌍" },
  { id: "synths", name: "Synths", icon: "🎛️" },
]

// sample: the folder in sounds/. plays: the ways it can follow your layer.
const INSTRUMENTS = [
  { id: "grand-piano", name: "Grand piano", family: "keys", low: 48, high: 84, plays: ["solo", "chords"] },
  { id: "electric-piano", name: "Electric piano", family: "keys", low: 48, high: 84, plays: ["chords", "solo"] },
  { id: "organ", name: "Organ", family: "keys", low: 48, high: 84, plays: ["chords", "solo"] },
  { id: "church-organ", name: "Church organ", family: "keys", low: 48, high: 80, plays: ["chords", "solo"] },
  { id: "harpsichord", name: "Harpsichord", family: "keys", low: 48, high: 84, plays: ["solo", "chords"] },
  { id: "steel-guitar", name: "Acoustic guitar", family: "guitar", low: 45, high: 76, plays: ["chords", "solo"], strum: true },
  { id: "nylon-guitar", name: "Nylon guitar", family: "guitar", low: 45, high: 76, plays: ["solo", "chords"], strum: true },
  { id: "clean-guitar", name: "Electric guitar", family: "guitar", low: 45, high: 79, plays: ["chords", "solo"], strum: true },
  { id: "jazz-guitar", name: "Jazz guitar", family: "guitar", low: 45, high: 79, plays: ["chords", "solo"], strum: true },
  { id: "rock-guitar", name: "Rock guitar", family: "guitar", low: 40, high: 76, plays: ["chords", "solo"], strum: true },
  { id: "banjo", name: "Banjo", family: "guitar", low: 50, high: 81, plays: ["solo", "chords"], strum: true },
  { id: "bass", name: "Bass guitar", family: "bass", low: 28, high: 52, plays: ["bass", "solo"] },
  { id: "upright-bass", name: "Upright bass", family: "bass", low: 28, high: 52, plays: ["bass", "solo"] },
  { id: "synth-bass", name: "Synth bass", family: "bass", low: 28, high: 52, plays: ["bass", "solo"] },
  { id: "violin", name: "Violin", family: "strings", low: 60, high: 91, plays: ["solo", "section"] },
  { id: "cello", name: "Cello", family: "strings", low: 40, high: 72, plays: ["solo"] },
  { id: "strings", name: "String section", family: "strings", low: 48, high: 86, plays: ["section", "chords", "solo"] },
  { id: "pizzicato", name: "Pizzicato strings", family: "strings", low: 48, high: 84, plays: ["section", "solo"] },
  { id: "harp", name: "Harp", family: "strings", low: 48, high: 88, plays: ["solo", "chords"] },
  { id: "trumpet", name: "Trumpet", family: "horns", low: 55, high: 82, plays: ["solo"] },
  { id: "trombone", name: "Trombone", family: "horns", low: 40, high: 70, plays: ["solo"] },
  { id: "french-horn", name: "French horn", family: "horns", low: 41, high: 74, plays: ["solo"] },
  { id: "alto-sax", name: "Alto sax", family: "horns", low: 52, high: 80, plays: ["solo"] },
  { id: "tenor-sax", name: "Tenor sax", family: "horns", low: 46, high: 75, plays: ["solo"] },
  { id: "brass-section", name: "Horn section", family: "horns", low: 48, high: 82, plays: ["section", "chords"] },
  { id: "flute", name: "Flute", family: "woodwinds", low: 60, high: 93, plays: ["solo"] },
  { id: "clarinet", name: "Clarinet", family: "woodwinds", low: 52, high: 86, plays: ["solo"] },
  { id: "oboe", name: "Oboe", family: "woodwinds", low: 58, high: 88, plays: ["solo"] },
  { id: "choir-aahs", name: "Choir", family: "voices", low: 48, high: 79, plays: ["section", "chords"] },
  { id: "voice-oohs", name: "Solo voice (ooh)", family: "voices", low: 52, high: 79, plays: ["solo", "section"] },
  { id: "marimba", name: "Marimba", family: "mallets", low: 48, high: 88, plays: ["solo", "chords"] },
  { id: "vibraphone", name: "Vibraphone", family: "mallets", low: 52, high: 88, plays: ["solo", "chords"] },
  { id: "music-box", name: "Music box", family: "mallets", low: 64, high: 96, plays: ["solo"] },
  { id: "bells", name: "Bells", family: "mallets", low: 60, high: 84, plays: ["solo"] },
  { id: "steel-drums", name: "Steel drums", family: "world", low: 55, high: 84, plays: ["solo", "chords"] },
  { id: "kalimba", name: "Kalimba", family: "world", low: 55, high: 88, plays: ["solo"] },
  { id: "sitar", name: "Sitar", family: "world", low: 48, high: 81, plays: ["solo"] },
  { id: "koto", name: "Koto", family: "world", low: 50, high: 84, plays: ["solo"] },
  { id: "warm-pad", name: "Warm pad", family: "synths", low: 48, high: 80, plays: ["chords", "solo"] },
  { id: "synth-lead", name: "Synth lead", family: "synths", low: 52, high: 88, plays: ["solo"] },
]

const KITS = [
  { id: "standard", name: "Studio kit" },
  { id: "room", name: "Room kit" },
  { id: "power", name: "Rock kit" },
  { id: "jazz", name: "Jazz kit" },
  { id: "brush", name: "Brushes" },
  { id: "electronic", name: "Electronic kit" },
  { id: "808", name: "808" },
]

const SINGLES = [
  { id: "kick", name: "Kick" }, { id: "snare", name: "Snare" }, { id: "clap", name: "Clap" },
  { id: "rim", name: "Rim click" }, { id: "tambourine", name: "Tambourine" }, { id: "shaker", name: "Shaker" },
  { id: "conga", name: "Conga" }, { id: "high-bongo", name: "Bongos" }, { id: "cowbell", name: "Cowbell" },
  { id: "woodblock", name: "Woodblock" }, { id: "claves", name: "Claves" },
]

const PLAYS = {
  solo: ["Solo", "Plays your tune"],
  chords: ["Chords", "Harmony under your tune"],
  section: ["Section", "Your tune in three parts"],
  bass: ["Bass line", "Roots on the beat"],
}

const RHYTHMS = [
  ["played", "As you played"],
  ["beat", "On every beat"],
  ["strum", "Strummed"],
]

const ERAS = [["today", "Today"], ["2000", "2000s"], ["1990", "’90s"], ["1980", "’80s"], ["1970", "’70s"], ["1960", "’60s"], ["1950", "’50s"], ["1920", "1920s"], ["1900", "1900s"]]

const FAMILY_GAIN = { drums: 0.62, bass: 0.62, keys: 0.5, guitar: 0.48, strings: 0.42, horns: 0.42, voices: 0.4, woodwinds: 0.44, mallets: 0.44, world: 0.44, synths: 0.38 }

const pick = {
  family: "keys",
  instrument: "grand-piano",
  play: "solo",
  rhythm: "played",
  drums: "kit",
  kit: "standard",
  single: "clap",
}
state.era = state.era || "today"
state.transpose = state.transpose || 0
state.fadeIn = state.fadeIn || 0
state.fadeOut = state.fadeOut || 0
state.magicChat = []

const KEY_LABEL = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]

function instrumentInfo(id) {
  return INSTRUMENTS.find((item) => item.id === id) || null
}

// ---------------------------------------------------------------------------
// Which layers are which

function kindOf(layer) {
  if (!layer) return ""
  if (layer.family) return layer.family === "voices" ? "voices" : layer.family
  const text = `${layer.sound || ""} ${layer.name || ""} ${layer.input || ""}`.toLowerCase()
  if (/drum|clap|kit|snap|beatbox|tap|pulse/.test(text)) return "drums"
  if (/bass/.test(text)) return "bass"
  if (/choir/.test(text)) return "voices"
  if (/piano|rhodes|organ|keys/.test(text)) return "keys"
  if (/guitar/.test(text)) return "guitar"
  if (/horn|trumpet|sax|brass/.test(text)) return "horns"
  if (/string|violin|cello/.test(text)) return "strings"
  return "vocals"
}

// Your own recordings, as opposed to parts Songbird played.
function isRecording(layer) {
  return !!layer && !layer.generated && !layer.packageId && !/^starter/.test(layer.from || "")
}

function sourceAudio(layer) {
  return buffers.get(layer.id + ":original") || buffers.get(layer.id + ":audio")
}

function melodyLayer() {
  const withSound = state.layers.filter((layer) => buffers.get(layer.id + ":audio"))
  const selected = withSound.find((layer) => layer.id === state.selected)
  if (selected && isRecording(selected) && kindOf(selected) !== "drums") return selected
  return withSound.find((layer) => isRecording(layer) && kindOf(layer) === "vocals")
    || withSound.find((layer) => isRecording(layer) && kindOf(layer) !== "drums")
    || withSound.find((layer) => kindOf(layer) !== "drums")
    || null
}

function rhythmLayer() {
  const withSound = state.layers.filter((layer) => buffers.get(layer.id + ":audio") && isRecording(layer))
  return withSound.find((layer) => kindOf(layer) === "drums") || null
}

// ---------------------------------------------------------------------------
// Making an instrument part from a layer

function tileTo(pass, total) {
  const out = new Float32Array(total)
  for (let at = 0; at < total; at += pass.length) out.set(pass.length <= total - at ? pass : pass.subarray(0, total - at), at)
  return out
}

// A groove for drums when there is no clap or beatbox layer to follow:
// kick on 1 and 3, snare on 2 and 4, hats on the eighths.
function groovePlan(seconds) {
  const beat = 60 / Math.max(40, state.bpm || 92)
  const hits = []
  for (let i = 0; i * beat < seconds - 0.01; i++) {
    const t = i * beat
    hits.push({ time: t, kind: i % 2 === 0 ? "kick" : "snare", vel: i % 4 === 0 ? 0.95 : 0.85 })
    hits.push({ time: t, kind: "hat", vel: 0.6 })
    if (t + beat / 2 < seconds) hits.push({ time: t + beat / 2, kind: "hat", vel: 0.45 })
  }
  return hits
}

async function buildPart(choice, source) {
  const drums = choice.family === "drums"
  const info = drums ? null : instrumentInfo(choice.instrument)
  const audio = source && !choice.pattern ? sourceAudio(source) : null
  let plan
  if (choice.pattern) {
    // A genre's own drum pattern, written on the beat grid.
    const seconds = state.loopSec || state.lengthSec || 60
    const beat = 60 / Math.max(40, state.bpm || 92)
    const hits = SongbirdMusic.patternHits(state.bpm || 92, seconds, choice.pattern).map((hit) => ({ ...hit, vel: hit.kind === "kick" ? 0.95 : 0.85 }))
    for (let t = 0; t < seconds - 0.01; t += beat / 2) hits.push({ time: t, kind: "hat", vel: Math.round(t / (beat / 2)) % 2 ? 0.42 : 0.58 })
    plan = { hits, pass: seconds, total: Math.max(state.lengthSec || seconds, seconds), loop: !!state.loopSec }
  } else if (audio) {
    plan = await engine.call("planPerformance", samplesOf(audio), audio.sampleRate, {
      bpm: state.bpm || 92,
      loopSamples: audio.loopSamples || 0,
      mode: drums ? "drums" : "notes",
      single: drums && choice.drums === "single" ? choice.single : null,
      figure: drums ? null : choice.play,
      touch: choice.rhythm,
      low: info?.low,
      high: info?.high,
      snap: true,
      transpose: state.transpose || 0,
    })
  } else {
    const seconds = state.loopSec || state.lengthSec || 60
    plan = { hits: groovePlan(seconds), pass: seconds, total: state.lengthSec || seconds, loop: !!state.loopSec }
    if (plan.loop) plan.total = Math.max(plan.total, seconds)
  }
  if (plan.error) return { error: plan.error }
  if (drums && !(plan.hits || []).length) return { error: "no-hits" }
  const seconds = plan.loop ? plan.pass : plan.total
  const body = await SongbirdSampler.render(plan, {
    instrument: info?.id,
    kit: drums ? choice.kit || "standard" : null,
    single: drums && choice.drums === "single",
    seconds,
    loop: plan.loop,
    era: choice.era || state.era,
    decodeWith: ac(),
  })
  const rate = SongbirdSampler.RATE
  const total = Math.round(plan.total * rate)
  const samples = plan.loop ? tileTo(body, total) : body
  return { samples, rate, loopSamples: plan.loop ? body.length : 0, key: plan.key, notes: (plan.events || plan.hits || []).length }
}

function partName(choice) {
  if (choice.family === "drums") {
    if (choice.drums === "single") return SINGLES.find((item) => item.id === choice.single)?.name || "Percussion"
    return KITS.find((item) => item.id === choice.kit)?.name || "Drums"
  }
  const info = instrumentInfo(choice.instrument)
  const name = info?.name || "Instrument"
  if (choice.play === "chords" && !/section|choir|pad/i.test(name)) return `${name} chords`
  if (choice.play === "section" && !/section|choir/i.test(name)) return `${name} section`
  return name
}

let making = false

async function makePart(choice, options = {}) {
  if (making) return { text: "Still working on the last one." }
  const target = options.layer || null
  // A part Songbird made is rebuilt from the recording it came from.
  const origin = (layer) => {
    if (!layer || isRecording(layer)) return layer
    return state.layers.find((item) => item.id === layer.make?.sourceId) || null
  }
  let source = origin(options.source)
  if (choice.family === "drums") source = source && kindOf(source) === "drums" ? source : rhythmLayer()
  else if (!source || kindOf(source) === "drums") source = melodyLayer()
  if (choice.family !== "drums" && !source) return { text: "Record a hum, a song, or an instrument first. Then I can turn it into anything.", warn: true }
  making = true
  state.transforming = true
  const label = partName(choice)
  say(`Making ${label}…`)
  renderInspector()
  try {
    const songId = state.song?.id
    const made = await buildPart(choice, source)
    if (state.song?.id !== songId) return { text: "" }
    if (made.key && state.songKey == null) state.songKey = ((made.key.root - (state.transpose || 0)) % 12 + 12) % 12
    if (made.error === "no-notes") return { text: `I couldn't hear clear notes in ${source.name}. Try humming each note a little more clearly, or pick drums.`, warn: true }
    if (made.error) return { text: `I couldn't hear a beat in ${source?.name || "the song"} to follow.`, warn: true }
    const buffer = loopedBuffer(made.samples, made.rate, made.loopSamples)
    const make = { ...choice, sourceId: source?.id || null }
    const family = choice.family
    if (target) {
      snapshot([target.id])
      if (!buffers.get(target.id + ":original")) buffers.set(target.id + ":original", buffers.get(target.id + ":audio"))
      if (!target.baseName) target.baseName = target.name
      Object.assign(target, {
        name: label,
        sound: label,
        family,
        generated: !!target.generated || false,
        transformed: true,
        make,
        from: `was ${target.baseName} · ${choice.family === "drums" ? "follows your beat" : PLAYS[choice.play]?.[0].toLowerCase() || "played"}${choice.era && choice.era !== "today" ? ` · ${ERAS.find(([id]) => id === choice.era)?.[1]}` : ""}`,
      })
      buffers.set(target.id + ":audio", buffer)
      target.peaks = peaksFromSamples(made.samples)
      state.selected = target.id
      state.arrived = target.id
    } else {
      snapshot()
      const id = uid()
      const layer = {
        id,
        name: label,
        sound: label,
        family,
        generated: true,
        make,
        color: FAMILY_COLORS[family] || "#7aa2ff",
        peaks: peaksFromSamples(made.samples),
        gain: FAMILY_GAIN[family] ?? 0.5,
        pan: family === "drums" || family === "bass" ? 0 : (state.layers.length % 2 ? 0.18 : -0.18),
        low: 0,
        high: 0,
        space: family === "voices" || family === "strings" ? 0.28 : family === "drums" ? 0.04 : 0.12,
        mute: false,
        solo: false,
        live: true,
        loop: !!made.loopSamples,
        lengthSec: Math.round((made.samples.length / made.rate) * 100) / 100,
        range: source?.range ? { ...source.range } : { start: 0, end: made.samples.length / made.rate },
        from: source ? `from ${source.name} · ${choice.family === "drums" ? "follows your beat" : PLAYS[choice.play]?.[0].toLowerCase() || "played"}` : "a groove on the beat",
      }
      state.layers.push(layer)
      buffers.set(id + ":audio", buffer)
      state.selected = id
      state.arrived = id
    }
    rememberSong()
    renderTracks()
    play(0)
    const keyLine = made.key ? ` In ${KEY_LABEL[made.key.root]} ${made.key.minor ? "minor" : "major"}.` : ""
    return { text: `${target ? `${target.baseName} is now ${label}` : `Added ${label}`}${source && !target ? `, following ${source.name}` : ""}.${keyLine} Undo takes it back.` }
  } catch (error) {
    return { text: /sounds missing|missing sounds|Failed to fetch/i.test(String(error)) ? "The instrument sounds didn't load. Check the connection and try again." : "That didn't work. Nothing changed.", warn: true }
  } finally {
    making = false
    state.transforming = false
  }
}

const FAMILY_COLORS = { drums: "#3d7eff", bass: "#d98a00", keys: "#f0a202", guitar: "#ff8ab0", strings: "#c58bff", horns: "#F9A8D4", voices: "#b44dff", woodwinds: "#7ee0c8", mallets: "#ffd89a", world: "#5ee0b0", synths: "#9ec2ff" }

// ---------------------------------------------------------------------------
// Make it tight: every recording on the beat, and voices in tune.

async function tightenAll(what = { snap: true, tune: true }) {
  const layers = state.layers.filter((layer) => isRecording(layer) && buffers.get(layer.id + ":audio"))
  if (!layers.length) return { text: "Record something first, then I can tighten it.", warn: true }
  state.transforming = true
  say(what.snap && what.tune ? "Snapping everything to the beat and fixing pitch…" : what.snap ? "Snapping everything to the beat…" : "Fixing pitch…")
  renderInspector()
  const keep = { snap: state.snap, tune: state.tune }
  let snapped = 0
  let tuned = 0
  const changed = []
  try {
    for (const layer of layers) {
      const audio = sourceAudio(layer)
      const rate = audio.sampleRate
      const pitched = kindOf(layer) !== "drums"
      state.snap = !!what.snap
      state.tune = !!what.tune && pitched
      if (!state.snap && !state.tune) continue
      let samples
      let outRate
      let pass = 0
      if (audio.loopSamples) {
        const one = audio.getChannelData(0).slice(0, audio.loopSamples)
        const done = await polishPass(one, rate)
        if (!done) continue
        outRate = done.rate
        pass = done.samples.length
        samples = tileTo(done.samples, Math.round(audio.duration * outRate))
        if (/snapped/.test(done.words)) snapped += Number((done.note.match(/(\d+) notes? snapped/) || [0, 0])[1])
      } else {
        samples = samplesOf(audio)
        outRate = rate
        if (state.snap) {
          const fixed = await engine.call("fixTiming", [{ id: "take", samples, sampleRate: rate, start: layer.range?.start || 0 }], { bpm: state.bpm || 92, slack: 0.3 })
          if (fixed?.[0]?.samples) {
            samples = fixed[0].samples
            snapped += fixed[0].moved || 0
          }
        }
        if (state.tune) {
          samples = await engine.call("tuneVoice", samples, outRate, 0.9)
          outRate = SongbirdMusic.sampleRate
        }
      }
      if (state.tune) tuned += 1
      changed.push({ layer, buffer: loopedBuffer(samples, outRate, pass) })
    }
  } finally {
    state.snap = keep.snap
    state.tune = keep.tune
    state.transforming = false
  }
  if (!changed.length) return { text: "Nothing to tighten yet." }
  snapshot(changed.map((item) => item.layer.id))
  for (const { layer, buffer } of changed) {
    if (!buffers.get(layer.id + ":original")) buffers.set(layer.id + ":original", buffers.get(layer.id + ":audio"))
    buffers.set(layer.id + ":audio", buffer)
    layer.peaks = peaksFromSamples(buffer.getChannelData(0))
    layer.tight = true
  }
  rememberSong()
  renderTracks()
  play(0)
  const bits = []
  if (what.snap) bits.push(snapped ? `${snapped} ${snapped === 1 ? "note" : "notes"} snapped to the beat` : "the timing was already on the beat")
  if (what.tune) bits.push(tuned ? `${tuned === 1 ? "1 layer" : `${tuned} layers`} tuned` : "no singing to tune")
  return { text: `Tight: ${bits.join(", ")}. Undo, or Revert on a layer, brings back what you played.` }
}

// ---------------------------------------------------------------------------
// Key, tempo, fades, levels, space, era

async function transposeSong(steps) {
  if (!steps) return { text: "That's the same key." }
  const layers = state.layers.filter((layer) => buffers.get(layer.id + ":audio") && kindOf(layer) !== "drums")
  if (!layers.length) return { text: "Record something with notes first.", warn: true }
  state.transforming = true
  say(`Moving the song ${steps > 0 ? "up" : "down"}…`)
  renderInspector()
  const total = (state.transpose || 0) + steps
  const changed = []
  try {
    for (const layer of layers) {
      if (layer.make && layer.make.sourceId && state.layers.some((item) => item.id === layer.make.sourceId)) {
        const keepTranspose = state.transpose
        state.transpose = total
        try {
          const made = await buildPart(layer.make, state.layers.find((item) => item.id === layer.make.sourceId))
          if (!made.error) changed.push({ layer, buffer: loopedBuffer(made.samples, made.rate, made.loopSamples) })
        } finally {
          state.transpose = keepTranspose
        }
        continue
      }
      // A recording, or a part whose source is gone: shift the sound itself,
      // always from the untouched take so it never wears down.
      const base = buffers.get(layer.id + ":key") || buffers.get(layer.id + ":audio")
      const shifted = await engine.call("shiftPitch", samplesOf(base), base.sampleRate, total, base.loopSamples || 0)
      const pass = base.loopSamples ? Math.round((base.loopSamples * SongbirdMusic.sampleRate) / base.sampleRate) : 0
      changed.push({ layer, base, buffer: loopedBuffer(shifted, SongbirdMusic.sampleRate, pass) })
    }
  } finally {
    state.transforming = false
  }
  snapshot(changed.map((item) => item.layer.id))
  for (const { layer, base, buffer } of changed) {
    if (base && !buffers.get(layer.id + ":key")) buffers.set(layer.id + ":key", base)
    buffers.set(layer.id + ":audio", buffer)
    layer.peaks = peaksFromSamples(buffer.getChannelData(0))
  }
  state.transpose = total
  rememberSong()
  renderTracks()
  play(0)
  const lead = melodyLayer()
  const word = Math.abs(steps) === 12 ? "an octave" : `${Math.abs(steps)} ${Math.abs(steps) === 1 ? "half step" : "half steps"}`
  return { text: `Moved ${steps > 0 ? "up" : "down"} ${word}${lead ? "" : ""}. Drums stay as they are. Undo puts it back.` }
}

async function changeTempo(bpm) {
  const next = Math.round(Math.min(200, Math.max(40, bpm)))
  const old = state.bpm || 92
  if (next === old) return { text: `It's already at ${old}.` }
  const factor = old / next
  const layers = state.layers.filter((layer) => buffers.get(layer.id + ":audio"))
  if (!layers.length) {
    useTempo(next, "you", true)
    return { text: `Tempo is ${next}.` }
  }
  state.transforming = true
  say(`Changing the tempo to ${next}…`)
  renderInspector()
  const changed = []
  try {
    for (const layer of layers) {
      const audio = buffers.get(layer.id + ":audio")
      const made = await engine.call("timeStretch", samplesOf(audio), audio.sampleRate, factor, audio.loopSamples || 0)
      changed.push({ layer, buffer: loopedBuffer(made.samples, SongbirdMusic.sampleRate, made.loopSamples || 0) })
    }
  } finally {
    state.transforming = false
  }
  snapshot(changed.map((item) => item.layer.id))
  for (const { layer, buffer } of changed) {
    for (const kind of ["original", "timing", "key"]) buffers.delete(layer.id + ":" + kind)
    buffers.set(layer.id + ":audio", buffer)
    layer.peaks = peaksFromSamples(buffer.getChannelData(0))
    if (layer.lengthSec) layer.lengthSec = Math.round(layer.lengthSec * factor * 100) / 100
    if (layer.range) layer.range = { start: layer.range.start * factor, end: layer.range.end * factor }
  }
  if (state.lengthSec) state.lengthSec = Math.round(state.lengthSec * factor * 100) / 100
  if (state.loopSec) state.loopSec *= factor
  useTempo(next, "you", true)
  rememberSong()
  renderRuler()
  renderTracks()
  play(0)
  return { text: `Tempo is ${next} (was ${old}). Every layer moved with it, and the pitch stayed the same.` }
}

function setFade(which, seconds) {
  snapshot()
  if (which === "in" || which === "both") state.fadeIn = seconds
  if (which === "out" || which === "both") state.fadeOut = seconds
  rememberSong()
  if (playing) play(Math.max(0, (state.lengthSec || 60) - Math.max(state.fadeOut, 6) - 2))
  const parts = []
  if (state.fadeIn) parts.push(`fades in over ${state.fadeIn} seconds`)
  if (state.fadeOut) parts.push(`fades out over the last ${state.fadeOut} seconds`)
  return { text: parts.length ? `The song ${parts.join(" and ")}. It's in the download too.` : "No fades now." }
}

function nudgeLevel(kinds, factor) {
  const layers = state.layers.filter((layer) => kinds.includes(kindOf(layer)))
  if (!layers.length) return null
  snapshot()
  for (const layer of layers) {
    layer.gain = Math.round(Math.min(1, Math.max(0.03, (layer.gain ?? 0.8) * factor)) * 100) / 100
    if (layer.mute && factor > 1) layer.mute = false
    refreshMix(layer)
  }
  rememberSong()
  renderInspector()
  return layers
}

function nudgeSpace(amount, echo) {
  snapshot()
  for (const layer of state.layers) {
    if (echo) layer.echo = Math.max(0, Math.min(0.5, (layer.echo || 0) + amount))
    else layer.space = Math.max(0, Math.min(1, (layer.space || 0) + amount))
    refreshMix(layer)
  }
  rememberSong()
}

async function setEra(era) {
  state.era = era
  const name = ERAS.find(([id]) => id === era)?.[1] || "today"
  const parts = state.layers.filter((layer) => layer.make && buffers.get(layer.id + ":audio"))
  if (!parts.length) return { text: `New parts will sound like ${name}.` }
  state.transforming = true
  say(`Giving the parts a ${name} sound…`)
  const changed = []
  try {
    for (const layer of parts) {
      const source = state.layers.find((item) => item.id === layer.make.sourceId)
      const made = await buildPart({ ...layer.make, era }, source || null)
      if (!made.error) changed.push({ layer, buffer: loopedBuffer(made.samples, made.rate, made.loopSamples) })
    }
  } finally {
    state.transforming = false
  }
  snapshot(changed.map((item) => item.layer.id))
  for (const { layer, buffer } of changed) {
    layer.make = { ...layer.make, era }
    buffers.set(layer.id + ":audio", buffer)
  }
  rememberSong()
  renderTracks()
  play(0)
  return { text: `${changed.length === 1 ? "The part" : `${changed.length} parts`} now sound like ${name}. Your own recordings stay as they are.` }
}

async function cleanNoise() {
  const layers = state.layers.filter((layer) => isRecording(layer) && buffers.get(layer.id + ":audio"))
  if (!layers.length) return { text: "Record something first.", warn: true }
  state.transforming = true
  say("Removing background noise…")
  const changed = []
  try {
    for (const layer of layers) {
      const audio = buffers.get(layer.id + ":audio")
      const made = await engine.call("enhanceAudio", samplesOf(audio), audio.sampleRate, { mode: "clear", amount: 0.8, loopSamples: audio.loopSamples || 0 })
      changed.push({ layer, audio, buffer: loopedBuffer(made, audio.sampleRate, audio.loopSamples || 0) })
    }
  } finally {
    state.transforming = false
  }
  snapshot(changed.map((item) => item.layer.id))
  for (const { layer, audio, buffer } of changed) {
    if (!buffers.get(layer.id + ":original")) buffers.set(layer.id + ":original", audio)
    buffers.set(layer.id + ":audio", buffer)
    layer.peaks = peaksFromSamples(buffer.getChannelData(0))
  }
  rememberSong()
  renderTracks()
  play(0)
  return { text: `Background noise is down on ${changed.length === 1 ? changed[0].layer.name : `${changed.length} recordings`}. Undo brings it back.` }
}

// ---------------------------------------------------------------------------
// Understanding a request

const PART_WORDS = [
  [/horn section|horns|brass/, { family: "horns", instrument: "brass-section", play: "section" }],
  [/trumpet/, { family: "horns", instrument: "trumpet", play: "solo" }],
  [/trombone/, { family: "horns", instrument: "trombone", play: "solo" }],
  [/french horn/, { family: "horns", instrument: "french-horn", play: "solo" }],
  [/tenor sax/, { family: "horns", instrument: "tenor-sax", play: "solo" }],
  [/sax/, { family: "horns", instrument: "alto-sax", play: "solo" }],
  [/string section|strings|orchestra/, { family: "strings", instrument: "strings", play: "section" }],
  [/violin|fiddle/, { family: "strings", instrument: "violin", play: "solo" }],
  [/cello/, { family: "strings", instrument: "cello", play: "solo" }],
  [/pizzicato/, { family: "strings", instrument: "pizzicato", play: "section" }],
  [/harp\b/, { family: "strings", instrument: "harp", play: "solo" }],
  [/choir|chorus|backing vocals|background vocals|harmon|more vocals|vocals|singers/, { family: "voices", instrument: "choir-aahs", play: "section" }],
  [/ooh|solo voice/, { family: "voices", instrument: "voice-oohs", play: "solo" }],
  [/electric piano|rhodes|keys/, { family: "keys", instrument: "electric-piano", play: "chords" }],
  [/church organ/, { family: "keys", instrument: "church-organ", play: "chords" }],
  [/organ/, { family: "keys", instrument: "organ", play: "chords" }],
  [/harpsichord/, { family: "keys", instrument: "harpsichord", play: "solo" }],
  [/piano/, { family: "keys", instrument: "grand-piano", play: "solo" }],
  [/rock guitar|distort|heavy guitar/, { family: "guitar", instrument: "rock-guitar", play: "chords", rhythm: "beat" }],
  [/jazz guitar/, { family: "guitar", instrument: "jazz-guitar", play: "chords" }],
  [/electric guitar/, { family: "guitar", instrument: "clean-guitar", play: "chords", rhythm: "strum" }],
  [/nylon|classical guitar|spanish guitar/, { family: "guitar", instrument: "nylon-guitar", play: "solo" }],
  [/banjo/, { family: "guitar", instrument: "banjo", play: "solo" }],
  [/guitar/, { family: "guitar", instrument: "steel-guitar", play: "chords", rhythm: "strum" }],
  [/upright bass|double bass/, { family: "bass", instrument: "upright-bass", play: "bass" }],
  [/synth bass/, { family: "bass", instrument: "synth-bass", play: "bass" }],
  [/bass/, { family: "bass", instrument: "bass", play: "bass" }],
  [/flute/, { family: "woodwinds", instrument: "flute", play: "solo" }],
  [/clarinet/, { family: "woodwinds", instrument: "clarinet", play: "solo" }],
  [/oboe/, { family: "woodwinds", instrument: "oboe", play: "solo" }],
  [/marimba|xylophone/, { family: "mallets", instrument: "marimba", play: "solo" }],
  [/vibraphone|vibes/, { family: "mallets", instrument: "vibraphone", play: "chords" }],
  [/music box/, { family: "mallets", instrument: "music-box", play: "solo" }],
  [/bells|chimes|glockenspiel/, { family: "mallets", instrument: "bells", play: "solo" }],
  [/steel drum|steelpan/, { family: "world", instrument: "steel-drums", play: "solo" }],
  [/kalimba|thumb piano/, { family: "world", instrument: "kalimba", play: "solo" }],
  [/sitar/, { family: "world", instrument: "sitar", play: "solo" }],
  [/koto/, { family: "world", instrument: "koto", play: "solo" }],
  [/pad|ambient/, { family: "synths", instrument: "warm-pad", play: "chords" }],
  [/synth/, { family: "synths", instrument: "synth-lead", play: "solo" }],
  [/808/, { family: "drums", drums: "kit", kit: "808" }],
  [/brush/, { family: "drums", drums: "kit", kit: "brush" }],
  [/jazz drums|jazz kit/, { family: "drums", drums: "kit", kit: "jazz" }],
  [/rock drums|rock kit/, { family: "drums", drums: "kit", kit: "power" }],
  [/electronic drums|drum machine/, { family: "drums", drums: "kit", kit: "electronic" }],
  [/tambourine/, { family: "drums", drums: "single", single: "tambourine" }],
  [/shaker|maracas/, { family: "drums", drums: "single", single: "shaker" }],
  [/conga/, { family: "drums", drums: "single", single: "conga" }],
  [/bongo/, { family: "drums", drums: "single", single: "high-bongo" }],
  [/cowbell/, { family: "drums", drums: "single", single: "cowbell" }],
  [/claps?\b|hand ?claps/, { family: "drums", drums: "single", single: "clap" }],
  [/drums|drum kit|kit|a beat|beat|groove|percussion/, { family: "drums", drums: "kit", kit: "standard" }],
]

const LEVEL_WORDS = [
  [/vocal|voice|singing|lyrics/, ["vocals", "voices"]],
  [/guitar/, ["guitar"]],
  [/drum|beat|kit|percussion|claps/, ["drums"]],
  [/bass/, ["bass"]],
  [/piano|keys|organ/, ["keys"]],
  [/horn|brass|sax|trumpet/, ["horns"]],
  [/string|violin|cello/, ["strings"]],
  [/choir/, ["voices"]],
  [/synth|pad/, ["synths"]],
]

function partFrom(text) {
  for (const [pattern, choice] of PART_WORDS) {
    if (pattern.test(text)) {
      const solo = /\bsolo\b/.test(text)
      const chords = /chord/.test(text)
      const section = /section|ensemble|group/.test(text)
      const info = choice.instrument ? instrumentInfo(choice.instrument) : null
      let play = choice.play
      if (info) {
        if (chords && info.plays.includes("chords")) play = "chords"
        if (solo && info.plays.includes("solo")) play = "solo"
        if (section && info.plays.includes("section")) play = "section"
      }
      return { era: state.era, rhythm: /every beat|on the beat|steady/.test(text) ? "beat" : /strum/.test(text) ? "strum" : choice.rhythm || "played", drums: "kit", kit: "standard", single: "clap", ...choice, play }
    }
  }
  return null
}

function levelKinds(text) {
  for (const [pattern, kinds] of LEVEL_WORDS) if (pattern.test(text)) return kinds
  return null
}

function keySteps(text) {
  const named = text.match(/(?:key of|key to|key in|in the key|in key|to the key of|into the key of|to key)\s+(?:of\s+)?([a-g])\s*(#|sharp|b\b|flat)?(?=\s|$)/) || text.match(/(?:change|move|put|transpose)\s+(?:it|the song|everything)?\s*(?:to|into|in)\s+([a-g])\s*(#|sharp|b\b|flat)?(?:\s+(?:major|minor))?\s*$/)
  if (named) {
    const lead = melodyLayer()
    const current = (state.songKey ?? 0) + (state.transpose || 0)
    let target = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[named[1]]
    if (named[2] === "#" || named[2] === "sharp") target += 1
    if (named[2] === "b" || named[2] === "flat") target -= 1
    let steps = ((target - current) % 12 + 12) % 12
    if (steps > 6) steps -= 12
    return lead ? steps : null
  }
  if (/octave/.test(text)) return /down|lower|deeper/.test(text) ? -12 : 12
  const count = text.match(/(\d+|one|two|three|four|five|six)\s*(half[- ]?steps?|semitones?|steps?|notes?|keys?|frets?)/)
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 }
  let n = count ? (words[count[1]] ?? Number(count[1])) : 2
  if (count && /^steps?$/.test(count[2]) && !/half/.test(count[2])) n *= 2
  if (/whole step/.test(text)) n = 2
  if (/half step/.test(text) && !count) n = 1
  if (/(higher|up|raise|brighter)/.test(text)) return n
  if (/(lower|down|deeper|drop)/.test(text)) return -n
  return null
}

function tempoFrom(text) {
  const exact = text.match(/(\d{2,3})\s*(bpm|beats)/) || text.match(/tempo (?:to |at )?(\d{2,3})/)
  if (exact) return Number(exact[1])
  const bpm = state.bpm || 92
  if (/(faster|speed (it )?up|quicker|upbeat|more energy)/.test(text)) return bpm * (/(little|bit|slightly)/.test(text) ? 1.05 : 1.12)
  if (/(slower|slow (it )?down|chill|relax)/.test(text)) return bpm / (/(little|bit|slightly)/.test(text) ? 1.05 : 1.12)
  return null
}

function eraFrom(text) {
  if (/1900|parlor|ragtime/.test(text)) return "1900"
  if (/1920|twenties|jazz age/.test(text)) return "1920"
  if (/\b50s|1950|fifties|doo-?wop/.test(text)) return "1950"
  if (/\b60s|1960|sixties|motown/.test(text)) return "1960"
  if (/\b70s|1970|seventies|disco/.test(text)) return "1970"
  if (/\b80s|1980|eighties/.test(text)) return "1980"
  if (/\b90s|1990|nineties/.test(text)) return "1990"
  if (/2000s|y2k/.test(text)) return "2000"
  if (/vintage|old ?school|old-fashioned|retro|old record/.test(text)) return "1960"
  if (/modern|today|current|now|clean/.test(text)) return "today"
  return null
}

function genreFrom(text) {
  if (typeof SongbirdPackages === "undefined") return null
  const names = { "r&b": "rnb", "r and b": "rnb", rnb: "rnb", "hip hop": "hiphop", "hip-hop": "hiphop", rap: "hiphop", "lo-fi": "lofi", "lo fi": "lofi", lofi: "lofi", "afrobeats": "afrobeats", "afro beat": "afrobeat", "kids": "children", "children": "children" }
  for (const [word, id] of Object.entries(names)) if (text.includes(word)) return id
  for (const genre of SongbirdPackages.listGenres()) {
    if (genre.id !== "hybrid" && new RegExp(`\\b${genre.name.toLowerCase().replace(/[^a-z ]/g, "")}\\b`).test(text)) return genre.id
  }
  return null
}

function layerNamed(text) {
  const kinds = levelKinds(text)
  if (/(my |the )?(voice|humming|singing|hum|loop|recording|this layer|it)\b/.test(text) && !kinds) return melodyLayer()
  if (kinds) return state.layers.find((layer) => kinds.includes(kindOf(layer))) || null
  return state.layers.find((layer) => layer.id === state.selected) || melodyLayer()
}

async function runRequest(raw) {
  const text = ` ${String(raw || "").toLowerCase().replace(/[’']/g, "").replace(/\s+/g, " ").trim()} `
  if (!text.trim()) return { text: "Tell me what you want, like “add a horn section” or “make it tight”." }
  if (!state.layers.some((layer) => buffers.get(layer.id + ":audio"))) return { text: "Record a loop first, then tell me what to do with it.", warn: true }

  // Several requests in one: “make it tight and add drums”.
  const pieces = text.split(/\s(?:and then|then|and also|also|plus|,|;)\s|\sand\s(?=(?:add|make|turn|bring|put|give|change|fade|remove|take|raise|lower|move|transpose|speed|slow|clean|fix|tighten|snap|tune|mute)\b)/).map((piece) => ` ${piece.trim()} `).filter((piece) => piece.trim())
  if (pieces.length > 1) {
    const replies = []
    for (const piece of pieces) replies.push((await runRequest(piece)).text)
    return { text: replies.filter(Boolean).join(" ") }
  }

  if (/^\s*(undo|take (that|it) back|go back|never ?mind)\b/.test(text)) {
    document.querySelector('#studio [data-action="undo"]')?.click()
    return { text: "Undone." }
  }
  if (/(background|noise|hiss|static|hum noise|room noise|clean (it |the )?(up|audio|sound|recording)|denoise)/.test(text) && !/add/.test(text)) return cleanNoise()
  const tightWords = /(tight|on (the )?beat|in time|timing|quantiz|snap|metronome|off beat|offbeat|rhythm)/
  const tuneWords = /(in tune|pitch|off key|out of tune|flat|sharp|autotune|tune it|tune my|tuned)/
  if (/(fix|perfect|tighten|clean|polish|make (it|everything) (perfect|good|better|tight|professional))/.test(text) && !/key of/.test(text) && !partFrom(text.replace(/fix|perfect|clean/g, ""))) return tightenAll({ snap: true, tune: true })
  if (tightWords.test(text) && !/faster|slower/.test(text)) return tightenAll({ snap: true, tune: tuneWords.test(text) || /everything|all|perfect/.test(text) })
  if (tuneWords.test(text) && !/key of/.test(text)) return tightenAll({ snap: false, tune: true })

  if (/fade/.test(text)) {
    if (/(no|remove|without|stop|take out) (the )?fade/.test(text)) return setFade("both", 0)
    const secs = Number((text.match(/(\d+) ?(sec|s\b)/) || [])[1]) || (/more|long|slow/.test(text) ? 10 : 6)
    if (/fade ?in|start|begin|intro/.test(text) && !/out|end/.test(text)) return setFade("in", Math.min(20, secs))
    if (/in and out|both/.test(text)) return setFade("both", Math.min(20, secs))
    return setFade("out", Math.min(20, /more/.test(text) ? Math.max(secs, (state.fadeOut || 0) + 4) : secs))
  }

  const tempo = tempoFrom(text)
  if (tempo) return changeTempo(tempo)

  if (/key (of|to|in)|in the key|(change|move|put|transpose) .*(to|into|in) [a-g]\b/.test(text) && state.songKey == null) {
    const lead = melodyLayer()
    const audio = lead && sourceAudio(lead)
    if (audio) {
      const found = await engine.call("planPerformance", samplesOf(audio), audio.sampleRate, { bpm: state.bpm || 92, loopSamples: audio.loopSamples || 0, figure: "solo" })
      if (found?.key) state.songKey = found.key.root
    }
  }
  if (/(key|pitch|transpose|octave|higher|lower|half step|semitone|deeper)|(change|move|put) .*(to|into|in) [a-g]\s*(#|sharp|flat|b)?\s*$/.test(text) && !levelKinds(text) && !/(louder|quieter|volume|turn)/.test(text)) {
    const steps = keySteps(text)
    if (steps != null) return transposeSong(steps)
  }

  const era = eraFrom(text)
  if (era && /(sound|make|feel|like|era|style|vibe|old|vintage|retro|record)/.test(text) && !partFrom(text)) return setEra(era)

  if (/(reverb|space|room|echo|wet|dry|roomy|spacious|cathedral|hall)/.test(text)) {
    const echo = /echo|delay/.test(text)
    const less = /(less|dry|drier|remove|no |reduce|tighter)/.test(text)
    nudgeSpace(less ? -0.18 : 0.18, echo)
    return { text: `${less ? "Less" : "More"} ${echo ? "echo" : "room sound"} on every layer. Undo puts it back.` }
  }

  const louder = /(bring up|turn up|louder|boost|raise|more of the|pump up|crank)/.test(text)
  const quieter = /(turn down|quieter|softer|less of the|lower the|bring down|tone down|reduce)/.test(text)
  if ((louder || quieter) && levelKinds(text)) {
    const kinds = levelKinds(text)
    const done = nudgeLevel(kinds, louder ? 1.4 : 0.7)
    if (done) return { text: `${louder ? "Brought up" : "Turned down"} ${done.map((layer) => layer.name).join(", ")}. Undo puts it back.` }
    if (louder) return makePart(partFrom(text) || { family: "voices", instrument: "choir-aahs", play: "section", rhythm: "played" })
    return { text: "There isn't a part like that to turn down yet." }
  }

  const removing = /(remove|take out|mute|drop|get rid of|lose|without) (the |my )?/.test(text)
  if (removing && levelKinds(text)) {
    const kinds = levelKinds(text)
    const layers = state.layers.filter((layer) => kinds.includes(kindOf(layer)))
    if (!layers.length) return { text: "There isn't a part like that in the song." }
    snapshot()
    for (const layer of layers) layer.mute = true
    hearLayers()
    rememberSong()
    renderTracks()
    return { text: `Muted ${layers.map((layer) => layer.name).join(", ")}. Tap M in Mix to bring it back, or Undo.` }
  }

  const into = text.match(/(?:turn|make|change|convert|transform|switch)\s+(.*?)\s*(?:into|to|sound like|be)\s+(?:a |an |some )?(.*)$/)
  if (into) {
    const choice = partFrom(into[2])
    if (choice) {
      const target = layerNamed(into[1]) || melodyLayer()
      if (!target) return { text: "Record something first.", warn: true }
      return makePart(choice, { layer: target, source: target })
    }
    const genre = genreFrom(into[2])
    if (genre) return useGenre(genre)
  }

  const genre = genreFrom(text)
  if (genre && /(make|turn|style|genre|vibe|feel|sound|give|add|like|into)/.test(text)) return useGenre(genre)

  const part = partFrom(text)
  if (part) return makePart(part)

  return {
    text: "I didn't catch that one. Try “make it tight”, “remove background noise”, “add a horn section”, “make it higher”, “bring up the guitar”, or “fade out at the end”.",
    warn: true,
  }
}

async function useGenre(id) {
  state.genre = id
  const genre = SongbirdPackages.get(id)
  state.subgenre = genre?.subgenres?.[0]?.id || ""
  await applyGenrePackage()
  // The package builds in the background; wait for it to land.
  await new Promise((resolve) => {
    const check = () => (state.transforming ? window.setTimeout(check, 120) : resolve())
    window.setTimeout(check, 60)
  })
  return { text: state.transformNote || `Added the ${genre?.name || id} parts.` }
}

// ---------------------------------------------------------------------------
// The panel

const SUGGESTIONS = [
  "Make it tight",
  "Remove background noise",
  "Add a horn section",
  "Add harmony vocals",
  "Add drums",
  "Add a bass line",
  "Add piano chords",
  "Add strings",
  "Make it higher",
  "Make it lower",
  "Bring up the vocals",
  "Fade out at the end",
  "Make it sound like the 70s",
  "A little faster",
]

function say(text, warn) {
  if (text) $("save-status").textContent = text
  state.magicBusy = text
  state.magicWarn = !!warn
}

function chatMarkup() {
  if (!state.magicChat.length) return ""
  return `<ol class="magic-chat" aria-live="polite">${state.magicChat.slice(-3).map((item) => `<li><p class="you">${esc(item.you)}</p><p class="did ${item.warn ? "warn-text" : ""}">${esc(item.did || "…")}</p></li>`).join("")}</ol>`
}

function magicPanel(head) {
  const sources = state.layers.filter((layer) => buffers.get(layer.id + ":audio"))
  const busy = state.transforming ? "disabled" : ""
  const fam = FAMILIES.find((item) => item.id === pick.family) || FAMILIES[0]
  const familyInstruments = INSTRUMENTS.filter((item) => item.family === pick.family)
  const info = instrumentInfo(pick.instrument)
  const plays = info ? info.plays : []
  const target = sources.find((layer) => layer.id === state.selected) || sources[0]
  return `${head("Magic")}
    <p class="hint">Say what you want. Songbird does it to your song, and Undo takes it back.</p>
    <form class="magic-ask" data-magic-form>
      <label class="sr" for="magic-say">Tell Songbird what you want</label>
      <textarea id="magic-say" rows="2" placeholder="Add a horn section and make it tight" enterkeyhint="go">${esc(state.magicDraft || "")}</textarea>
      <button class="btn btn-primary magic-go" type="submit" ${busy}>${state.transforming ? "Working…" : "✨ Do it"}</button>
    </form>
    ${chatMarkup()}
    <p class="hint">${state.transforming && state.magicBusy ? esc(state.magicBusy) : "Tap the microphone on your phone's keyboard to say it out loud. Or try one:"}</p>
    <div class="choices magic-suggest">${SUGGESTIONS.map((line) => `<button class="chip" data-magic-say="${esc(line)}" ${busy}>${esc(line)}</button>`).join("")}</div>

    <h3 class="magic-h">Turn a layer into an instrument</h3>
    ${sources.length ? `<p class="ask">Layer</p>
      <div class="choices">${sources.map((layer) => filterChip(esc(layer.name), `data-action="pick-transform-layer" data-id="${layer.id}" ${busy}`, target && layer.id === target.id)).join("")}</div>` : `<p class="hint">Record a layer first.</p>`}
    <p class="ask">Instrument</p>
    <div class="family-grid">${FAMILIES.map((item) => `<button class="family ${item.id === pick.family ? "on" : ""}" data-pick-family="${item.id}" ${busy}><span aria-hidden="true">${item.icon}</span>${esc(item.name)}</button>`).join("")}</div>
    ${pick.family === "drums" ? `
      <div class="choices">
        ${filterChip("Full kit", `data-pick-drums="kit" ${busy}`, pick.drums === "kit")}
        ${filterChip("One sound", `data-pick-drums="single" ${busy}`, pick.drums === "single")}
      </div>
      <p class="hint">${pick.drums === "kit" ? "Follows your claps, taps, or beatbox: low sounds become kick, sharp ones snare, with hi-hats in time. With no beat to follow, it plays a steady groove." : "Every hit you made becomes this one sound."}</p>
      <div class="choices">${(pick.drums === "kit" ? KITS : SINGLES).map((item) => filterChip(item.name, `data-pick-${pick.drums === "kit" ? "kit" : "single"}="${item.id}" ${busy}`, (pick.drums === "kit" ? pick.kit : pick.single) === item.id)).join("")}</div>` : `
      <div class="choices">${familyInstruments.map((item) => filterChip(item.name, `data-pick-instrument="${item.id}" ${busy}`, item.id === pick.instrument)).join("")}</div>
      ${plays.length > 1 ? `<p class="ask">How it plays</p>
      <div class="choices">${plays.map((id) => filterChip(PLAYS[id][0], `data-pick-play="${id}" title="${PLAYS[id][1]}" ${busy}`, pick.play === id)).join("")}</div>
      <p class="hint">${PLAYS[pick.play]?.[1] || ""}.</p>` : ""}
      ${pick.play !== "bass" ? `<p class="ask">Rhythm</p>
      <div class="choices">${RHYTHMS.filter(([id]) => id !== "strum" || (info?.strum && pick.play === "chords")).map(([id, name]) => filterChip(name, `data-pick-rhythm="${id}" ${busy}`, pick.rhythm === id)).join("")}</div>` : ""}`}
    <p class="ask">Sound of the era</p>
    <div class="choices">${ERAS.map(([id, name]) => filterChip(name, `data-pick-era="${id}" ${busy}`, (state.era || "today") === id)).join("")}</div>
    <div class="magic-actions">
      ${filledButton(state.transforming ? "Working…" : `Add ${esc(partName(pick))}`, `data-make="add" ${busy} ${sources.length ? "" : "disabled"}`)}
      ${outlinedButton(target ? `Turn ${esc(target.name)} into it` : "Turn it into this", `data-make="replace" ${busy} ${target ? "" : "disabled"}`)}
    </div>
    <p class="hint">Notes snap to the beat and stay in key. Add keeps your recording; Turn replaces it, and Revert brings it back. Instruments are real recorded sounds (FluidR3, MIT license).</p>

    <details class="package-more">
      <summary>More: tidy a recording, your own voice, genre packages</summary>
      <p class="ask">Tidy this recording</p>
      <label class="field">How much
        <input id="enhance-amount" class="slider" type="range" min="0.25" max="1" step="0.05" value="${state.enhanceAmount || 0.65}" aria-label="How much to enhance" />
        <span data-enhance-readout>${enhanceLabel(state.enhanceAmount || 0.65)}</span>
      </label>
      <div class="choices">
        ${filterChip("Magic clear", `data-action="enhance" data-mode="clear" ${busy}`)}
        ${filterChip("Clear hiss", `data-action="enhance" data-mode="hiss" ${busy}`)}
        ${filterChip("Brighten", `data-action="enhance" data-mode="bright" ${busy}`)}
        ${filterChip("Warm", `data-action="enhance" data-mode="warm" ${busy}`)}
        ${filterChip("Smooth", `data-action="enhance" data-mode="smooth" ${busy}`)}
      </div>
      <p class="ask">Your own voice</p>
      <div class="choices">
        ${filterChip("As sung", `data-action="pick-pitch" data-pitch="none" ${busy}`, state.pitch === "none")}
        ${filterChip("Pitch correction", `data-action="pick-pitch" data-pitch="correct" ${busy}`, state.pitch === "correct")}
        ${filterChip("Autotune", `data-action="pick-pitch" data-pitch="autotune" ${busy}`, state.pitch === "autotune")}
        ${filterChip("Background vocal", `data-action="pick-vocal" data-vocal="background" ${busy}`, state.vocalType === "background")}
      </div>
      ${outlinedButton("Revert to original", `data-action="revert-original" ${busy}`)}
      ${genrePanel()}
    </details>
    ${magicLog()}`
}

async function runAndShow(text) {
  const entry = { you: text, did: "" }
  state.magicChat.push(entry)
  state.magicDraft = ""
  renderInspector()
  let reply
  try {
    reply = await runRequest(text)
  } catch {
    reply = { text: "That didn't work. Nothing changed.", warn: true }
  }
  state.transforming = false
  entry.did = reply.text || "Done."
  entry.warn = !!reply.warn
  $("save-status").textContent = entry.did
  renderInspector()
  renderTracks()
}

document.body.addEventListener("submit", (event) => {
  const form = event.target.closest?.("[data-magic-form]")
  if (!form) return
  event.preventDefault()
  const box = $("magic-say")
  const text = box ? box.value.trim() : ""
  if (text && !state.transforming) void runAndShow(text)
})

document.body.addEventListener("keydown", (event) => {
  if (event.target?.id === "magic-say" && event.key === "Enter" && !event.shiftKey) {
    event.preventDefault()
    event.target.form?.requestSubmit?.()
  }
})

document.body.addEventListener("input", (event) => {
  if (event.target?.id === "magic-say") state.magicDraft = event.target.value
})

document.body.addEventListener("click", (event) => {
  const node = event.target.closest?.("[data-magic-say],[data-pick-family],[data-pick-instrument],[data-pick-play],[data-pick-rhythm],[data-pick-era],[data-pick-drums],[data-pick-kit],[data-pick-single],[data-make]")
  if (!node || node.disabled) return
  const d = node.dataset
  if (d.magicSay) {
    if (!state.transforming) void runAndShow(d.magicSay)
    return
  }
  if (d.pickFamily) {
    pick.family = d.pickFamily
    if (pick.family !== "drums") {
      const first = INSTRUMENTS.find((item) => item.family === pick.family)
      pick.instrument = first.id
      pick.play = first.plays[0]
    }
  }
  if (d.pickInstrument) {
    pick.instrument = d.pickInstrument
    const info = instrumentInfo(pick.instrument)
    if (!info.plays.includes(pick.play)) pick.play = info.plays[0]
  }
  if (d.pickPlay) pick.play = d.pickPlay
  if (d.pickRhythm) pick.rhythm = d.pickRhythm
  if (d.pickDrums) pick.drums = d.pickDrums
  if (d.pickKit) pick.kit = d.pickKit
  if (d.pickSingle) pick.single = d.pickSingle
  if (d.pickEra) {
    void setEra(d.pickEra).then((reply) => {
      $("save-status").textContent = reply.text
      renderInspector()
    })
  }
  if (d.make) {
    const target = state.layers.find((layer) => layer.id === state.selected && buffers.get(layer.id + ":audio")) || melodyLayer()
    const choice = { ...pick, era: state.era }
    const job = d.make === "replace"
      ? makePart(choice, { layer: target, source: target })
      : makePart(choice, choice.family === "drums" ? {} : { source: target && kindOf(target) !== "drums" ? target : melodyLayer() })
    void job.then((reply) => {
      state.magicChat.push({ you: `${d.make === "replace" ? "Turn into" : "Add"} ${partName(choice)}`, did: reply.text, warn: !!reply.warn })
      $("save-status").textContent = reply.text
      renderInspector()
    })
  }
  renderInspector()
})

// Fades on the song: applied to everything you hear and to the download.
function scheduleFades(param, from, span, when) {
  const fadeIn = Math.min(state.fadeIn || 0, span / 2)
  const fadeOut = Math.min(state.fadeOut || 0, span / 2)
  const level = (t) => {
    let v = 1
    if (fadeIn && t < fadeIn) v = Math.min(v, t / fadeIn)
    if (fadeOut && t > span - fadeOut) v = Math.min(v, Math.max(0, (span - t) / fadeOut))
    return Math.max(0.0001, v)
  }
  param.cancelScheduledValues(when)
  param.setValueAtTime(level(from), when)
  if (!fadeIn && !fadeOut) return
  const points = [fadeIn, span - fadeOut, span].filter((t) => t > from)
  for (const t of points) param.linearRampToValueAtTime(level(t), when + (t - from))
}

// Genre packages and starters play through the same recorded instruments.
const STEP_SOUNDS = {
  Piano: ["keys", "grand-piano"], Rhodes: ["keys", "electric-piano"], "Acoustic guitar": ["guitar", "steel-guitar"],
  "Electric guitar": ["guitar", "clean-guitar"], Guitar: ["guitar", "steel-guitar"], Horn: ["horns", "brass-section"],
  Bass: ["bass", "bass"], Choir: ["voices", "choir-aahs"], Drums: ["drums", null],
}

function stepChoice(step) {
  const [family, instrument] = STEP_SOUNDS[step.sound] || ["keys", "grand-piano"]
  if (family === "drums") return { family, drums: "kit", kit: step.era === "1920" || step.era === "1900" ? "brush" : step.era === "1960" || step.era === "1950" ? "room" : "standard", pattern: step.pattern ? SongbirdPackages.pattern(step.pattern) : null, era: step.era }
  const info = instrumentInfo(instrument)
  let play = family === "bass" ? "bass" : step.figure === "chords" ? "chords" : "solo"
  if (!info.plays.includes(play)) play = info.plays[0]
  const rhythm = step.touch === "beat" ? "beat" : step.touch === "strum" && info.strum ? "strum" : "played"
  return { family, instrument, play, rhythm, era: step.era }
}

async function sampledStep(step, origin) {
  const choice = stepChoice(step)
  const made = await buildPart(choice, origin)
  if (made.error) return null
  return { samples: made.samples, rate: made.rate, loopSamples: made.loopSamples, family: choice.family, make: { ...choice, pattern: null, sourceId: origin.id } }
}

async function sampledStarter(kind, bpm, key, bars) {
  const beat = 60 / bpm
  const seconds = bars * 4 * beat
  let plan
  let options
  if (kind === "claps" || kind === "snaps") {
    const hits = []
    for (let i = 0; i * beat < seconds - 0.01; i++) if (i % 2 === 1) hits.push({ time: i * beat, kind: kind === "snaps" ? "rim" : "clap", vel: 0.9 })
    plan = { hits }
    options = { kit: "standard", single: true }
  } else {
    const progression = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]]
    const events = []
    for (let bar = 0; bar < bars; bar++) {
      const chord = progression[bar % 4]
      for (let b = 0; b < 4; b++) {
        if (kind === "piano" && b % 2 === 1) continue
        chord.forEach((step, i) => events.push({ midi: 48 + key + step + (step < 5 ? 12 : 0), time: (bar * 4 + b) * beat + (kind === "guitar" ? i * 0.03 : 0), dur: beat * (kind === "piano" ? 1.9 : 0.9), vel: b === 0 ? 0.85 : 0.7 }))
      }
    }
    plan = { events }
    options = { instrument: kind === "guitar" ? "steel-guitar" : "grand-piano" }
  }
  const samples = await SongbirdSampler.render(plan, { ...options, seconds, loop: true, decodeWith: ac() })
  return { samples, sampleRate: SongbirdSampler.RATE, bpm, kind }
}
