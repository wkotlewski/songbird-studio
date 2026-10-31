const STARTERS = []

const INPUTS = [
  ["hum", "Hum or sing"],
  ["clap", "Clap or tap"],
  ["beat", "Beatbox"],
  ["instrument", "Instrument"],
]

const PERIODS = [
  { id: "1900", name: "1900s", line: "Parlor. Soft, warm, and far away." },
  { id: "1920", name: "1920s", line: "Jazz room. Round, with a little life." },
  { id: "1950", name: "1950s", line: "Rock and roll. Tighter, with some push." },
  { id: "1960", name: "1960s", line: "Soul. Warm and close." },
  { id: "1970", name: "1970s", line: "Studio. Wider, with a little chorus." },
  { id: "1980", name: "1980s", line: "Pop. Bright, drier, more chorus." },
  { id: "1990", name: "1990s", line: "Alternative. Drier and a bit darker." },
  { id: "2000", name: "2000s", line: "Pop. Close, bright, and pressed." },
  { id: "today", name: "Today", line: "Present day. Closest and clearest." },
]

const PACKAGES = [
  { id: "Vocals", name: "Singing", line: "Stays a voice. This does not turn the take into an instrument." },
  { id: "Piano", name: "Acoustic piano", line: "Turns this layer into piano. Undo restores the recording." },
  { id: "Rhodes", name: "Rhodes", line: "Turns this layer into electric piano. Undo restores the recording." },
  { id: "Acoustic guitar", name: "Acoustic guitar", line: "Turns this layer into acoustic guitar. Undo restores the recording." },
  { id: "Electric guitar", name: "Electric guitar", line: "Turns this layer into electric guitar. Undo restores the recording." },
  { id: "Horn", name: "Horn", line: "Turns this layer into a horn. Undo restores the recording." },
  { id: "Drums", name: "Drums", line: "Turns this layer into a kit. Undo restores the recording." },
  { id: "Bass", name: "Bass", line: "Turns this layer into bass. Undo restores the recording." },
  { id: "Choir", name: "Choir", line: "Turns this layer into a synthesized choir. Undo restores the recording." },
]

const FIGURES = [
  { id: "solo", name: "Solo", line: "Single notes. One note of the tune at a time." },
  { id: "chords", name: "Chords", line: "A chord built from each note of the tune." },
]

const TOUCHES = [
  { id: "hold", name: "Hold", line: "The note or chord lasts with the tune." },
  { id: "strum", name: "Strum", line: "Chord tones arrive one after another. Down, then up." },
  { id: "beat", name: "On the beat", line: "It hits again on each beat." },
]

const POCKETS = [
  { id: "played", name: "As played", line: "The kit follows the hits in this layer." },
  { id: "backbeat", name: "Backbeat", line: "Kick on 1 and 3. Snare on 2 and 4." },
  { id: "boom", name: "Boom-bap", line: "Kick on 1 and the offbeat. Snare on 2 and 4." },
]

const KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11]
const BLACK_KEYS = [
  { pc: 1, left: "9.2%" },
  { pc: 3, left: "23.4%" },
  { pc: 6, left: "51.8%" },
  { pc: 8, left: "66%" },
  { pc: 10, left: "80.2%" },
]

const MAGIC_PRESETS = [
  { words: ["vocal", "sing", "voice", "hum"], role: "vocals", vocalType: "solo", pitch: "correct", room: "small", reverb: true, echo: false, label: "Your voice, gently tuned" },
  { words: ["autotune", "tuned"], role: "vocals", vocalType: "solo", pitch: "autotune", room: "small", reverb: true, echo: false, label: "Autotune on your voice" },
  { words: ["background", "harmony"], role: "vocals", vocalType: "background", pitch: "correct", room: "medium", reverb: true, echo: false, label: "Background vocals" },
  { words: ["choir"], role: "vocals", vocalType: "choir", pitch: "correct", room: "large", reverb: true, echo: false, label: "Choir from the notes it heard" },
  { words: ["piano", "chord", "keys"], role: "instrument", instrument: "Piano", figure: "chords", touch: "hold", pitch: "correct", room: "medium", reverb: true, echo: false, label: "Piano chords" },
  { words: ["piano", "solo"], role: "instrument", instrument: "Piano", figure: "solo", touch: "hold", pitch: "correct", room: "small", reverb: true, echo: false, label: "Piano solo" },
  { words: ["guitar", "strum"], role: "instrument", instrument: "Acoustic guitar", figure: "chords", touch: "strum", pitch: "correct", room: "medium", reverb: true, echo: false, label: "Guitar strums" },
  { words: ["rhodes", "electric piano"], role: "instrument", instrument: "Rhodes", figure: "chords", touch: "hold", pitch: "correct", room: "medium", reverb: true, echo: false, label: "Rhodes chords" },
  { words: ["electric"], role: "instrument", instrument: "Electric guitar", figure: "chords", touch: "beat", pitch: "correct", room: "small", reverb: false, echo: false, label: "Electric guitar on the beat" },
  { words: ["horn", "trumpet", "sax"], role: "instrument", instrument: "Horn", figure: "solo", touch: "hold", pitch: "correct", room: "medium", reverb: true, echo: false, label: "Horn" },
  { words: ["bass"], role: "instrument", instrument: "Bass", figure: "solo", touch: "beat", pitch: "correct", room: "small", reverb: false, echo: false, label: "Bass on the beat" },
  { words: ["drum", "clap", "snap", "beat", "kit"], role: "instrument", instrument: "Drums", pocket: "backbeat", pitch: "correct", room: "small", reverb: false, echo: false, label: "A backbeat kit" },
]

const LENGTHS = [
  [30, "0:30"],
  [60, "1:00"],
  [120, "2:00"],
  [180, "3:00", "common"],
  [240, "4:00"],
]

const SHAPES = {
  even: {
    name: "Steady all the way",
    line: "Loops your recording to the length you chose and keeps the loudness even.",
    points: [[0, 1], [1, 1]],
    bands: [["Song", 0, 1]],
  },
  arc: {
    name: "Soft in, build, soft out",
    line: "Starts quiet, grows through the middle, then eases back down. Your recording loops underneath.",
    points: [[0, 0.28], [0.14, 0.45], [0.36, 0.9], [0.62, 1], [0.82, 0.58], [1, 0.26]],
    bands: [["Intro", 0, 0.16], ["Build", 0.16, 0.4], ["Full", 0.4, 0.74], ["Outro", 0.74, 1]],
  },
  hold: {
    name: "Short intro, full song, soft ending",
    line: "A brief soft start, a long full section, then a softer way out. Your recording loops underneath.",
    points: [[0, 0.3], [0.12, 0.55], [0.22, 1], [0.78, 1], [1, 0.3]],
    bands: [["Intro", 0, 0.14], ["Lift", 0.14, 0.24], ["Full", 0.24, 0.78], ["Outro", 0.78, 1]],
  },
  climax: {
    name: "Build to a climax",
    line: "Keeps rising and peaks near the end, then lets go. Your recording loops underneath.",
    points: [[0, 0.34], [0.28, 0.48], [0.58, 0.7], [0.86, 1], [0.94, 0.72], [1, 0.4]],
    bands: [["Start", 0, 0.22], ["Build", 0.22, 0.7], ["Climax", 0.7, 0.9], ["Release", 0.9, 1]],
  },
  slow: {
    name: "Late climax",
    line: "Stays gentle for most of the song, then rises near the end. Your recording loops underneath.",
    points: [[0, 0.36], [0.58, 0.42], [0.76, 0.68], [0.9, 1], [1, 0.5]],
    bands: [["Gentle", 0, 0.6], ["Rise", 0.6, 0.82], ["Climax", 0.82, 1]],
  },
  chorus: {
    name: "Verse and chorus",
    line: "Quieter verses, louder choruses, and the last chorus is the biggest. Your recording loops underneath.",
    points: [[0, 0.5], [0.18, 0.5], [0.2, 0.92], [0.38, 0.92], [0.4, 0.52], [0.58, 0.52], [0.6, 1], [0.96, 1], [1, 0.4]],
    bands: [["Verse", 0, 0.2], ["Chorus", 0.2, 0.4], ["Verse", 0.4, 0.6], ["Chorus", 0.6, 0.8], ["Chorus", 0.8, 1]],
  },
}

const INTENTS = [
  { id: "steady", title: "Keep it steady", detail: "Same energy from start to finish.", shapes: ["even"] },
  { id: "soft", title: "Soft intro, build, soft ending", detail: "Ease in, then ease out.", shapes: ["arc", "hold"] },
  { id: "climax", title: "A build-up or a climax", detail: "A few common ways to rise.", shapes: ["climax", "slow", "hold"] },
  { id: "chorus", title: "Verses and a bigger chorus", detail: "Quieter parts, then a lift that repeats.", shapes: ["chorus"] },
]

const BAND_COLOR = {
  Intro: "#f0a202",
  Start: "#f0a202",
  Gentle: "#2ee6c7",
  Build: "#3d7eff",
  Rise: "#3d7eff",
  Lift: "#b44dff",
  Full: "#7aa2ff",
  Chorus: "#b44dff",
  Verse: "#2ee6c7",
  Climax: "#ff4d8d",
  Release: "#93a0b8",
  Outro: "#d9b4ff",
  Song: "#3d7eff",
}

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 }

function formatClock(seconds) {
  const whole = Math.max(0, Math.round(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`
}

function clampLength(seconds) {
  return Math.min(8 * 60, Math.max(15, Math.round(seconds)))
}

function levelAt(shapeId, fraction) {
  const points = (SHAPES[shapeId] || SHAPES.even).points
  const t = Math.min(1, Math.max(0, fraction))
  if (t <= points[0][0]) return points[0][1]
  for (let i = 1; i < points.length; i++) {
    const [a, aLevel] = points[i - 1]
    const [b, bLevel] = points[i]
    if (t <= b) {
      const mix = (t - a) / (b - a || 1)
      return aLevel + (bLevel - aLevel) * mix
    }
  }
  return points[points.length - 1][1]
}

function readWish(text) {
  const raw = text.trim().toLowerCase()
  if (!raw) return null
  let lengthSec = null
  let tooLong = false
  let tooShort = false
  const clock = raw.match(/(\d{1,2}):(\d{2})/)
  const wordMin = raw.match(/\b(one|two|three|four|five|six|seven|eight)\s+minutes?\b/)
  const mins = raw.match(/(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes)\b/)
  const secs = raw.match(/(\d+)\s*(?:sec|secs|second|seconds)\b/)
  if (clock) lengthSec = Number(clock[1]) * 60 + Number(clock[2])
  else if (mins) lengthSec = Math.round(Number(mins[1]) * 60)
  else if (wordMin) lengthSec = NUMBER_WORDS[wordMin[1]] * 60
  else if (secs) lengthSec = Number(secs[1])
  else if (/half a minute|thirty seconds/.test(raw)) lengthSec = 30
  if (lengthSec != null && lengthSec > 8 * 60) tooLong = true
  if (lengthSec != null && lengthSec < 15) tooShort = true
  if (lengthSec != null) lengthSec = clampLength(lengthSec)

  const soft = /soft|gentle|ease|fade|quiet|soften/.test(raw)
  const softOut = soft && /out|end|ending|outro|finish|way out/.test(raw)
  const softIn = soft && /intro|start|beginning|way in|\bin\b/.test(raw)
  const build = /build|rise|lift|swell|grow/.test(raw)
  const climax = /climax|peak|biggest|finale/.test(raw)
  const late = /late|at the end|near the end|toward the end|towards the end/.test(raw)
  const chorus = /chorus|verse/.test(raw)
  const steady = /steady|even|straight|same energy|keep it the same/.test(raw)

  let shape = null
  let intent = null
  if (chorus) {
    shape = "chorus"
    intent = "chorus"
  } else if ((softIn && softOut) || (softOut && build) || (softIn && build && softOut)) {
    shape = "arc"
    intent = "soft"
  } else if (late && (climax || build)) {
    shape = "slow"
    intent = "climax"
  } else if (climax || build) {
    intent = "climax"
  } else if (softIn || softOut) {
    intent = "soft"
  } else if (steady && !build && !climax) {
    shape = "even"
    intent = "steady"
  }
  return { lengthSec, tooLong, tooShort, shape, intent }
}

function esc(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char])
}

function filledButton(label, attrs) {
  return `<button class="btn btn-primary" ${attrs}>${label}</button>`
}

function outlinedButton(label, attrs) {
  return `<button class="btn btn-secondary" ${attrs}>${label}</button>`
}

function dangerButton(label, attrs) {
  return `<button class="btn btn-danger" ${attrs}>${label}</button>`
}

function filterChip(label, attrs, on) {
  return `<button class="chip ${on ? "on" : ""}" aria-pressed="${on ? "true" : "false"}" ${attrs}>${label}</button>`
}

function planButton(name, line, attrs, on, extra = "") {
  return `<button class="plan ${on ? "on" : ""}" ${attrs}><span class="plan-copy"><b>${name}</b><span>${line}</span>${extra}</span></button>`
}

function tileButton(label, attrs, on) {
  return `<button class="tile ${on ? "on" : ""}" ${attrs}>${label}</button>`
}

function iconButton(icon, attrs, filled) {
  const glyph = { add: "+", home: "⌂", play_arrow: "▶", stop: "■", fiber_manual_record: "●", undo: "↶", redo: "↷", close: "×", volume_off: "M", hearing: "S", mic: "●" }[icon] || "•"
  return `<button class="icon-btn ${filled ? "on" : ""}" ${attrs}><span class="glyph" aria-hidden="true">${glyph}</span></button>`
}

function curve(shapeId) {
  const bars = 28
  let html = `<span class="curve" aria-hidden="true">`
  for (let i = 0; i < bars; i++) {
    const level = levelAt(shapeId, i / (bars - 1))
    html += `<i style="height:${Math.round(4 + level * 24)}px"></i>`
  }
  return `${html}</span>`
}

function planMessage(lengthSec, shapeId, extra) {
  const shape = SHAPES[shapeId]
  const base = `${formatClock(lengthSec)} · ${shape.name}. Recordings loop to fill it, and loudness follows that shape.`
  return extra ? `${extra} ${base}` : base
}

const buffers = new Map()
let audioCtx
let recorder
let recStream
let recChunks = []
let recTimer
let recStarted = 0
let pendingBlob = null
let recordOrigin = 0
let recordedSeconds = 0
let recLead = 0
let recAutoStop = 0
// The loop clock: when the take's first beat is heard, and how long the loop is.
const loopClock = { start: 0, length: 0, raf: 0, closedAt: 0 }
// The beat lights: when beat 1 is heard, and which beat of the bar it is.
const beatLights = { origin: Infinity, firstBeat: 0, raf: 0 }
let playing = false
let playStarted = 0
let playFrom = 0
let raf = 0
let activeSources = []
const mixNodes = new Map()
let clickTimer
let undoStack = []
let redoStack = []

const state = {
  screen: "library",
  query: "",
  shareFor: null,
  deleteFor: null,
  era: "today",
  figure: "solo",
  touch: "hold",
  pocket: "played",
  role: "vocals",
  vocalType: "solo",
  instrument: "Piano",
  pitch: "none",
  mic: "close",
  reverb: true,
  echo: false,
  room: "small",
  suggestId: null,
  genreTouched: false,
  genre: "rnb",
  subgenre: "contemporary-rnb",
  blend: "gospel",
  songs: loadSongs(),
  song: null,
  layers: [],
  selected: null,
  panel: "mix",
  input: "hum",
  recordMode: "mic",
  vibe: "claps",
  keyPc: 0,
  magicWish: "",
  enhanceAmount: 0.65,
  magicStep: 0,
  pendingMagic: "",
  mode: "first",
  monitor: "original",
  openingSound: false,
  missingSound: false,
  recording: false,
  counting: false,
  countBeat: 0,
  bpm: 92,
  click: true,
  countIn: true,
  tempoSource: "",
  tempoLocked: false,
  tempoPass: false,
  zoom: 1,
  arming: false,
  mix: null,
  timingSlack: 0.18,
  fine: false,
  recMore: false,
  lengthSec: null,
  shape: null,
  intent: null,
  wish: "",
  heard: "",
  transformNote: "",
  transformTone: "",
  transforming: false,
  arrived: null,
  span: 40,
  trackWidth: 1400,
  playAt: 0,
  section: null,
  sectionMode: "add",
  sections: null,
  // Loop pedal: record a few bars, they loop right away, stack the next layer.
  looper: true,
  loopBars: 4,
  loopSec: null,
  // Headphones on: the click is heard while you record. Off: it's silent in
  // the take and you follow the beat lights. null means Songbird guesses.
  headphones: null,
}

const $ = (id) => document.getElementById(id)

function songEmails(song) {
  return Array.isArray(song?.sharedWith) ? song.sharedWith : []
}

function hiddenIds() {
  try {
    const ids = JSON.parse(localStorage.getItem("songbird-hidden") || "[]")
    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

function shareMap() {
  try {
    const map = JSON.parse(localStorage.getItem("songbird-shares") || "{}")
    return map && typeof map === "object" ? map : {}
  } catch {
    return {}
  }
}

function loadSongs() {
  let saved = []
  try {
    const parsed = JSON.parse(localStorage.getItem("songbird-songs") || "[]")
    saved = Array.isArray(parsed) ? parsed : []
  } catch {
    saved = []
  }
  const hidden = new Set(hiddenIds())
  const shares = shareMap()
  const starters = STARTERS.filter((song) => !hidden.has(song.id)).map((song) => ({
    ...song,
    privacy: "Shared",
    sharedWith: Array.isArray(shares[song.id]) ? shares[song.id] : [],
  }))
  const mine = saved.map((song) => ({ ...song, privacy: "Shared", sharedWith: songEmails(song) }))
  return [...starters, ...mine]
}

function saveSongs() {
  try {
    const mine = state.songs.filter((song) => !song.demo).map((song) => ({ ...song, privacy: "Shared", sharedWith: songEmails(song) }))
    localStorage.setItem("songbird-songs", JSON.stringify(mine))
    return true
  } catch {
    return false
  }
}

function saveDemoShare(song) {
  const shares = shareMap()
  shares[song.id] = songEmails(song)
  localStorage.setItem("songbird-shares", JSON.stringify(shares))
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim())
}

function uid() {
  return Math.random().toString(16).slice(2, 10)
}

function bars(seed, count = 56) {
  let value = seed
  const out = []
  for (let i = 0; i < count; i++) {
    value = (value * 48271) % 2147483647
    out.push(0.2 + (value % 80) / 100)
  }
  return out
}

function wave(peaks, color, id, box) {
  const mark = id ? ` data-layer="${id}"` : ""
  const place = box ? `left:${box.left}%;width:${box.width}%;` : ""
  return `<div class="wave"${mark} style="${place}background:${color}33;--wave:${color}"><span class="bars">${peaks
    .map((peak) => `<i style="height:${Math.max(8, peak * 46)}px;background:${color}"></i>`)
    .join("")}</span></div>`
}

// The sound engine runs in a worker, so building a piano or a whole genre
// package never freezes the studio. If a browser can't start the worker
// (an old browser, or the page opened from a file), the same engine runs
// here instead, after the screen has had a moment to show progress.
const engine = (() => {
  let worker = null
  let seq = 0
  const waiting = new Map()
  const local = (fn, args) => new Promise((resolve, reject) => {
    window.setTimeout(() => {
      try { resolve(SongbirdMusic[fn](...args)) } catch (error) { reject(error) }
    }, 30)
  })
  const giveUp = () => {
    const pending = [...waiting.values()]
    waiting.clear()
    try { worker?.terminate() } catch { /* already gone */ }
    worker = null
    for (const job of pending) local(job.fn, job.args).then(job.resolve, job.reject)
  }
  try {
    if (typeof Worker !== "undefined" && location.protocol !== "file:") {
      worker = new Worker("engine-worker.js")
      worker.onmessage = (event) => {
        const { id, ok, result, error } = event.data || {}
        const job = waiting.get(id)
        if (!job) return
        waiting.delete(id)
        if (ok) job.resolve(result)
        else job.reject(new Error(error))
      }
      worker.onerror = giveUp
    }
  } catch {
    worker = null
  }
  return {
    call(fn, ...args) {
      if (!worker) return local(fn, args)
      return new Promise((resolve, reject) => {
        const id = ++seq
        waiting.set(id, { fn, args, resolve, reject })
        try {
          worker.postMessage({ id, fn, args })
        } catch {
          waiting.delete(id)
          local(fn, args).then(resolve, reject)
        }
      })
    },
  }
})()

function samplesOf(buffer) {
  const copy = new Float32Array(buffer.length)
  copy.set(buffer.getChannelData(0))
  return copy
}

// A buffer remembers how long one pass of its loop is, so the engine can
// build one pass and repeat it, the way a loop pedal does.
function loopedBuffer(samples, sampleRate, loopSamples) {
  const buffer = audioBuffer(samples, sampleRate)
  if (loopSamples > 0 && loopSamples < buffer.length) buffer.loopSamples = Math.round(loopSamples)
  return buffer
}

// iPhone and iPad: Web Audio is quiet by default. It obeys the silent
// switch, and after the mic is used it can stay routed to the earpiece or
// be "interrupted". Songbird asks for a music session (speaker, ignores the
// silent switch) whenever it isn't recording, and wakes the audio back up.
const appleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
let quietKeeper = null

function audioSession(kind) {
  try {
    if (navigator.audioSession && navigator.audioSession.type !== kind) navigator.audioSession.type = kind
  } catch { /* older browsers have no audio session */ }
}

function silentWavUrl() {
  const rate = 8000
  const length = rate / 2
  const bytes = new ArrayBuffer(44 + length * 2)
  const view = new DataView(bytes)
  const write = (offset, text) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)) }
  write(0, "RIFF"); view.setUint32(4, 36 + length * 2, true); write(8, "WAVE"); write(12, "fmt ")
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  write(36, "data"); view.setUint32(40, length * 2, true)
  return URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }))
}

// Older iPhones have no audioSession setting. A silent looping <audio>
// element switches the page to media playback, which does the same job.
function keepSpeakerOn() {
  if (state.recording || state.arming || state.counting) {
    audioSession("play-and-record")
    return
  }
  audioSession("playback")
  if (!appleMobile || navigator.audioSession) return
  try {
    if (!quietKeeper) {
      quietKeeper = new Audio(silentWavUrl())
      quietKeeper.loop = true
      quietKeeper.setAttribute("playsinline", "")
    }
    if (quietKeeper.paused) void quietKeeper.play().catch(() => {})
  } catch { /* nothing else to try */ }
}

function ac() {
  if (!audioCtx) {
    audioCtx = new AudioContext()
    audioCtx.onstatechange = () => {
      if (audioCtx.state !== "running" && (playing || state.recording)) void audioCtx.resume().catch(() => {})
    }
  }
  if (audioCtx.state !== "running") void audioCtx.resume().catch(() => {})
  return audioCtx
}

// Every tap is a chance to unlock sound on a phone. iPhone counts a tap as
// permission on touchend and click, so all three are listened to.
for (const type of ["pointerdown", "touchend", "click"]) {
  document.addEventListener(type, () => {
    keepSpeakerOn()
    if (audioCtx && audioCtx.state !== "running") void audioCtx.resume().catch(() => {})
  }, { capture: true, passive: true })
}

const CLOUDS = [
  { x: 0.18, y: 0.28, color: "46,230,199" },
  { x: 0.74, y: 0.36, color: "180,77,255" },
  { x: 0.48, y: 0.72, color: "240,162,2" },
  { x: 0.86, y: 0.18, color: "255,77,141" },
]
const STAR_HUES = ["#f4f7fb", "#2ee6c7", "#b44dff", "#f0a202", "#9ec2ff", "#ff8ab0"]
const sky = {
  stars: [],
  motes: [],
  raf: 0,
  level: 0,
  micSource: null,
  micAnalyser: null,
  micBins: null,
  flashes: [],
  reduced: false,
}

function seedStars() {
  sky.stars = Array.from({ length: 78 }, (_, index) => ({
    x: Math.random(),
    y: Math.random(),
    r: index % 11 === 0 ? 1.7 : 0.45 + Math.random() * 0.85,
    phase: Math.random() * Math.PI * 2,
    hue: STAR_HUES[index % STAR_HUES.length],
  }))
}

// Sizes measured when the window changes, not read on every frame.
const view = { width: 0, stageW: 0, stageH: 0 }

function measureView() {
  const stage = document.querySelector(".stage")
  view.stageW = stage ? stage.clientWidth : 0
  view.stageH = stage ? stage.clientHeight : 0
  const timeline = $("timeline")
  view.width = timeline ? timeline.clientWidth : 0
  forgetLane()
}

function fitSky() {
  const canvas = $("sky")
  if (!canvas) return null
  if (!view.stageW) measureView()
  const width = Math.max(320, view.stageW || 0)
  const height = Math.max(180, view.stageH || 0)
  // The sky is soft light, so it draws at up to 1.5× instead of 2× pixels.
  const dpr = Math.min(1.5, window.devicePixelRatio || 1)
  const pixelsW = Math.floor(width * dpr)
  const pixelsH = Math.floor(height * dpr)
  if (canvas.width !== pixelsW || canvas.height !== pixelsH) {
    canvas.width = pixelsW
    canvas.height = pixelsH
  }
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, width, height }
}

function spawnMotes(count) {
  if (sky.reduced) return
  for (let i = 0; i < count; i++) {
    sky.motes.push({
      x: Math.random(),
      y: 0.55 + Math.random() * 0.4,
      vx: (Math.random() - 0.5) * 0.00035,
      vy: -0.00012 - Math.random() * 0.0004,
      life: 0.4 + Math.random() * 0.6,
      decay: 0.003 + Math.random() * 0.007,
      r: 0.8 + Math.random() * 2.1,
      hue: STAR_HUES[Math.floor(Math.random() * STAR_HUES.length)],
    })
  }
}

function readEnergy() {
  let energy = 0
  if (state.recording && sky.micAnalyser && sky.micBins) {
    sky.micAnalyser.getByteFrequencyData(sky.micBins)
    let sum = 0
    for (let i = 0; i < sky.micBins.length; i++) sum += sky.micBins[i]
    energy = sum / (sky.micBins.length * 255)
  }
  for (const nodes of mixNodes.values()) {
    if (!nodes.watch || !nodes.bins) continue
    nodes.watch.getByteFrequencyData(nodes.bins)
    let sum = 0
    for (let i = 0; i < nodes.bins.length; i++) sum += nodes.bins[i]
    const layerEnergy = sum / (nodes.bins.length * 255)
    nodes.energy = layerEnergy
    if (layerEnergy > energy) energy = layerEnergy
    const waveEl = waveFor(nodes.id)
    if (waveEl) {
      const step = Math.round(layerEnergy * 40) / 40
      if (waveEl._pulse !== step) {
        waveEl._pulse = step
        waveEl.style.setProperty("--pulse", String(step))
      }
    }
  }
  if (audioCtx) {
    const now = audioCtx.currentTime
    sky.flashes = sky.flashes.filter((flash) => now - flash.when < 0.18)
    for (const flash of sky.flashes) {
      const age = now - flash.when
      if (age >= 0) energy = Math.max(energy, flash.strength * (1 - age / 0.18))
    }
  }
  if (document.body.dataset.sound) energy = Math.max(energy, 0.05)
  return Math.max(0, Math.min(1, energy))
}

function paintMeter() {
  rideInput()
  if (!state.recording || !sky.micBins || sky.reduced) return
  const meter = document.querySelector(".meter")
  if (!meter) return
  meter.classList.add("live")
  const bars = meter.querySelectorAll("i")
  const bins = sky.micBins
  for (let i = 0; i < bars.length; i++) {
    const start = Math.floor((i / bars.length) * bins.length)
    const end = Math.max(start + 1, Math.floor(((i + 1) / bars.length) * bins.length))
    let peak = 0
    for (let bin = start; bin < end; bin++) peak = Math.max(peak, bins[bin])
    bars[i].style.transform = `scaleY(${((6 + (peak / 255) * 30) / 36).toFixed(2)})`
  }
}

function paintSky(now, level) {
  const fitted = fitSky()
  if (!fitted) return
  const { ctx, width, height } = fitted
  const awake = !!document.body.dataset.sound
  ctx.clearRect(0, 0, width, height)
  for (let i = 0; i < CLOUDS.length; i++) {
    const cloud = CLOUDS[i]
    const drift = sky.reduced ? 0 : Math.sin(now / 4200 + i) * 0.035
    const cx = (cloud.x + drift) * width
    const cy = (cloud.y + Math.cos(now / 5100 + i) * (sky.reduced ? 0 : 0.02)) * height
    const radius = Math.max(width, height) * (0.22 + level * 0.18)
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    const alpha = awake ? (0.015 + level * 0.06).toFixed(3) : "0"
    glow.addColorStop(0, `rgba(${cloud.color},${alpha})`)
    glow.addColorStop(1, `rgba(${cloud.color},0)`)
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, width, height)
  }
  if (!sky.stars.length) seedStars()
  for (const star of sky.stars) {
    const twinkle = sky.reduced ? 0.75 : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(now / 680 + star.phase))
    ctx.globalAlpha = Math.min(1, twinkle * (awake ? 0.55 + level * 1.15 : 0.55))
    ctx.fillStyle = star.hue
    ctx.beginPath()
    ctx.arc(star.x * width, star.y * height, star.r * (1 + level * 0.8), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  if (awake && document.body.dataset.sound === "play") {
    const x = (sky.beamX ?? -100) + 1
    {
      if (x > -20 && x < width + 20) {
        const beam = ctx.createLinearGradient(x, 0, x, height)
        beam.addColorStop(0, `rgba(255,255,255,${0.14 + level * 0.4})`)
        beam.addColorStop(0.45, `rgba(46,230,199,${0.08 + level * 0.22})`)
        beam.addColorStop(1, "rgba(180,77,255,0)")
        ctx.fillStyle = beam
        ctx.fillRect(x - 22, 0, 44, height)
      }
    }
  }
  if (awake && document.body.dataset.sound === "record") {
    const halo = ctx.createRadialGradient(width / 2, height * 0.58, 8, width / 2, height * 0.58, width * 0.46)
    halo.addColorStop(0, `rgba(255,77,141,${0.06 + level * 0.34})`)
    halo.addColorStop(0.55, `rgba(180,77,255,${0.04 + level * 0.14})`)
    halo.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, width, height)
  }
  if (!sky.reduced) {
    if (awake && level > 0.04 && sky.motes.length < 46 && Math.random() < level * 0.55) spawnMotes(1)
    for (const mote of sky.motes) {
      mote.x += mote.vx * (1 + level * 4)
      mote.y += mote.vy * (1 + level * 3)
      mote.life -= mote.decay
      ctx.globalAlpha = Math.max(0, mote.life) * (0.35 + level * 0.65)
      ctx.fillStyle = mote.hue
      ctx.beginPath()
      ctx.arc(mote.x * width, mote.y * height, mote.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    sky.motes = sky.motes.filter((mote) => mote.life > 0 && mote.y > -0.05)
  }
}

let waveCache = null

function waveFor(id) {
  if (!waveCache) {
    waveCache = new Map()
    for (const el of document.querySelectorAll(".wave[data-layer]")) waveCache.set(el.dataset.layer, el)
  }
  return waveCache.get(id) || null
}

// Only the few things that glow with the sound get the pulse, and only when
// it changes enough to see. Writing it on the whole page every frame made the
// browser restyle everything.
function setPulse(level) {
  const step = Math.round(level * 40) / 40
  if (setPulse.last === step) return
  setPulse.last = step
  const value = String(step)
  for (const id of ["playhead", "play-btn", "rec-btn"]) $(id)?.style.setProperty("--pulse", value)
  const mic = document.querySelector(".mic")
  if (mic) mic.style.setProperty("--pulse", value)
}

function drawSky(now) {
  const energy = readEnergy()
  sky.level += (energy - sky.level) * (sky.reduced ? 1 : 0.22)
  setPulse(sky.level)
  paintSky(now, sky.level)
  paintMeter()
  const awake = !!document.body.dataset.sound
  if (!awake && sky.level < 0.02 && !sky.motes.length) {
    sky.raf = 0
    setPulse(0)
    paintSky(now, 0)
    return
  }
  sky.raf = requestAnimationFrame(drawSky)
}

function beginSky(kind) {
  document.body.dataset.sound = kind
  fitSky()
  spawnMotes(kind === "record" ? 10 : 18)
  if (!sky.raf) sky.raf = requestAnimationFrame(drawSky)
}

function endSky() {
  if (playing || state.recording) return
  document.body.removeAttribute("data-sound")
}

function wakeSky() {
  if (playing || state.recording) {
    spawnMotes(12)
    return
  }
  beginSky("magic")
  window.setTimeout(() => {
    if (document.body.dataset.sound === "magic") endSky()
  }, 1400)
}

// The take is the microphone as it arrives, like Voice Memos: no booster,
// no limiter, nothing played back into the room while you record. The
// analyser here only drives the meter and the sky.
let captureLoaded = null

function captureReady() {
  const ctx = ac()
  if (!ctx.audioWorklet) return Promise.resolve(false)
  if (!captureLoaded) captureLoaded = ctx.audioWorklet.addModule("capture-worklet.js").then(() => true, () => false)
  return captureLoaded
}

// Records the raw microphone sample by sample and hands back a lossless WAV.
// It behaves like a MediaRecorder (state, stop, onstop) so the rest of the
// studio doesn't need to know. Returns null if this browser can't do it.
function startCapture(stream) {
  const ctx = ac()
  if (!ctx.audioWorklet || !sky.micSource) return null
  let node
  try {
    node = new AudioWorkletNode(ctx, "songbird-capture", { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] })
  } catch {
    return null
  }
  const quiet = ctx.createGain()
  quiet.gain.value = 0
  sky.micSource.connect(node)
  node.connect(quiet)
  quiet.connect(ctx.destination)
  const chunks = []
  const take = {
    state: "recording",
    mimeType: "audio/wav",
    firstSample: null,
    wav: null,
    onstop: null,
    ondataavailable: null,
    start() {},
    stop() {
      if (take.state !== "recording") return
      take.state = "inactive"
      node.port.postMessage("stop")
    },
  }
  node.port.onmessage = (event) => {
    const data = event.data || {}
    if (data.start != null) take.firstSample = data.start
    if (data.samples) chunks.push(data.samples)
    if (!data.done) return
    try { sky.micSource?.disconnect(node) } catch { /* already gone */ }
    try { node.disconnect() } catch { /* already gone */ }
    try { quiet.disconnect() } catch { /* already gone */ }
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const samples = new Float32Array(Math.max(1, total))
    let at = 0
    for (const chunk of chunks) {
      samples.set(chunk, at)
      at += chunk.length
    }
    cleanTake(samples, ctx.sampleRate)
    take.wav = new Blob([encodeWav(audioBuffer(samples, ctx.sampleRate))], { type: "audio/wav" })
    take.onstop?.()
  }
  return take
}

// The only clean-up on a take: remove rumble below the voice, and bring the
// level up so it plays back as loud and clear as a voice memo. Peaks land at
// -1 dB, and a quiet take is lifted at most 6×, so hiss isn't pulled up.
function cleanTake(samples, rate) {
  const cut = Math.exp((-2 * Math.PI * 40) / rate)
  let y = 0
  let x1 = 0
  let peak = 0
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i]
    y = cut * (y + x - x1)
    x1 = x
    samples[i] = y
    const level = Math.abs(y)
    if (level > peak) peak = level
  }
  if (peak < 1e-4) return samples
  const gain = Math.min(6, 0.89 / peak)
  for (let i = 0; i < samples.length; i++) samples[i] *= gain
  return samples
}

function armHotMic(stream) {
  releaseMic()
  const ctx = ac()
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  analyser.smoothingTimeConstant = 0.45
  source.connect(analyser)
  if (state.mode === "live") {
    const monitor = ctx.createGain()
    monitor.gain.value = 0.4
    source.connect(monitor)
    monitor.connect(ctx.destination)
    sky.monitor = monitor
  }
  sky.micSource = source
  sky.micAnalyser = analyser
  sky.micBins = new Uint8Array(analyser.frequencyBinCount)
  return stream
}

function rideInput() {
  const raw = sky.rawAnalyser
  const makeup = sky.makeup
  const time = sky.rawTime
  if (!raw || !makeup || !time || !state.recording) return
  raw.getByteTimeDomainData(time)
  let peak = 0
  for (let i = 0; i < time.length; i++) {
    const sample = Math.abs(time[i] - 128) / 128
    if (sample > peak) peak = sample
  }
  const noise = sky.noisePeak || peak
  sky.noisePeak = peak < noise ? noise * 0.85 + peak * 0.15 : noise * 0.998 + peak * 0.002
  const desired = typeof SongbirdMusic !== "undefined" && SongbirdMusic.inputMakeup
    ? SongbirdMusic.inputMakeup(peak, sky.noisePeak)
    : 1.15
  makeup.gain.value += (desired - makeup.gain.value) * 0.18
}

function releaseMic() {
  window.setTimeout(keepSpeakerOn, 0)
  try { sky.micSource?.disconnect() } catch { /* already released */ }
  try { sky.rumble?.disconnect() } catch { /* already released */ }
  try { sky.makeup?.disconnect() } catch { /* already released */ }
  try { sky.limiter?.disconnect() } catch { /* already released */ }
  try { sky.monitor?.disconnect() } catch { /* already released */ }
  try { sky.micDest?.stream?.getTracks().forEach((track) => track.stop()) } catch { /* already released */ }
  sky.micSource = null
  sky.rumble = null
  sky.noisePeak = null
  sky.rawAnalyser = null
  sky.rawTime = null
  sky.makeup = null
  sky.limiter = null
  sky.micDest = null
  sky.micAnalyser = null
  sky.micBins = null
  sky.monitor = null
}

function capture() {
  return JSON.stringify({
    layers: state.layers,
    lengthSec: state.lengthSec,
    shape: state.shape,
    intent: state.intent,
    playAt: state.playAt,
    section: state.section,
    sectionMode: state.sectionMode,
    sections: state.sections,
  })
}

function snapshot(layerIds) {
  const audio = {}
  for (const id of layerIds || []) {
    const buf = buffers.get(id + ":audio")
    if (buf) audio[id] = buf
  }
  undoStack.push({ raw: capture(), audio })
  if (undoStack.length > 30) undoStack.shift()
  redoStack = []
}

function restore(entry) {
  const raw = typeof entry === "string" ? entry : entry.raw
  const audio = entry && typeof entry === "object" ? entry.audio : null
  const data = JSON.parse(raw)
  const wasPlaying = playing
  if (Array.isArray(data)) {
    state.layers = data
  } else {
    state.layers = data.layers
    state.lengthSec = data.lengthSec
    state.shape = data.shape
    state.intent = data.intent
    if (typeof data.playAt === "number") state.playAt = data.playAt
    if ("section" in data) state.section = data.section
    if (data.sectionMode) state.sectionMode = data.sectionMode
    if ("sections" in data) state.sections = data.sections
  }
  if (!state.layers.some((layer) => layer.id === state.selected)) state.selected = state.layers[0]?.id ?? null
  if (audio) {
    for (const [id, buf] of Object.entries(audio)) buffers.set(id + ":audio", buf)
  }
  renderPlanNote()
  renderRuler()
  renderTracks()
  renderInspector()
  if (wasPlaying) play(state.playAt || 0)
  else hearLayers()
}

function setScreen(screen) {
  state.screen = screen
  document.body.dataset.screen = screen
}

function syncLoopChip() {
  const chip = $("loop-btn")
  if (!chip) return
  chip.classList.toggle("on", state.looper)
  chip.setAttribute("aria-pressed", state.looper ? "true" : "false")
}

function syncDock() {
  const open = document.body.classList.contains("sheet-open")
  document.querySelectorAll(".dock-btn").forEach((button) => {
    const on = open && button.dataset.panel === state.panel
    button.classList.toggle("on", on)
    button.setAttribute("aria-pressed", on ? "true" : "false")
  })
}

function showInspector() {
  document.body.classList.remove("inspector-closed")
  document.body.classList.add("sheet-open")
  syncDock()
}

function setPanel(panel) {
  state.panel = panel
  showInspector()
  renderInspector()
}

function closePanel() {
  document.body.classList.remove("sheet-open")
  document.body.classList.add("inspector-closed")
  syncDock()
}

function shareDetail(song) {
  const emails = songEmails(song)
  if (!emails.length) return "Shared"
  return `Shared with ${emails.join(", ")}`
}

function renderShareBox(song) {
  if (state.deleteFor === song.id) {
    return `<div class="share-box">
      <p class="warn">Delete ${esc(song.title)}? This removes it from the list.</p>
      <div class="row">
        ${dangerButton("Delete", `data-action="confirm-delete" data-id="${song.id}"`)}
        ${outlinedButton("Keep it", `data-action="cancel-song"`)}
      </div>
    </div>`
  }
  if (state.shareFor !== song.id) return ""
  const emails = songEmails(song)
  return `<div class="share-box">
    <p class="hint">Add their email. Songbird opens your mail app with a message to them, and saves the address on this song.</p>
    ${emails.length ? `<p class="hint">${emails.map((email) => esc(email)).join(", ")}</p>` : ""}
    ${state.shareNote ? `<p class="hint">${esc(state.shareNote)}</p>` : ""}
    <div class="share-row">
      <input class="share-email" type="email" data-id="${song.id}" placeholder="name@email.com" aria-label="Email address" value="${esc(state.shareDraft || "")}" />
      ${filledButton("Share", `data-action="add-share" data-id="${song.id}"`)}
    </div>
  </div>`
}

function songCard(song) {
  const meta = song.demo ? song.line || "Press play" : shareDetail(song)
  const badge = song.demo ? "Example" : songEmails(song).length ? "Shared" : "Yours"
  const manage = song.demo
    ? ""
    : `<div class="song-actions">
        ${outlinedButton("Share", `data-action="share-song" data-id="${song.id}"`)}
        ${dangerButton("Delete", `data-action="ask-delete" data-id="${song.id}"`)}
      </div>`
  const byline = song.author ? (song.demo ? `${song.author} · Original` : song.author) : ""
  return `<article class="song">
        <button class="song-open" data-action="open-song" data-id="${song.id}">
          <span class="swatch" style="background:linear-gradient(135deg,#34D399,#F9A8D4)"></span>
          <span class="song-copy"><b>${esc(song.title)}</b><span class="meta">${esc(meta)}</span></span>
          <span class="badge">${badge}</span>
          ${byline ? `<span class="byline">${esc(byline)}</span>` : ""}
        </button>
        ${manage}
        ${renderShareBox(song)}
      </article>`
}

function renderSongs() {
  const q = state.query.trim().toLowerCase()
  const list = $("song-list")
  const songs = state.songs.filter((song) => `${song.title} ${song.line || ""} ${song.author || ""} ${song.credit || ""}`.toLowerCase().includes(q))
  if (!songs.length) {
    list.innerHTML = `<p class="empty">Make your first sound.</p>`
    return
  }
  const yours = songs.filter((song) => !song.demo)
  const examples = songs.filter((song) => song.demo)
  const section = (title, items) => (items.length ? `<p class="ask list-label">${title}</p>${items.map(songCard).join("")}` : "")
  list.innerHTML = section("Your songs", yours) + section("Examples", examples)
}

function renderProjectActions() {
  const box = $("project-actions")
  if (!box) return
  const song = state.song
  if (!song) {
    box.innerHTML = ""
    return
  }
  box.innerHTML = `<div class="song-actions">
      ${outlinedButton("Share", `data-action="share-song" data-id="${song.id}"`)}
      ${dangerButton("Delete", `data-action="ask-delete" data-id="${song.id}"`)}
    </div>
    ${renderShareBox(song)}`
}

function shareSong(id, raw) {
  const song = state.songs.find((item) => item.id === id)
  if (!song) return
  const email = String(raw || "").trim().toLowerCase()
  if (!validEmail(email)) {
    state.shareFor = id
    state.shareDraft = String(raw || "")
    state.shareNote = "Enter an email address like name@email.com."
    $("save-status").textContent = state.shareNote
    renderSongs()
    renderProjectActions()
    return
  }
  const emails = songEmails(song)
  if (!emails.includes(email)) emails.push(email)
  song.sharedWith = emails
  song.privacy = "Shared"
  if (song.demo) saveDemoShare(song)
  else saveSongs()
  state.shareFor = id
  state.shareDraft = ""
  state.deleteFor = null
  const page = "https://wkotlewski.github.io/songbird-studio/"
  const subject = encodeURIComponent(`Songbird: ${song.title}`)
  const body = encodeURIComponent(`${song.title} is in Songbird.\n\nOpen Songbird: ${page}\n\nThe song stays on the device where it was made. Attach the song file from Finish if you want them to hear it.`)
  const link = document.createElement("a")
  link.href = `mailto:${email}?subject=${subject}&body=${body}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  state.shareNote = `Your mail app is opening a message to ${email}. The address is saved on this song in this browser.`
  $("save-status").textContent = state.shareNote
  renderSongs()
  renderProjectActions()
}

function deleteSong(id) {
  const song = state.songs.find((item) => item.id === id)
  if (!song) return
  if (song.demo) {
    const hidden = hiddenIds()
    if (!hidden.includes(id)) hidden.push(id)
    localStorage.setItem("songbird-hidden", JSON.stringify(hidden))
    const shares = shareMap()
    delete shares[id]
    localStorage.setItem("songbird-shares", JSON.stringify(shares))
  }
  state.songs = state.songs.filter((item) => item.id !== id)
  if (!song.demo) {
    saveSongs()
    void deleteSongAudio(id)
  }
  state.shareFor = null
  state.deleteFor = null
  if (state.song?.id === id) {
    stopPlayback()
    dropLayerAudio()
    state.song = null
    state.layers = []
    state.selected = null
    setScreen("library")
    closePanel()
    if ($("song-title")) $("song-title").value = "Untitled song"
    if ($("song-author")) $("song-author").value = ""
    if ($("song-credit")) $("song-credit").textContent = ""
    renderTracks()
    renderInspector()
  }
  $("save-status").textContent = `${song.title} was deleted.`
  renderSongs()
  renderProjectActions()
}

function layoutTimeline() {
  const total = spanSeconds()
  const width = Math.round(Math.max(980, Math.round(total * 8) + 180) * (state.zoom || 1))
  state.span = total
  state.trackWidth = width
  const inner = document.querySelector(".timeline-inner")
  if (inner) inner.style.width = `${width}px`
  return { total, width }
}

function songSeconds(now) {
  return playFrom + Math.max(0, now - playStarted)
}

function songWideSections() {
  if (Array.isArray(state.sections) && state.sections.length) {
    return state.sections.map((section, index) => ({
      id: section.id,
      name: section.name || `Part ${index + 1}`,
      start: section.start,
      end: section.end,
      color: BAND_COLOR[section.name] || (index % 2 ? "#F9A8D4" : "#34D399"),
    }))
  }
  const shape = SHAPES[state.shape]
  if (shape) {
    return shape.bands.map(([name, start, end], index) => ({
      id: `${name}-${index}`,
      name,
      start,
      end,
      color: BAND_COLOR[name] || "#34D399",
    }))
  }
  const total = spanSeconds()
  const parts = total <= 45 ? 2 : total <= 90 ? 3 : 4
  return Array.from({ length: parts }, (_, index) => ({
    id: `part-${index}`,
    name: `Part ${index + 1}`,
    start: index / parts,
    end: (index + 1) / parts,
    color: index % 2 ? "#F59AD4" : "#34D399",
  }))
}

function recordGuide() {
  const live = state.recording || state.counting
  const pending = !live && !!pendingBlob
  if (!live && !pending) return null
  const elapsed = state.recording && recStarted
    ? Math.max(0, (performance.now() - recStarted) / 1000)
    : pending
      ? recordedSeconds
      : 0
  const loopLen = Math.max(60, elapsed)
  return {
    origin: Math.max(0, recordOrigin || 0),
    elapsed,
    loopLen,
    loopAt: Math.max(0, recordOrigin || 0) + loopLen,
  }
}

function spanSeconds() {
  let total = state.lengthSec || 0
  for (const layer of state.layers) {
    const end = layer.range?.end || layer.lengthSec || 0
    if (end > total) total = end
  }
  const guide = recordGuide()
  if (guide && guide.loopAt > total) {
    total = guide.elapsed > 60 ? Math.ceil(guide.loopAt / 10) * 10 : guide.loopAt
  }
  return total || state.span || 40
}

function layerSpan(layer) {
  const song = spanSeconds()
  if (!layer) return { start: 0, length: song, song }
  if (layer.range && layer.range.end > layer.range.start) {
    return { start: layer.range.start, length: layer.range.end - layer.range.start, song }
  }
  return { start: 0, length: layer.lengthSec || song, song }
}

function songSections() {
  const layer = selectedLayer()
  if (layer?.sections?.length) {
    const box = layerSpan(layer)
    return layer.sections.map((section, index) => ({
      id: section.id,
      name: section.name || `Part ${index + 1}`,
      start: (box.start + section.start * box.length) / box.song,
      end: (box.start + section.end * box.length) / box.song,
      color: BAND_COLOR[section.name] || (index % 2 ? "#F9A8D4" : "#34D399"),
    }))
  }
  return songWideSections()
}

function ensureLayerSections(layer) {
  if (Array.isArray(layer.sections) && layer.sections.length) return layer.sections
  const box = layerSpan(layer)
  const wide = songWideSections()
  const mapped = wide.map((section) => {
    const start = Math.max(0, Math.min(1, (section.start * box.song - box.start) / box.length))
    const end = Math.max(0, Math.min(1, (section.end * box.song - box.start) / box.length))
    return { id: section.id, name: section.name, start, end }
  }).filter((section) => section.end - section.start > 0.02)
  layer.sections = mapped.length ? mapped : [{ id: uid(), name: "Part 1", start: 0, end: 1 }]
  return layer.sections
}

function ensureCustomSections() {
  const layer = selectedLayer()
  if (layer) return ensureLayerSections(layer)
  if (Array.isArray(state.sections) && state.sections.length) return state.sections
  state.sections = songWideSections().map((section) => ({
    id: section.id,
    name: section.name,
    start: section.start,
    end: section.end,
  }))
  return state.sections
}

function nameSection(id, raw, commit) {
  const sections = ensureCustomSections()
  const section = sections.find((item) => item.id === id)
  if (!section) return
  const typed = String(raw ?? "")
  const cleaned = typed.trim().slice(0, 32)
  if (commit) {
    section.name = cleaned || "Part"
    rememberSong()
    $("save-status").textContent = `Section named ${section.name}.`
  } else if (cleaned) {
    section.name = cleaned
  }
  const shown = songSections().find((item) => item.id === id) || section
  document.querySelectorAll(`.section[data-id="${id}"]`).forEach((button) => {
    button.textContent = section.name
    button.title = `${section.name}, ${sectionClock(shown)}`
  })
  document.querySelectorAll(`.section-name[data-section="${id}"]`).forEach((field) => {
    if (field !== document.activeElement) field.value = section.name
  })
}

function addSection() {
  const layer = selectedLayer()
  const sections = ensureCustomSections()
  const box = layer ? layerSpan(layer) : { start: 0, length: spanSeconds() }
  const at = layer
    ? Math.min(0.98, Math.max(0.02, ((state.playAt || 0) - box.start) / box.length))
    : Math.min(0.98, Math.max(0.02, (state.playAt || 0) / spanSeconds()))
  let index = sections.findIndex((section) => at > section.start + 0.01 && at < section.end - 0.01)
  if (index < 0) index = sections.findIndex((section) => section.id === state.section)
  if (index < 0) index = sections.length - 1
  const section = sections[index]
  const minFrac = Math.max(0.04, 2 / box.length)
  const cut = at > section.start + minFrac && at < section.end - minFrac ? at : (section.start + section.end) / 2
  if (cut - section.start < minFrac || section.end - cut < minFrac) {
    $("save-status").textContent = "That part is too short to split. Move the play line into a longer part."
    return
  }
  snapshot()
  const created = { id: uid(), name: "New part", start: cut, end: section.end }
  section.end = cut
  sections.splice(index + 1, 0, created)
  state.section = created.id
  rememberSong()
  renderRuler()
  const field = document.querySelector(".section-name")
  if (field) {
    field.focus()
    field.select()
  }
  $("save-status").textContent = "New part added. Type a name, then click away."
}

function removeSection(id) {
  const layer = selectedLayer()
  const sections = ensureCustomSections()
  if (sections.length < 2) {
    $("save-status").textContent = layer
      ? `Add a section to split ${layer.name}, then delete the part you don't want.`
      : "Add a section first."
    return
  }
  const index = sections.findIndex((section) => section.id === id)
  if (index < 0) return
  const section = sections[index]
  snapshot(layer ? [layer.id] : [])
  if (layer) {
    const box = layerSpan(layer)
    layer.gaps = mergeGaps([...(layer.gaps || []), {
      start: box.start + section.start * box.length,
      end: box.start + section.end * box.length,
    }])
  }
  const removed = section.name || "That part"
  if (index === 0) sections[1].start = sections[0].start
  else sections[index - 1].end = sections[index].end
  sections.splice(index, 1)
  state.section = sections[Math.max(0, index - 1)].id
  rememberSong()
  renderRuler()
  renderTracks()
  if (playing && layer) play(state.playAt || 0)
  $("save-status").textContent = layer
    ? `${removed} is out of ${layer.name}. The rest stays in time. Undo puts it back.`
    : `${sections.find((item) => item.id === state.section)?.name || "That part"} now covers the space.`
}

function activeSection() {
  if (!state.section) return null
  return songSections().find((section) => section.id === state.section) || null
}

function mergeGaps(gaps) {
  const sorted = gaps
    .map((gap) => ({ start: Number(gap.start) || 0, end: Number(gap.end) || 0 }))
    .filter((gap) => gap.end > gap.start + 0.01)
    .sort((a, b) => a.start - b.start)
  const out = []
  for (const gap of sorted) {
    const last = out[out.length - 1]
    if (last && gap.start <= last.end + 0.02) last.end = Math.max(last.end, gap.end)
    else out.push({ start: gap.start, end: gap.end })
  }
  return out
}

function sectionClock(section) {
  const span = spanSeconds()
  return `${formatClock(section.start * span)}–${formatClock(section.end * span)}`
}

// The lane's place on screen only changes when the timeline is drawn again
// or the window changes size, so it is measured then, not on every frame.
let laneCache = null

function forgetLane() {
  laneCache = null
}

function laneBox() {
  if (laneCache) return laneCache
  const measured = measureLane()
  if (measured.real) laneCache = measured
  return measured
}

function measureLane() {
  const inner = document.querySelector(".timeline-inner")
  const lane = document.querySelector(".lane") || document.querySelector(".shape-row")
  if (lane && inner && lane.getBoundingClientRect && inner.getBoundingClientRect) {
    const laneRect = lane.getBoundingClientRect()
    const innerRect = inner.getBoundingClientRect()
    const width = lane.clientWidth || laneRect.width
    if (width > 20) return { left: laneRect.left - innerRect.left, width, real: true }
  }
  return { left: 164, width: Math.max(1, state.trackWidth - 190) }
}

function timeAt(clientX) {
  const inner = document.querySelector(".timeline-inner")
  if (!inner?.getBoundingClientRect) return state.playAt || 0
  const box = laneBox()
  const x = clientX - inner.getBoundingClientRect().left - box.left
  const span = spanSeconds()
  return Math.min(span, Math.max(0, (x / box.width) * span))
}

function revealPlayhead() {
  const timeline = $("timeline")
  const head = $("playhead")
  if (!timeline || !head) return
  const x = state.headX || 0
  const left = timeline.scrollLeft
  const right = left + timeline.clientWidth
  if (x < left + 96 || x > right - 96) timeline.scrollLeft = Math.max(0, x - timeline.clientWidth * 0.32)
}

function jumpSection(direction) {
  const span = spanSeconds()
  const sections = songSections()
  const now = state.playAt || 0
  let target = now
  let landed = null
  if (!sections.length) {
    const step = Math.max(4, span / 8)
    target = direction < 0 ? Math.max(0, now - step) : Math.min(Math.max(0, span - 0.05), now + step)
  } else if (direction < 0) {
    let index = sections.findIndex((section) => now < section.end * span - 0.05)
    if (index < 0) index = sections.length - 1
    const start = sections[index].start * span
    if (index === 0 && now - start <= 1.5) {
      $("save-status").textContent = "That's the start."
      return
    }
    if (now - start > 1.5) landed = sections[index]
    else if (index > 0) landed = sections[index - 1]
    else landed = sections[0]
    target = landed.start * span
  } else {
    const next = sections.find((section) => section.start * span > now + 0.2)
    if (!next) {
      $("save-status").textContent = "That's the last part."
      return
    }
    landed = next
    target = next.start * span
  }
  const wasPlaying = playing
  if (landed) state.section = landed.id
  placePlayhead(target)
  renderRuler()
  revealPlayhead()
  if (wasPlaying) play(target)
  if (!wasPlaying || playing) $("save-status").textContent = landed ? `${landed.name} · ${sectionClock(landed)}` : formatClock(target)
}

function placePlayhead(seconds, moving) {
  const span = spanSeconds()
  const clamped = Math.min(span, Math.max(0, Number(seconds) || 0))
  state.playAt = clamped
  const head = $("playhead")
  if (head) {
    const box = laneBox()
    const x = box.left + (clamped / span) * box.width
    state.headX = x
    // While the song plays, the play line moves on the compositor.
    head.style.left = "0px"
    head.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`
  }
  if (!moving) paintSelection()
}

function paintSelection() {
  const inner = document.querySelector(".timeline-inner")
  if (!inner) return
  let band = inner.querySelector(".selection")
  if (!band) {
    band = document.createElement("div")
    band.className = "selection"
    inner.appendChild(band)
  }
  const section = activeSection()
  if (!section) {
    band.hidden = true
    return
  }
  const box = laneBox()
  band.hidden = false
  band.style.left = `${box.left + section.start * box.width}px`
  band.style.width = `${Math.max(8, (section.end - section.start) * box.width)}px`
}

function fillLayerWithSection() {
  const section = activeSection()
  const layer = selectedLayer()
  if (!section) {
    $("save-status").textContent = "Select a section first."
    return
  }
  if (!layer) {
    $("save-status").textContent = "Select a layer to fill."
    return
  }
  const buffer = buffers.get(layer.id + ":audio")
  if (!buffer) {
    $("save-status").textContent = `${layer.name} has no recording to loop.`
    return
  }
  const span = spanSeconds()
  const made = SongbirdMusic.fillWithSection(buffer.getChannelData(0), buffer.sampleRate, {
    songLength: span,
    rangeStart: layer.range ? layer.range.start : 0,
    rangeEnd: layer.range ? layer.range.end : span,
    sectionStart: section.start * span,
    sectionEnd: section.end * span,
    gaps: layer.gaps || [],
  })
  if (!made) {
    $("save-status").textContent = `${section.name} doesn't sit on ${layer.name}. Nothing changed.`
    return
  }
  if (made.unchanged) {
    $("save-status").textContent = `${section.name} already covers ${layer.name}.`
    return
  }
  snapshot([layer.id])
  const passLength = Math.round((Math.min(section.end * span, layer.range ? layer.range.end : span) - Math.max(section.start * span, layer.range ? layer.range.start : 0)) * buffer.sampleRate)
  buffers.set(layer.id + ":audio", loopedBuffer(made.samples, buffer.sampleRate, passLength))
  layer.peaks = peaksFromSamples(made.samples)
  layer.range = null
  layer.gaps = []
  layer.from = `filled with ${section.name}`
  rememberSong()
  state.arrived = null
  renderTracks()
  renderRuler()
  const filledId = layer.id
  requestAnimationFrame(() => {
    state.arrived = filledId
    renderTracks()
  })
  $("save-status").textContent = `${section.name} now fills ${layer.name}. Undo puts the layer back.`
  if (playing) play(state.playAt || 0)
}

function applySectionToLayer(layer) {
  const section = activeSection()
  if (!section) return null
  const span = spanSeconds()
  layer.range = { start: section.start * span, end: section.end * span }
  layer.from = [layer.from, section.name].filter(Boolean).join(" · ")
  if (state.sectionMode === "replace") {
    for (const other of state.layers) {
      if (other.id === layer.id) continue
      other.gaps = mergeGaps([...(other.gaps || []), layer.range])
    }
  }
  return section
}

function renderPlanNote() {
  const note = document.querySelector(".note")
  if (!note) return
  if (state.song?.demo && state.heard) {
    note.textContent = state.heard
    return
  }
  if (!state.lengthSec) {
    note.textContent = "Drag the play line, or click a section to jump there. Add a section, or rename the one you selected. Open Build to set a length and a shape."
    return
  }
  if (!state.shape) {
    note.textContent = `${formatClock(state.lengthSec)}. Drag the play line or click a section. Recordings loop to this length.`
    return
  }
  const shape = SHAPES[state.shape]
  note.textContent = `${formatClock(state.lengthSec)} · ${shape.name}. Drag the play line or click a section. Loudness follows the shape.`
}

function renderRuler() {
  forgetLane()
  const { total } = layoutTimeline()
  const step = total <= 45 ? 5 : total <= 90 ? 10 : total <= 180 ? 15 : 30
  const marks = []
  for (let t = 0; t < total - 0.5; t += step) marks.push(`<span>${formatClock(t)}</span>`)
  marks.push(`<span>${formatClock(total)}</span>`)
  if (state.section && !activeSection()) state.section = null
  const sections = songSections()
  const current = activeSection()
  const bands = `<div class="shape-row">${sections
    .map((section) => {
      const on = state.section === section.id
      return `<button class="section ${on ? "on" : ""}" data-action="pick-section" data-id="${esc(section.id)}" style="width:${(section.end - section.start) * 100}%" title="${esc(section.name)}, ${sectionClock(section)}">${esc(section.name)}</button>`
    })
    .join("")}</div>`
  const tools = `<div class="section-tools">
        <p class="hint section-guide">${state.looper ? "Each take loops for the whole song, like a loop pedal." : "A kept recording becomes 1:00 on that layer."} Select a section of the layer and delete it if you don't want that part.</p>
        ${current ? `<input class="section-name" data-section="${esc(current.id)}" value="${esc(current.name)}" maxlength="32" aria-label="Section name" />` : ""}
        ${outlinedButton("Add a section", `data-action="add-section"`)}
        ${current ? outlinedButton("Delete section", `data-action="remove-section" data-id="${esc(current.id)}"`) : ""}
        ${current ? `${filterChip("Add onto this part", `data-action="section-mode" data-mode="add"`, state.sectionMode === "add")}
        ${filterChip("Change this part", `data-action="section-mode" data-mode="replace"`, state.sectionMode === "replace")}
        ${outlinedButton("Fill layer with this section", `data-action="fill-section"`)}
        ${outlinedButton("Whole song", `data-action="whole-song"`)}` : ""}
      </div>`
  const beat = 60 / (state.bpm || 92)
  const ticks = []
  for (let t = 0; t <= total + 0.01; t += beat * 4) ticks.push(`<i style="left:${(t / total) * 100}%"></i>`)
  const zoom = [1, 1.5, 2].map((level) => filterChip(level === 1 ? "Fit" : `${level}×`, `data-action="zoom" data-zoom="${level}" title="Timeline zoom"`, (state.zoom || 1) === level)).join("")
  $("ruler").innerHTML = `<div class="ruler-layout"><div class="ruler-gutter">Sections</div><div class="ruler-main">${bands}${tools}<div class="ruler-tools"><div class="beats" aria-hidden="true">${ticks.join("")}</div><div class="zoom">${zoom}</div></div><div class="ruler-marks">${marks.join("")}</div></div></div>`
  placePlayhead(state.playAt || 0)
}

function shapedPeaks(layer) {
  const src = layer.peaks?.length ? layer.peaks : [0.4]
  if (!state.lengthSec) return src
  const count = Math.max(40, Math.round((state.trackWidth - 190) / 6))
  const out = []
  for (let i = 0; i < count; i++) {
    const frac = count === 1 ? 0 : i / (count - 1)
    const shapeId = layer.shape || state.shape
    const level = shapeId ? levelAt(shapeId, frac) : 1
    out.push(Math.max(0.08, Math.min(1, src[i % src.length] * level)))
  }
  return out
}

function recordingTrack() {
  const guide = recordGuide()
  if (!guide) return ""
  const clock = state.counting
    ? `Loop ends ${formatClock(guide.loopAt)}`
    : `${formatClock(guide.elapsed)} recorded · loop ends ${formatClock(guide.loopAt)}`
  return `<div class="track recording-live" aria-label="Recording">
      <div class="track-label">
        <div class="label-top"><span class="layer-name">Recording</span></div>
        <div class="track-meta">
          <small class="role">This take</small>
          <small id="rec-layer-clock">${clock}</small>
        </div>
      </div>
      <div class="lane" id="rec-lane"></div>
    </div>`
}

function paintRecordGuide() {
  const guide = recordGuide()
  const lane = $("rec-lane")
  if (!guide || !lane) return
  const span = Math.max(0.05, spanSeconds())
  if (!lane.querySelector(".rec-loop")) {
    lane.innerHTML = `<i class="rec-loop"></i><i class="rec-so-far"></i><i class="rec-end"><span></span></i>`
  }
  const loop = lane.querySelector(".rec-loop")
  const soFar = lane.querySelector(".rec-so-far")
  const end = lane.querySelector(".rec-end")
  const label = end?.querySelector("span")
  const origin = (guide.origin / span) * 100
  const loopWidth = (guide.loopLen / span) * 100
  const heard = (Math.min(guide.elapsed, guide.loopLen) / span) * 100
  if (loop) {
    loop.style.left = `${origin}%`
    loop.style.width = `${Math.max(0.4, loopWidth)}%`
  }
  if (soFar) {
    soFar.style.left = `${origin}%`
    soFar.style.width = `${state.counting ? 0 : Math.max(0.3, heard)}%`
  }
  if (end) {
    end.style.left = `${origin + loopWidth}%`
    end.title = guide.elapsed < 59.5
      ? `Keeping this take loops it to ${formatClock(guide.loopAt)}.`
      : `This take ends at ${formatClock(guide.loopAt)}.`
  }
  if (label) {
    label.textContent = guide.elapsed < 59.5 ? `Loop ends ${formatClock(guide.loopAt)}` : `Ends ${formatClock(guide.loopAt)}`
    const nearEnd = (guide.loopAt / span) > 0.78
    label.style.left = nearEnd ? "auto" : "6px"
    label.style.right = nearEnd ? "6px" : "auto"
  }
  const clock = $("rec-layer-clock")
  if (clock) {
    clock.textContent = state.counting
      ? `Loop ends ${formatClock(guide.loopAt)}`
      : `${formatClock(guide.elapsed)} recorded · loop ends ${formatClock(guide.loopAt)}`
  }
}

function syncRecordGuide() {
  const guide = recordGuide()
  if (!guide) return
  if (guide.loopAt > (state.span || 0) + 0.35 || !$("rec-lane")) {
    renderRuler()
    renderTracks()
    return
  }
  paintRecordGuide()
}

function renderTracks() {
  forgetLane()
  waveCache = null
  const box = $("tracks")
  const guideRow = recordingTrack()
  if (!state.layers.length && !guideRow) {
    box.innerHTML = `<p class="empty">Make your first sound. ${state.looper ? "Hum, clap, beatbox, or play a few bars. They loop, and you stack the next layer on top." : "Record, then keep the take on the timeline."}</p>`
    return
  }
  const span = spanSeconds()
  const soloing = state.layers.some((item) => item.solo)
  const banner = soloing ? `<p class="hearing-note">Solo is on. Bright layers are playing. Dim layers are quiet.</p>` : ""
  box.innerHTML = banner + state.layers
    .map((layer) => {
      const range = layer.range
      const boxStyle = range
        ? { left: (range.start / span) * 100, width: ((range.end - range.start) / span) * 100 }
        : null
      const gaps = (layer.gaps || [])
        .map((gap) => `<i class="gap" style="left:${(gap.start / span) * 100}%;width:${((gap.end - gap.start) / span) * 100}%"></i>`)
        .join("")
      const edited = Boolean(layer.from) && !(layer.loop && !layer.transformed && /^loop · \d+ bars?$/.test(layer.from))
      const hear = hearingMark(layer)
      const waveColor = !hear.className || hear.className === "hearing"
        ? (layer.id === state.selected ? "#F9A8D4" : "#34D399")
        : "rgba(255,251,242,0.28)"
      return `<div class="track ${layer.id === state.selected ? "selected" : ""} ${layer.id === state.arrived ? "arrived" : ""} ${layer.mute ? "muted" : ""} ${layer.solo ? "solo" : ""} ${hear.className} ${edited ? "edited" : "original"}" data-id="${layer.id}" data-hearing="${hear.className === "quiet" ? "quiet" : "playing"}">
        <div class="track-label">
          <div class="label-top">
            <input class="layer-name" data-rename="${layer.id}" value="${esc(layer.name)}" maxlength="40" aria-label="Name this layer" />
            <button type="button" class="layer-delete" data-action="delete-layer" data-id="${layer.id}" aria-label="Delete ${esc(layer.name)}">×</button>
          </div>
          <button class="track-meta" data-action="select-layer" data-id="${layer.id}">
            <small class="role">${edited ? "Edited" : "Original"}</small>
            <small>${esc(layer.sound || "Layer")}${layer.from ? ` · ${esc(layer.from)}` : ""}${layer.live ? "" : " · layout"}</small>
            ${hear.label ? `<small class="hear-state">${hear.label}</small>` : ""}
          </button>
        </div>
        <div class="lane">${gaps}${wave(shapedPeaks(layer), waveColor, layer.id, boxStyle)}</div>
      </div>`
    })
    .join("") + guideRow
  placePlayhead(state.playAt || 0)
  paintRecordGuide()
}

function slider(label, key, min, max, step, value, id, readout) {
  const mark = readout == null ? value : readout
  const layerId = id ? ` data-id="${id}" data-mix="1"` : ""
  return `<label class="field">${label}
    <input class="slider" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-action="set-${key}"${layerId} aria-label="${esc(label)}" />
    <span>${mark}</span>
  </label>`
}

function nameLayer(id, raw, commit) {
  const layer = state.layers.find((item) => item.id === id)
  if (!layer) return
  const typed = String(raw ?? "")
  const cleaned = typed.trim().slice(0, 40)
  if (commit) {
    layer.name = cleaned || layer.sound || "Layer"
    rememberSong()
    $("save-status").textContent = `Layer named ${layer.name}.`
  } else if (cleaned) {
    layer.name = cleaned
  }
  document.querySelectorAll(`[data-rename="${id}"]`).forEach((field) => {
    if (field !== document.activeElement) field.value = layer.name
  })
  document.querySelectorAll(`.strip-name[data-id="${id}"]`).forEach((button) => {
    button.textContent = layer.name
  })
}

function selectedLayer() {
  return state.layers.find((layer) => layer.id === state.selected) ?? state.layers[0]
}

const MIX_PARTS = {
  vocal: { name: "Vocals up front", line: "Clear, centered, and a little bright.", gain: 0.84, pan: 0, low: -1, high: 3, space: 0.16 },
  instrument: { name: "Instruments sit back", line: "Under the voice, panned slightly apart.", gain: 0.46, pan: "spread", low: 0, high: -1, space: 0.2 },
  drums: { name: "Drums punchy", line: "Dry, centered, and easy to feel.", gain: 0.7, pan: 0, low: 2, high: 1, space: 0.02 },
  bass: { name: "Bass solid", line: "Centered, with more low end.", gain: 0.62, pan: 0, low: 4, high: -2, space: 0 },
  choir: { name: "Choir wide", line: "Softer, off to one side, in more space.", gain: 0.5, pan: 0.38, low: -1, high: 1, space: 0.42 },
}

const SONG_MIXES = {
  clear: { name: "Clear and close", line: "Voice in front. Little space. Instruments quieter." },
  big: { name: "Big and full", line: "More space around the voice and choir. Drums stay dry." },
  soft: { name: "Soft room", line: "Quieter, with a gentle space, and the voice still leads." },
}

const SONG_SCALE = {
  clear: { vocal: [0.84, 0, -1, 2.5, 0.08], choir: [0.4, 0.18, -1, 0, 0.14], drums: [0.66, 0, 1, 0.5, 0], bass: [0.58, 0, 3, -2, 0], instrument: [0.4, "spread", 0, -1, 0.08] },
  big: { vocal: [0.78, 0, 0, 2, 0.34], choir: [0.56, 0.42, -1, 1, 0.5], drums: [0.72, 0, 2, 1, 0.05], bass: [0.66, 0, 4, -1, 0.04], instrument: [0.52, "spread", 1, 0, 0.28] },
  soft: { vocal: [0.68, 0, -1, 1, 0.26], choir: [0.38, 0.28, -2, 0, 0.4], drums: [0.44, 0, 0, -1, 0.1], bass: [0.46, 0, 2, -2, 0.04], instrument: [0.34, "spread", -1, -1, 0.28] },
}

function isVocalLayer(layer) {
  if (!layer) return false
  const text = `${layer.sound || ""} ${layer.name || ""}`.toLowerCase()
  if (/drum|clap|kit|bass|beatbox|guitar|piano|rhodes|horn|choir/.test(text)) return false
  return /voice|vocal|sing|hum/.test(text)
}

function mixFamily(layer) {
  const text = `${layer.sound || ""} ${layer.name || ""}`.toLowerCase()
  if (/choir/.test(text)) return "choir"
  if (/drum|clap|kit/.test(text)) return "drums"
  if (/bass|beatbox/.test(text)) return "bass"
  if (/voice|vocal|sing|hum/.test(text)) return "vocal"
  if (/guitar|piano|rhodes|horn|keyboard|string|brass|synth|instrument/.test(text)) return "instrument"
  return "instrument"
}

function applyMixSettings(layer, values, index) {
  const [gain, pan, low, high, space] = values
  layer.gain = gain
  layer.low = low
  layer.high = high
  layer.space = space
  layer.pan = pan === "spread" ? (index % 2 === 0 ? -0.28 : 0.28) : pan
}

function mixReadout(key, value) {
  const number = Number(value) || 0
  if (key === "gain") return String(Math.round(number * 100))
  if (key === "space") return `${Math.round(number * 100)}%`
  if (key === "pan") {
    if (Math.abs(number) < 0.05) return "center"
    return number < 0 ? `left ${Math.round(Math.abs(number) * 100)}` : `right ${Math.round(number * 100)}`
  }
  const db = Math.round(number)
  return db > 0 ? `+${db}` : String(db)
}

function magicLog() {
  const rows = state.layers
    .map((layer) => {
      const edited = Boolean(layer.from) && !(layer.loop && !layer.transformed && /^loop · \d+ bars?$/.test(layer.from))
      return `<li><b>${esc(layer.name)}</b><span>${edited ? "Edited" : "Original"}${layer.from ? ` · ${esc(layer.from)}` : ""}</span></li>`
    })
    .join("")
  return `<section class="magic-log" aria-label="Magic Log">
    <h3>Magic Log</h3>
    <p class="hint">Original recordings stay on their own layers. An added part is marked Edited. Undo puts the last edit back.</p>
    ${rows ? `<ul>${rows}</ul>` : `<p class="hint">No layers yet.</p>`}
    <p class="hint">Magic clear softens hiss on the selected layer. Magic Tune, Magic Eraser, and Magic Marker are listed and do not process audio. Strings, synth, and MIDI are not connected.</p>
  </section>`
}

function mixBox(id, name, line) {
  return planButton(name, line, `data-action="apply-mix" data-preset="${id}"`, state.mix === id)
}

function renderMix(head, layer) {
  if (!state.layers.length) {
    return `${head("Mix")}<p class="empty">Record a layer, then pick a mix.</p>`
  }
  const current = layer || state.layers[0]
  const low = current.low ?? 0
  const high = current.high ?? 0
  const space = current.space ?? 0
  const soloing = state.layers.some((item) => item.solo)
  const channels = state.layers.map((item) => {
    const hear = hearingMark(item)
    return `<div class="mix-channel ${item.id === current.id ? "on" : ""} ${hear.className}" data-hearing="${hear.className === "quiet" ? "quiet" : "playing"}">
      <div class="mix-channel-top">
        <button class="strip-name" data-action="select-layer" data-id="${item.id}">${esc(item.name)}</button>
        <button class="mini ${item.mute ? "on" : ""}" data-action="toggle-mute" data-id="${item.id}" aria-pressed="${item.mute ? "true" : "false"}" aria-label="Mute ${esc(item.name)}">M</button>
        <button class="mini ${item.solo ? "on" : ""}" data-action="toggle-solo" data-id="${item.id}" aria-pressed="${item.solo ? "true" : "false"}" aria-label="Solo ${esc(item.name)}">S</button>
      </div>
      ${hear.label ? `<span class="hear-state">${hear.label}</span>` : ""}
      <label class="field">Volume
        <input class="slider" type="range" min="0" max="1" step="0.01" value="${item.gain ?? 0.8}" data-mix="1" data-action="set-gain" data-id="${item.id}" aria-label="${esc(item.name)} volume" />
      </label>
      <label class="field">Left and right
        <input class="slider" type="range" min="-1" max="1" step="0.01" value="${item.pan ?? 0}" data-mix="1" data-action="set-pan" data-id="${item.id}" aria-label="${esc(item.name)} pan" />
      </label>
    </div>`
  }).join("")
  const fine = state.fine ? `<div class="fine-body">
      <p class="hint">${esc(current.name)} · ${esc(current.sound || "Layer")}</p>
      ${slider("Bass", "low", -6, 6, 1, low, current.id, mixReadout("low", low))}
      ${slider("Treble", "high", -6, 6, 1, high, current.id, mixReadout("high", high))}
      ${slider("Space", "space", 0, 1, 0.01, space, current.id, mixReadout("space", space))}
      <p class="hint">Bass and treble are tone. Space is room around the sound.</p>
    </div>` : ""
  const slack = state.timingSlack || 0.18
  const canRevertTiming = state.layers.some((item) => buffers.get(item.id + ":timing"))
  return `${head("Mix all layers")}
    <p class="ask">Every layer</p>
    <p class="hint">${soloing ? "Solo is on. Bright layers are playing. Dim layers are quiet. M mutes. S solos." : "Mix is for every layer at once. Volume and left-right are on each one. M mutes. S solos."}</p>
    <p class="ask">Magic timing</p>
    <p class="hint">Looks across the layers. It pulls a note that is barely off, sitting on no beat, or leaving a beat silent. A steady off-beat stays put.</p>
    <label class="field">How far off still counts
      <input id="timing-slack" class="slider" type="range" min="0.08" max="0.4" step="0.01" value="${slack}" aria-label="How far off still counts as a slip" />
      <span data-timing-readout>${timingSlackLabel(slack)}</span>
    </label>
    <div class="magic-actions">
      ${filledButton("Magic timing", `data-action="fix-timing"`)}
      ${outlinedButton("Revert timing", `data-action="revert-timing" ${canRevertTiming ? "" : "disabled"}`)}
    </div>
    <div class="mix-channels">${channels}</div>
    <label class="field">Layer name
      <input class="layer-name" data-rename="${current.id}" value="${esc(current.name)}" maxlength="40" aria-label="Name this layer" />
    </label>
    ${dangerButton("Delete layer", `data-action="delete-layer" data-id="${current.id}"`)}
    ${outlinedButton(state.fine ? "Hide tone" : "Bass, treble, and space", `data-action="toggle-fine"`)}
    ${fine}
    <p class="ask">For the whole song</p>
    <div class="mix-boxes">${Object.entries(SONG_MIXES).map(([id, item]) => mixBox(id, item.name, item.line)).join("")}</div>
    <p class="ask">For one kind of part</p>
    <div class="mix-boxes parts">${Object.entries(MIX_PARTS).map(([id, item]) => mixBox(id, item.name, item.line)).join("")}</div>
    ${magicLog()}`
}

function timingSlackLabel(slack) {
  const pct = Math.round((Number(slack) || 0.18) * 100)
  if (pct <= 12) return `${pct}% · only tiny slips`
  if (pct >= 32) return `${pct}% · wider misses too`
  return `${pct}% of a beat`
}

function fixTiming() {
  const live = state.layers.filter((layer) => buffers.get(layer.id + ":timing") || buffers.get(layer.id + ":audio"))
  if (!live.length || typeof SongbirdMusic.fixTiming !== "function") {
    $("save-status").textContent = "Record a layer first."
    return
  }
  if (state.transforming) return
  const inputs = live.map((layer) => {
    const buffer = buffers.get(layer.id + ":timing") || buffers.get(layer.id + ":audio")
    return {
      id: layer.id,
      samples: samplesOf(buffer),
      sampleRate: buffer.sampleRate,
      start: layer.range?.start || 0,
    }
  })
  state.transforming = true
  $("save-status").textContent = "Magic timing is listening across the layers… You can keep working."
  renderInspector()
  const songId = state.song?.id
  const before = live.map((layer) => buffers.get(layer.id + ":audio"))
  void engine.call("fixTiming", inputs, { bpm: state.bpm || 92, slack: state.timingSlack || 0.18 })
    .then((fixed) => {
      state.transforming = false
      const unchanged = live.every((layer, index) => state.layers.includes(layer) && buffers.get(layer.id + ":audio") === before[index])
      if (state.song?.id !== songId || !unchanged) {
        renderInspector()
        return
      }
      keepTiming(live, fixed)
    })
    .catch(() => {
      state.transforming = false
      $("save-status").textContent = "Magic timing didn't work this time. Nothing moved."
      renderInspector()
    })
}

function keepTiming(live, fixed) {
  snapshot(live.map((layer) => layer.id))
  for (const layer of live) {
    if (!buffers.get(layer.id + ":timing")) buffers.set(layer.id + ":timing", buffers.get(layer.id + ":audio"))
  }
  let moved = 0
  let pockets = 0
  for (const item of fixed) {
    const layer = state.layers.find((entry) => entry.id === item.id)
    if (!layer) continue
    moved += item.moved || 0
    if (item.pocket) pockets += 1
    if (!item.moved || !item.samples) continue
    const rate = buffers.get(layer.id + ":timing").sampleRate
    buffers.set(layer.id + ":audio", audioBuffer(item.samples, rate))
    layer.peaks = peaksFromSamples(item.samples)
  }
  rememberSong()
  renderTracks()
  renderInspector()
  if (playing) play(state.playAt || 0)
  if (!moved) {
    $("save-status").textContent = pockets
      ? "Those layers are sitting on a steady off-beat, so nothing was moved. Widen the threshold for a slip that is farther out."
      : "Nothing was barely off at this threshold. Widen it if a note still feels late or early."
    return
  }
  const pocketNote = pockets ? " Steady off-beats were left alone." : ""
  $("save-status").textContent = `Magic timing moved ${moved} ${moved === 1 ? "slip" : "slips"} across the layers.${pocketNote} Revert timing puts the original back.`
}

function revertTiming() {
  const live = state.layers.filter((layer) => buffers.get(layer.id + ":timing"))
  if (!live.length) {
    $("save-status").textContent = "Timing is already the original."
    return
  }
  snapshot(live.map((layer) => layer.id))
  for (const layer of live) {
    const original = buffers.get(layer.id + ":timing")
    if (!original) continue
    buffers.set(layer.id + ":audio", original)
    layer.peaks = peaksFromSamples(original.getChannelData(0))
  }
  rememberSong()
  renderTracks()
  renderInspector()
  if (playing) play(state.playAt || 0)
  $("save-status").textContent = "Timing is back to the original. Magic timing can try again."
}

function applyMix(id) {
  if (!state.layers.length) {
    $("save-status").textContent = "Add a layer first."
    return
  }
  snapshot()
  const part = MIX_PARTS[id]
  if (part) {
    let targets = state.layers.filter((layer) => mixFamily(layer) === id)
    const forced = !targets.length
    if (forced) targets = [selectedLayer()]
    targets.forEach((layer, index) => applyMixSettings(layer, [part.gain, part.pan, part.low, part.high, part.space], index))
    state.mix = id
    const names = targets.map((item) => item.name).join(", ")
    rememberSong()
    for (const layer of targets) refreshMix(layer)
    renderTracks()
    renderInspector()
    $("save-status").textContent = forced
      ? `This song has no matching part, so ${part.name} was used on ${names}.`
      : `${part.name}: ${names}.`
    return
  }
  const song = SONG_MIXES[id]
  if (!song) return
  const counts = {}
  for (const layer of state.layers) {
    const family = mixFamily(layer)
    counts[family] = counts[family] || 0
    applyMixSettings(layer, SONG_SCALE[id][family] || SONG_SCALE[id].instrument, counts[family])
    counts[family] += 1
  }
  state.mix = id
  rememberSong()
  for (const layer of state.layers) refreshMix(layer)
  renderTracks()
  renderInspector()
  $("save-status").textContent = `${song.name}. ${song.line}`
}

function statusWord(status) {
  if (status === "ready") return "Ready"
  if (status === "partial") return "Partial"
  return "Not in this version"
}

function genrePanel() {
  if (typeof SongbirdPackages === "undefined") return ""
  const genres = SongbirdPackages.listGenres()
  const current = SongbirdPackages.get(state.genre) || SongbirdPackages.get("rnb")
  const hybrid = current.id === "hybrid"
  const others = genres.filter((genre) => genre.id !== "hybrid")
  if (!hybrid && !current.subgenres.some((item) => item.id === state.subgenre)) state.subgenre = current.subgenres[0].id
  if (hybrid && !others.some((genre) => genre.id === state.subgenre)) state.subgenre = "rnb"
  if (hybrid && (!others.some((genre) => genre.id === state.blend) || state.blend === state.subgenre)) {
    state.blend = others.find((genre) => genre.id !== state.subgenre)?.id || "gospel"
  }
  const plan = SongbirdPackages.plan(current.id, state.subgenre, state.blend)
  const genreOptions = genres.map((genre) => `<option value="${esc(genre.id)}" ${genre.id === current.id ? "selected" : ""}>${esc(genre.name)}</option>`).join("")
  const subOptions = hybrid
    ? others.map((genre) => `<option value="${esc(genre.id)}" ${genre.id === state.subgenre ? "selected" : ""}>${esc(genre.name)}</option>`).join("")
    : current.subgenres.map((item) => `<option value="${esc(item.id)}" ${item.id === state.subgenre ? "selected" : ""}>${esc(item.name)}</option>`).join("")
  const blendOptions = others.map((genre) => `<option value="${esc(genre.id)}" ${genre.id === state.blend ? "selected" : ""}>${esc(genre.name)}</option>`).join("")
  const magic = SongbirdPackages.magic.map((item) => `<li><b>${esc(item.name)}</b><span class="status-${esc(item.status)}">${statusWord(item.status)}</span></li>`).join("")
  return `<section class="genre-package">
    <p class="ask">Genre package</p>
    <p class="hint">${esc(current.description)}</p>
    <p class="hint">Partial means only some parts of that package play here. Will add is what you can hear. The rest of the style is not in this version.</p>
    <label class="field">Package
      <select id="genre-pack" aria-label="Genre package">${genreOptions}</select>
    </label>
    <label class="field">${hybrid ? "Harmony and bass from" : "Variation"}
      <select id="genre-sub" aria-label="${hybrid ? "First package" : "Variation"}">${subOptions}</select>
    </label>
    ${hybrid ? `<label class="field">Drums from<select id="genre-blend" aria-label="Second package">${blendOptions}</select></label>` : ""}
    <p class="hint">${plan.note ? esc(plan.note) : ""}</p>
    <p class="hint"><b>Will add:</b> ${plan.will.length ? esc(plan.will.join(" ")) : "Nothing yet. Pick two different packages."}</p>
    ${SongbirdPackages.readySteps(current.id, state.subgenre, state.blend).length ? `<p class="ask">Or turn the selected layer into</p>
    <div class="choices">${SongbirdPackages.readySteps(current.id, state.subgenre, state.blend).map((step) => filterChip(step.role || step.sound, `data-action="transform-as" data-sound="${esc(step.sound)}" data-figure="${esc(step.figure || "")}" data-touch="${esc(step.touch || "")}" data-pattern="${esc(step.pattern || "")}" data-era="${esc(step.era || "")}" ${state.transforming ? "disabled" : ""}`)).join("")}</div>` : ""}
    <p class="hint"><b>Not in this version:</b> ${esc(plan.wont.join(", "))}.</p>
    <div class="row">
      ${outlinedButton("Preview", `data-action="preview-genre" ${state.transforming ? "disabled" : ""}`)}
      ${filledButton("Apply ready steps", `data-action="apply-genre" ${state.transforming ? "disabled" : ""}`)}
    </div>
    <details class="package-more">
      <summary>Magic and production packages</summary>
      <ul class="package-status">${magic}</ul>
      <ul class="package-status">${SongbirdPackages.production.map((item) => `<li><b>${esc(item.name)}</b><span class="status-${esc(item.status)}">${statusWord(item.status)}</span></li>`).join("")}</ul>
      <p class="hint">Partial means some of that package plays. Magic clear, above, softens hiss on the selected layer. Magic Tune, Magic Eraser, and Magic Marker are listed and do not process audio.</p>
    </details>
  </section>`
}

function renderInspector() {
  const layer = selectedLayer()
  const head = (title) => `<div class="sheet-head"><h2>${title}</h2>${iconButton("close", `data-action="close-panel" aria-label="Close" title="Close"`)}</div>`
  let body = ""
  if (state.panel === "record") {
    const micMode = state.recordMode !== "vibe"
    const listening = state.recording && state.tempoPass
    const vibeNames = { claps: "Claps", snaps: "Snaps", guitar: "Guitar strums", piano: "Piano chords" }
    body = `${head("Make a sound")}
      <div class="choices">
        ${filterChip("Record from the mic", `data-action="record-mode" data-mode="mic"`, micMode)}
        ${filterChip("Pick a vibe", `data-action="record-mode" data-mode="vibe"`, !micMode)}
      </div>
      ${micMode ? `${state.looper ? "" : `<p class="hint">Tempo is ${state.bpm}. You'll see it, then it counts 1, 2, 3, 4, then the song plays while the mic records. Only the mic is kept.</p>`}
      <div class="meter ${state.recording ? "go" : ""}" aria-hidden="true">${Array.from({ length: 18 }, () => "<i></i>").join("")}</div>
      <button class="mic ${state.recording || state.counting ? "hot" : ""}" data-action="toggle-record" data-state="${state.recording || state.counting ? "recording" : "idle"}" aria-label="${state.recording || state.counting ? "Stop recording" : "Record"}"><span class="glyph" aria-hidden="true">${state.recording || state.counting ? "■" : "●"}</span></button>
      ${beatLightsMarkup()}
      ${state.looper ? loopClockMarkup() : ""}
      <p class="hint ${state.counting ? "count-beat" : ""}" id="rec-time">${state.counting ? (state.countBeat ? String(state.countBeat) : `Tempo ${state.bpm}`) : listening ? "Listening for the tempo." : state.recording ? "Recording. The song is in the speakers, not in the take." : state.looper ? (state.loopSec && songHasSound() ? "Tap to stack a layer" : "Tap to start a loop") : "00:00"}</p>
      ${looperBox()}
      ${headphonesBox()}
      ${state.looper ? `<p class="hint">Tempo ${state.bpm}. It counts 1, 2, 3, 4, then the loop plays from the top while the mic records. Only the mic is kept.</p>` : ""}
      <p class="hint">Songbird records like Voice Memos: your mic as it is, full quality, with nothing added while you sing. It only evens out the level after. Headphones keep the click and the loop out of your take. Magic clear, in Transform, can tidy it later.</p>
      ${outlinedButton(state.recMore ? "Hide monitoring" : "Headphones and monitoring", `data-action="toggle-rec-more"`)}
      ${state.recMore ? `<div class="seg">
        ${filterChip("Record First", `data-action="rec-mode" data-mode="first"`, state.mode === "first")}
        ${filterChip("Play Live", `data-action="rec-mode" data-mode="live"`, state.mode === "live")}
      </div>
      <p class="hint">Play Live lets you hear yourself. A transformed voice while you sing is not live yet.</p>
      <div class="seg">
        ${["original", "both", "transformed"].map((id) => filterChip(id === "both" ? "Original + transformed" : id[0].toUpperCase() + id.slice(1), `data-action="monitor" data-monitor="${id}"`, state.monitor === id)).join("")}
      </div>` : ""}
      ${state.looper ? "" : `<div class="row">
        ${filledButton("Keep", `data-action="keep-take" ${pendingBlob ? "" : "disabled"}`)}
        ${outlinedButton("Try again", `data-action="discard-take"`)}
      </div>`}` : `<p class="hint">Songbird adds a starter and uses this tempo. Record from the mic when you want your own voice on top.</p>
      <p class="ask">Starter</p>
      <div class="choices">
        ${Object.entries(vibeNames).map(([id, label]) => filterChip(label, `data-action="pick-vibe" data-vibe="${id}"`, state.vibe === id)).join("")}
      </div>
      <p class="ask">Key of ${KEY_NAMES[state.keyPc] || "C"}</p>
      <p class="hint">${state.vibe === "guitar" || state.vibe === "piano" ? "Tap a note. You'll hear it, and the chords use that key." : "Tap a note to learn the key. Claps and snaps keep the tempo. The key is ready when you add chords or sing."}</p>
      ${pianoKeys()}
      <p class="ask">Tempo</p>
      <div class="choices">
        ${[[76, "Slow 76"], [96, "Mid 96"], [120, "Up 120"]].map(([bpm, label]) => filterChip(label, `data-action="vibe-tempo" data-bpm="${bpm}"`, state.bpm === bpm)).join("")}
      </div>
      ${filledButton(`Add ${vibeNames[state.vibe] || "this starter"}`, `data-action="add-starter"`)}`}`
  } else if (state.panel === "transform") {
    const sources = state.layers.filter((item) => buffers.get(item.id + ":audio"))
    const current = sources.find((item) => item.id === state.selected) || sources[0]
    const locked = state.transforming ? "disabled" : ""
    const note = state.transformNote
      ? `<p class="${state.transformTone === "warn" ? "warn" : "hint"}">${esc(state.transformNote)}</p>`
      : ""
    if (current) suggestIntoState(current)
    const period = PERIODS.find((item) => item.id === state.era) || PERIODS[PERIODS.length - 1]
    const instruments = PACKAGES.filter((pack) => pack.id !== "Vocals" && pack.id !== "Choir")
    const vocalPath = state.role !== "instrument"
    body = `${head("Magic")}
      <p class="hint">${current ? `${esc(current.name)} is selected.` : "Record a layer first."} Hit Magic again for another idea. A description can steer it. Mix, after this, is for every layer.</p>
      ${sources.length ? `<p class="ask">This layer</p>
        <div class="choices">${sources.map((item) => filterChip(esc(item.name), `data-action="pick-transform-layer" data-id="${item.id}" ${locked}`, item.id === current.id)).join("")}</div>` : `<p class="hint">Record a layer, or add a starter from Record.</p>`}
      <p class="ask">Enhance this sound</p>
      <p class="hint">Magic clear tidies the selected layer the way a photo editor tidies a picture: less hiss, and the sound a little more present. Brighten, warm, or smooth it. Revert puts the original back.</p>
      <label class="field">How much
        <input id="enhance-amount" class="slider" type="range" min="0.25" max="1" step="0.05" value="${state.enhanceAmount || 0.65}" aria-label="How much to enhance" />
        <span data-enhance-readout>${enhanceLabel(state.enhanceAmount || 0.65)}</span>
      </label>
      <div class="magic-actions">
        ${filledButton(state.transforming ? "Working…" : "Magic clear", `data-action="enhance" data-mode="clear" ${locked}`)}
      </div>
      <div class="choices">
        ${filterChip("Clear hiss", `data-action="enhance" data-mode="hiss" ${locked}`)}
        ${filterChip("Brighten", `data-action="enhance" data-mode="bright" ${locked}`)}
        ${filterChip("Warm", `data-action="enhance" data-mode="warm" ${locked}`)}
        ${filterChip("Smooth", `data-action="enhance" data-mode="smooth" ${locked}`)}
      </div>
      <label class="field">Describe it, if you want
        <textarea id="magic-wish" rows="2" placeholder="Warm piano chords, a little room">${esc(state.magicWish || "")}</textarea>
      </label>
      <div class="magic-actions">
        ${filledButton(state.transforming ? "Working…" : "Magic", `data-action="magic-again" ${locked}`)}
        ${outlinedButton("Revert to original", `data-action="revert-original" ${locked}`)}
        ${outlinedButton("Next: Mix all layers", `data-action="next-mix"`)}
      </div>
      ${note}
      <details class="package-more">
        <summary>Choose it yourself</summary>
        ${genrePanel()}
        <p class="hint">${current ? suggestionLine(current) : ""}</p>
      <p class="ask">Vocals or instrument</p>
      <div class="choices">
        ${filterChip("Vocals", `data-action="pick-role" data-role="vocals" ${locked}`, vocalPath)}
        ${filterChip("Instrument", `data-action="pick-role" data-role="instrument" ${locked}`, !vocalPath)}
      </div>
      ${vocalPath ? `<p class="ask">Vocal type</p>
        <p class="hint">Solo keeps the lead. Background sits behind it. Choir is a synthesized choir from the notes it heard.</p>
        <div class="choices">
          ${filterChip("Solo", `data-action="pick-vocal" data-vocal="solo" ${locked}`, state.vocalType === "solo")}
          ${filterChip("Background", `data-action="pick-vocal" data-vocal="background" ${locked}`, state.vocalType === "background")}
          ${filterChip("Choir", `data-action="pick-vocal" data-vocal="choir" ${locked}`, state.vocalType === "choir")}
        </div>` : `<p class="ask">Notes</p>
        <div class="choices">
          ${filterChip("Solo notes", `data-action="pick-figure" data-figure="solo" ${locked}`, state.figure !== "chords")}
          ${filterChip("Chords", `data-action="pick-figure" data-figure="chords" ${locked}`, state.figure === "chords")}
        </div>
        <p class="ask">Instrument</p>
        <div class="mix-boxes parts">${instruments.map((pack) => planButton(pack.name, pack.line, `data-action="apply-sound" data-sound="${esc(pack.id)}" ${locked}`, state.instrument === pack.id)).join("")}</div>
        ${state.instrument === "Drums" ? `<p class="ask">Drum pocket</p>
          <div class="choices">${POCKETS.map((item) => filterChip(item.name, `data-action="pick-pocket" data-pocket="${item.id}" ${locked}`, state.pocket === item.id)).join("")}</div>` : `<p class="ask">How it plays</p>
          <div class="choices">${TOUCHES.filter((item) => state.figure === "chords" || item.id !== "strum").map((item) => filterChip(item.name, `data-action="pick-touch" data-touch="${item.id}" ${locked}`, state.touch === item.id)).join("")}</div>`}`}
      <p class="ask">${vocalPath ? "Pitch and mic" : "Pitch correction and mic"}</p>
      <p class="hint">${vocalPath && state.vocalType !== "choir" ? "Pitch correction eases the voice toward the note it heard. Autotune pulls harder. Mic types are close, room, or bright tone, not a model of a real microphone." : "Pitch correction plays the tuned notes it heard. As recorded leaves the take and only changes mic and room. Mic types are tone, not a model of a real microphone."}</p>
      <div class="choices">
        ${filterChip("As recorded", `data-action="pick-pitch" data-pitch="none" ${locked}`, state.pitch === "none")}
        ${filterChip("Pitch correction", `data-action="pick-pitch" data-pitch="correct" ${locked}`, state.pitch === "correct")}
        ${filterChip("Autotune", `data-action="pick-pitch" data-pitch="autotune" ${locked}`, state.pitch === "autotune")}
      </div>
      <div class="choices">
        ${filterChip("Close mic", `data-action="pick-mic" data-mic="close" ${locked}`, state.mic === "close")}
        ${filterChip("Room mic", `data-action="pick-mic" data-mic="room" ${locked}`, state.mic === "room")}
        ${filterChip("Bright mic", `data-action="pick-mic" data-mic="bright" ${locked}`, state.mic === "bright")}
      </div>
      <p class="ask">Effects</p>
      <div class="choices">
        ${filterChip("Reverb", `data-action="pick-reverb" ${locked}`, !!state.reverb)}
        ${filterChip("Echo", `data-action="pick-echo" ${locked}`, !!state.echo)}
      </div>
      <p class="ask">Time period</p>
      <p class="hint">${esc(period.line)} This updates the layer you already chose. It does not stop the next settings.</p>
      <div class="choices">${PERIODS.map((era) => filterChip(era.name, `data-action="pick-era" data-era="${era.id}" ${locked}`, state.era === era.id)).join("")}</div>
      <p class="ask">Room size</p>
      <p class="hint">Small, medium, or large space around the reverb and echo.</p>
      <div class="choices">
        ${filterChip("Small", `data-action="pick-room" data-room="small" ${locked}`, state.room === "small")}
        ${filterChip("Medium", `data-action="pick-room" data-room="medium" ${locked}`, state.room === "medium")}
        ${filterChip("Large", `data-action="pick-room" data-room="large" ${locked}`, state.room === "large")}
      </div>
      ${filledButton("Use these settings", `data-action="use-transform" ${locked}`)}
      </details>
      ${magicLog()}`
  } else if (state.panel === "build") {
    const shaping = selectedLayer()
    const shapingLength = shaping?.lengthSec || state.lengthSec
    const mins = shapingLength ? Math.floor(shapingLength / 60) : ""
    const secs = shapingLength ? String(shapingLength % 60).padStart(2, "0") : ""
    const suggestions = INTENTS.find((item) => item.id === state.intent)
    body = `${head("Shape this layer")}
      <p class="hint">${shaping ? `${esc(shaping.name)} is selected.` : "Keep a recording first."} It starts at 1:00. Shape this layer, then Transform. Mix is for every layer together.</p>
      <label class="field">What do you want this layer to do?
        <textarea id="wish" rows="3" placeholder="3 minutes, soft intro, build up, then soften at the end">${esc(state.wish)}</textarea>
      </label>
      ${filledButton("Use what I said", `data-action="read-wish"`)}
      ${state.heard ? `<p class="hint">${esc(state.heard)}</p>` : ""}
      <p class="ask">How long do you want it?</p>
      <div class="choices">${LENGTHS.map(([seconds, label, tag]) => filterChip(`${label}${tag ? ` ${tag}` : ""}`, `data-action="apply-length" data-seconds="${seconds}"`, shapingLength === seconds)).join("")}</div>
      <div class="length-entry">
        <label class="field">Minutes<input id="len-min" type="number" min="0" max="8" value="${mins}" aria-label="Minutes" /></label>
        <label class="field">Seconds<input id="len-sec" type="number" min="0" max="59" value="${secs}" aria-label="Seconds" /></label>
        ${outlinedButton("Use this length", `data-action="apply-length-custom"`)}
      </div>
      <p class="ask">What should it do?</p>
      <div class="choices">${INTENTS.map((item) => filterChip(item.title, `data-action="pick-intent" data-intent="${item.id}"`, state.intent === item.id)).join("")}</div>
      ${suggestions ? `<p class="hint">${esc(suggestions.detail)}</p>${suggestions.shapes.map((id) => {
        const shape = SHAPES[id]
        return planButton(shape.name, shape.line, `data-action="apply-shape" data-shape="${id}"`, (shaping?.shape || state.shape) === id, curve(id))
      }).join("")}` : ""}
      ${filledButton("Next: Transform", `data-action="next-transform"`)}
      <p class="hint">Transform changes this layer. After that, Mix sets every layer together.</p>
      ${outlinedButton("Record another layer", `data-action="add-and-record" data-input="hum"`)}`
  } else if (state.panel === "finish") {
    body = `${head("Finish your song")}
      <div class="seg">${filterChip("Audio", "", true)}${outlinedButton("Video", `data-action="video-note"`)}</div>
      <p class="hint">Master downloads a song file of what you hear right now, including mute, solo, and the mix. Nothing is uploaded.</p>
      ${filledButton("Master my song", `data-action="download-mix"`)}
      <p id="finish-note" class="hint"></p>`
  } else {
    body = renderMix(head, layer)
  }
  $("inspector-body").innerHTML = body
}

function peaksFromSamples(data) {
  const count = 48
  const size = Math.max(1, Math.floor(data.length / count))
  const peaks = []
  for (let i = 0; i < count; i++) {
    let max = 0
    for (let j = 0; j < size; j += 8) max = Math.max(max, Math.abs(data[i * size + j] || 0))
    peaks.push(Math.min(1, max))
  }
  return peaks
}

function audioBuffer(samples, sampleRate) {
  const ctx = ac()
  const buffer = ctx.createBuffer(1, samples.length, sampleRate)
  buffer.getChannelData(0).set(samples)
  return buffer
}

function tilePhrase(buffer, seconds) {
  const rate = buffer.sampleRate
  const src = buffer.getChannelData(0)
  const total = Math.max(1, Math.round(Math.max(0.05, seconds) * rate))
  if (Math.abs(src.length - total) < rate * 0.05) return buffer
  if (src.length > total) return loopedBuffer(src.subarray(0, total), rate, buffer.loopSamples || 0)
  const made = SongbirdMusic.fillWithSection(src, rate, {
    songLength: seconds,
    rangeStart: 0,
    rangeEnd: buffer.duration,
    sectionStart: 0,
    sectionEnd: buffer.duration,
    gaps: [],
  })
  if (!made || made.unchanged || !made.samples) return buffer
  return loopedBuffer(made.samples, rate, buffer.loopSamples || src.length)
}

const audioSaved = new Map()
let persistChain = Promise.resolve(true)

function audioDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("no indexedDB"))
      return
    }
    const req = indexedDB.open("songbird", 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("audio")) req.result.createObjectStore("audio")
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function dropLayerAudio() {
  const songId = state.song?.id
  for (const layer of state.layers) {
    buffers.delete(layer.id)
    for (const kind of ["audio", "original", "timing"]) {
      buffers.delete(layer.id + ":" + kind)
      if (songId) audioSaved.delete(`${songId}:${layer.id}:${kind}`)
    }
  }
}

function persistSongAudio() {
  if (!state.song || state.song.demo || typeof indexedDB === "undefined") return persistChain
  const songId = state.song.id
  const jobs = []
  for (const layer of state.layers) {
    for (const kind of ["audio", "original", "timing"]) {
      const buf = buffers.get(layer.id + ":" + kind)
      if (!buf) continue
      const key = `${songId}:${layer.id}:${kind}`
      if (audioSaved.get(key) === buf) continue
      const samples = new Float32Array(buf.length)
      samples.set(buf.getChannelData(0))
      jobs.push({ key, buf, record: { sampleRate: buf.sampleRate, samples, loopSamples: buf.loopSamples || 0 } })
    }
  }
  const keep = new Set(state.layers.flatMap((layer) => ["audio", "original", "timing"].map((kind) => `${songId}:${layer.id}:${kind}`)))
  const run = () => audioDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction("audio", "readwrite")
    const store = tx.objectStore("audio")
    for (const job of jobs) store.put(job.record, job.key)
    const keys = store.getAllKeys()
    keys.onsuccess = () => {
      for (const key of keys.result || []) {
        if (String(key).startsWith(songId + ":") && !keep.has(String(key))) store.delete(key)
      }
    }
    tx.oncomplete = () => {
      for (const job of jobs) audioSaved.set(job.key, job.buf)
      resolve(true)
    }
    tx.onerror = () => reject(tx.error)
  })).catch(() => false)
  persistChain = persistChain.then(run, run)
  return persistChain
}

function restoreSongAudio(songId, layers) {
  if (typeof indexedDB === "undefined") return Promise.resolve(0)
  return audioDb().then((db) => Promise.all(layers.flatMap((layer) => ["audio", "original", "timing"].map((kind) => new Promise((resolve) => {
    if (buffers.get(layer.id + ":" + kind)) {
      resolve(kind === "audio" ? 1 : 0)
      return
    }
    const req = db.transaction("audio", "readonly").objectStore("audio").get(`${songId}:${layer.id}:${kind}`)
    req.onsuccess = () => {
      const record = req.result
      if (!record?.samples?.length) {
        resolve(0)
        return
      }
      const samples = record.samples instanceof Float32Array ? record.samples : Float32Array.from(record.samples)
      const buf = loopedBuffer(samples, record.sampleRate || 44100, record.loopSamples || 0)
      buffers.set(layer.id + ":" + kind, buf)
      audioSaved.set(`${songId}:${layer.id}:${kind}`, buf)
      resolve(kind === "audio" ? 1 : 0)
    }
    req.onerror = () => resolve(0)
  })))).then((counts) => counts.reduce((sum, n) => sum + n, 0))).catch(() => 0)
}

function deleteSongAudio(songId) {
  if (typeof indexedDB === "undefined") return Promise.resolve()
  return audioDb().then((db) => new Promise((resolve) => {
    const tx = db.transaction("audio", "readwrite")
    const store = tx.objectStore("audio")
    const req = store.getAllKeys()
    req.onsuccess = () => {
      for (const key of req.result || []) {
        if (String(key).startsWith(songId + ":")) {
          store.delete(key)
          audioSaved.delete(String(key))
        }
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })).catch(() => {})
}

const exampleCache = new Map()

function useExample(made) {
  state.layers = made.layers.map((layer) => {
    const layerId = uid()
    buffers.set(layerId + ":audio", audioBuffer(layer.samples, made.sampleRate))
    return {
      id: layerId,
      name: layer.name,
      sound: layer.sound,
      from: layer.from,
      color: layer.color,
      peaks: peaksFromSamples(layer.samples),
      gain: layer.gain,
      pan: layer.pan,
      low: layer.low || 0,
      high: layer.high || 0,
      space: layer.space || 0,
      mute: false,
      solo: false,
      live: true,
    }
  })
  state.lengthSec = made.lengthSec
  state.shape = made.shape
  state.intent = made.intent
  state.bpm = made.bpm
  state.tempoSource = "this example"
  state.tempoLocked = true
  $("bpm").value = made.bpm
  state.sections = Array.isArray(made.sections) ? made.sections : null
  return made.blurb
}

function openSong(id) {
  const song = state.songs.find((item) => item.id === id)
  if (!song) return
  if (state.song?.id !== id) {
    persistSongAudio()
    stopPlayback()
    dropLayerAudio()
  } else {
    stopPlayback()
  }
  state.song = song
  state.buildingExample = null
  state.loopSec = null
  $("song-title").value = song.title
  showSongCredit()
  let exampleNote = ""
  if (song.demo) {
    const ready = exampleCache.get(song.id)
    if (ready) exampleNote = useExample(ready)
    else {
      state.layers = []
      state.buildingExample = song.id
      exampleNote = "Building this example… It takes a moment the first time."
      void engine.call("makeExample", song.id).then((made) => {
        if (!made) return
        exampleCache.set(song.id, made)
        if (state.song?.id !== song.id || state.buildingExample !== song.id) return
        state.buildingExample = null
        state.heard = useExample(made)
        const voice = state.layers.find((layer) => layer.sound === "Voice")
        state.selected = voice?.id ?? state.layers[0]?.id ?? null
        renderPlanNote()
        renderRuler()
        renderTracks()
        renderInspector()
        $("save-status").textContent = "Example ready. Press play."
      }).catch(() => {
        if (state.song?.id === song.id) $("save-status").textContent = "That example didn't build on this device."
      })
    }
  } else {
    state.layers = song.layers ?? []
  }
  const voice = state.layers.find((layer) => layer.sound === "Voice")
  state.selected = voice?.id ?? state.layers[0]?.id ?? null
  if (!song.demo) {
    state.lengthSec = song.lengthSec || null
    state.shape = song.shape || null
    state.intent = song.intent || null
    state.bpm = song.bpm || 92
    state.genre = song.genre || state.genre
    state.subgenre = song.subgenre || state.subgenre
    state.blend = song.blend || state.blend
    state.tempoSource = song.tempoSource || ""
    state.tempoLocked = !!song.tempoLocked
    state.loopSec = song.loopSec || null
    $("bpm").value = state.bpm
  }
  state.playAt = 0
  state.section = null
    if (!song.demo) state.sections = Array.isArray(song.sections) ? song.sections : null
  state.heard = exampleNote
  state.transformNote = ""
  state.transformTone = ""
  state.transforming = false
  state.arrived = null
  undoStack = []
  redoStack = []
  state.panel = "mix"
  closePanel()
  setScreen("studio")
  const timeline = $("timeline")
  if (timeline) timeline.scrollTop = 0
  renderPlanNote()
  renderRuler()
  renderTracks()
  renderInspector()
  const kept = !song.demo && state.layers.some((layer) => buffers.get(layer.id + ":audio"))
  state.openingSound = !song.demo && state.layers.length > 0 && !kept
  state.missingSound = false
  $("save-status").textContent = state.buildingExample ? "Building this example…" : state.openingSound ? "Opening the saved sound…" : "Saved on this device"
  renderProjectActions()
  if (!state.openingSound) return
  const songId = song.id
  const audioKept = !!song.audioKept
  void persistChain.then(() => restoreSongAudio(songId, state.layers)).then((count) => {
    if (state.song?.id !== songId) return
    state.openingSound = false
    state.missingSound = count < 1
    $("save-status").textContent = state.missingSound
      ? (audioKept
        ? "The sound didn't open from this device. Try Play again in a moment."
        : "This song is in the list, but the sound was not kept. Record the layer again to hear it.")
      : "Saved on this device"
    renderTracks()
  })
}

function newSong() {
  const song = { id: uid(), title: "Untitled song", privacy: "Shared", demo: false, sharedWith: [], layers: [] }
  state.songs.unshift(song)
  saveSongs()
  renderSongs()
  openSong(song.id)
  setPanel("record")
  state.tempoSource = ""
  state.tempoLocked = false
  $("save-status").textContent = "Clap, snap, or beatbox the tempo. Or just start humming."
}

function ensureSong() {
  if (state.song && !state.song.demo) return state.song
  const song = { id: uid(), title: $("song-title")?.value.trim() || "Untitled song", privacy: "Shared", demo: false, sharedWith: [], layers: [] }
  state.songs.unshift(song)
  state.song = song
  renderSongs()
  renderProjectActions()
  return song
}

function rememberSong() {
  if (state.song?.demo) return
  if (!state.song) {
    const named = $("song-title")?.value.trim()
    const authored = $("song-author")?.value.trim()
    if (!state.layers.length && !named && !authored) return
    ensureSong()
  }
  const previousTitle = state.song.title
  const previousAuthor = state.song.author || ""
  state.song.title = $("song-title").value.trim() || "Untitled song"
  state.song.author = $("song-author")?.value.trim() || ""
  if (!state.song.demo) state.song.credit = state.song.author ? `Author: ${state.song.author}. Original recording in this browser.` : ""
  state.song.lengthSec = state.lengthSec
  state.song.shape = state.shape
  state.song.intent = state.intent
  state.song.bpm = state.bpm
  state.song.genre = state.genre
  state.song.subgenre = state.subgenre
  state.song.blend = state.blend
  state.song.tempoSource = state.tempoSource
  state.song.tempoLocked = state.tempoLocked
  state.song.sections = state.sections
  state.song.loopSec = state.loopSec
  state.song.layers = state.layers.map(({ id, name, sound, from, color, peaks, gain, pan, low, high, space, mute, solo, live, range, gaps, sourceId, figure, touch, pocket, packageId, transformed, baseName, echo, room, reverb, mic, vocalType, pitch, role, originSound, lengthSec, shape, sections, loop }) => ({
    id, name, sound, from, color, peaks, gain, pan, low, high, space, mute, solo, live, range, gaps, sourceId, figure, touch, pocket, packageId, transformed, baseName, echo, room, reverb, mic, vocalType, pitch, role, originSound, lengthSec, shape, sections, loop,
  }))
  state.song.audioKept = state.layers.some((layer) => buffers.get(layer.id + ":audio"))
  const stored = saveSongs()
  const songId = state.song.id
  void persistSongAudio().then((ok) => {
    if (state.song?.id !== songId) return
    if (ok === false && $("save-status")?.textContent === "Saved on this device") {
      $("save-status").textContent = "This song is in the list. This browser couldn't store the sound."
    }
  })
  if (previousTitle !== state.song.title || previousAuthor !== (state.song.author || "")) renderSongs()
  $("save-status").textContent = stored ? "Saved on this device" : "This song is in the list. This browser couldn't store a copy."
}

function addLayer(blob, name) {
  snapshot()
  const id = uid()
  const colors = ["#1fbfa7", "#3d7eff", "#b44dff", "#f0a202"]
  const layer = {
    id,
    name,
    sound: "Voice",
    color: colors[state.layers.length % colors.length],
    peaks: bars(state.layers.length + 2),
    gain: 0.8,
    pan: 0,
    low: 0,
    high: 0,
    space: 0,
    mute: false,
    solo: false,
    live: true,
  }
  state.layers.push(layer)
  state.selected = id
  buffers.set(id, blob)
  rememberSong()
  renderTracks()
  renderInspector()
}

async function blobPeaks(blob) {
  const ctx = ac()
  const buffer = await ctx.decodeAudioData(await blob.arrayBuffer())
  const data = buffer.getChannelData(0)
  const count = 56
  const size = Math.max(1, Math.floor(data.length / count))
  const peaks = []
  for (let i = 0; i < count; i++) {
    let max = 0
    for (let j = 0; j < size; j += 8) max = Math.max(max, Math.abs(data[i * size + j] || 0))
    peaks.push(Math.min(1, max * 2.4))
  }
  return { buffer, peaks }
}

async function keepTake(name, stayOpen) {
  if (!pendingBlob) return
  const decoded = await blobPeaks(pendingBlob)
  const label = name || INPUTS.find(([id]) => id === state.input)?.[1] || "Voice"
  addLayer(pendingBlob, label)
  const layer = state.layers[state.layers.length - 1]
  layer.peaks = decoded.peaks
  if (name === "Claps" || name === "Beatbox") layer.from = "your pulse"
  const startedAt = recordOrigin
  const target = decoded.buffer.duration >= 60 ? decoded.buffer.duration : 60
  const tiled = tilePhrase(decoded.buffer, target)
  buffers.set(layer.id + ":audio", tiled)
  layer.peaks = peaksFromSamples(tiled.getChannelData(0))
  layer.lengthSec = Math.max(15, Math.round(tiled.duration))
  layer.sections = [{ id: uid(), name: "Part 1", start: 0, end: 1 }]
  state.section = layer.sections[0].id
  const origin = startedAt > 0.2 ? startedAt : 0
  layer.range = { start: origin, end: origin + layer.lengthSec }
  if (origin > 0) layer.from = [layer.from, `from ${formatClock(origin)}`].filter(Boolean).join(" · ")
  const occupied = layer.range ? layer.range.end : layer.lengthSec
  if (!state.lengthSec || state.lengthSec < occupied) state.lengthSec = occupied
  recordOrigin = 0
  recordedSeconds = 0
  pendingBlob = null
  rememberSong()
  renderTracks()
  renderRuler()
  if (!stayOpen) setPanel("build")
  const tempo = state.tempoSource ? ` Tempo is ${state.bpm} from ${state.tempoSource}.` : ""
  const where = startedAt > 0.2 ? ` It starts at ${formatClock(startedAt)}.` : ""
  const filled = layer.lengthSec === 60 && decoded.buffer.duration < 59.5
    ? ` ${layer.name} is 1:00. The recording loops to fill it.`
    : ` ${layer.name} is ${formatClock(layer.lengthSec)}.`
  $("save-status").textContent = `Take kept.${filled}${where} Shape this layer, then Transform. Mix is for every layer.${tempo}`
  wakeSky()
}

// A block that drains as the loop runs out, so you know when it ends without
// counting: "Keep going…", then 3, 2, 1, then "Stop" as it closes the loop.
function beatLightsMarkup() {
  const live = state.recording || state.counting
  return `<div class="beat-lights" id="beat-lights" aria-hidden="true" ${live ? "" : "hidden"}>${[0, 1, 2, 3].map((i) => `<i class="${i === 0 ? "one" : ""}"></i>`).join("")}</div>`
}

function runBeatLights() {
  cancelAnimationFrame(beatLights.raf)
  let lit = -2
  const frame = () => {
    const box = $("beat-lights")
    if (!state.recording && !state.counting) {
      beatLights.raf = 0
      if (box) box.hidden = true
      return
    }
    if (box && audioCtx) {
      box.hidden = false
      const beat = 60 / Math.max(40, state.bpm || 92)
      let index = -1
      if (state.counting) index = state.countBeat ? state.countBeat - 1 : -1
      else {
        const into = audioCtx.currentTime - beatLights.origin
        // Light for the first 40% of each beat, then go dark until the next.
        if (into >= 0 && (into % beat) / beat < 0.4) index = (beatLights.firstBeat + Math.floor(into / beat)) % 4
      }
      if (index !== lit) {
        lit = index
        box.querySelectorAll("i").forEach((dot, i) => dot.classList.toggle("on", i === index))
      }
    }
    beatLights.raf = requestAnimationFrame(frame)
  }
  beatLights.raf = requestAnimationFrame(frame)
}

// A best guess from the microphone's name (AirPods, a headset, wired
// earbuds). You can always set it yourself in Record.
function guessHeadphones(stream) {
  if (state.headphonesSet) return
  const label = stream?.getAudioTracks?.()[0]?.label || ""
  state.headphones = /airpods|headphone|headset|earpods|earbuds|buds|beats|bluetooth|hands-?free/i.test(label)
}

function headphonesBox() {
  const on = !!state.headphones
  const busy = state.recording || state.counting ? "disabled" : ""
  return `<div class="phones-row">
    <div>
      <p class="ask">Headphones</p>
      <p class="hint">${on ? "You'll hear the click while you record." : "The click is silent while you record, so it stays out of your take. Follow the beat lights."}</p>
    </div>
    <button class="switch ${on ? "on" : ""}" data-action="toggle-phones" role="switch" aria-checked="${on ? "true" : "false"}" aria-label="I'm wearing headphones" ${busy}><span></span></button>
  </div>`
}

function loopClockMarkup() {
  const justClosed = loopClock.closedAt && performance.now() - loopClock.closedAt < 1500
  const live = state.recording || state.counting || justClosed
  const bars = loopClock.length ? Math.max(1, Math.round(loopClock.length / barSeconds())) : Math.max(1, state.loopBars || 4)
  const ticks = Array.from({ length: Math.max(0, bars - 1) }, (_, i) => `<i style="left:${(((i + 1) / bars) * 100).toFixed(2)}%"></i>`).join("")
  return `<div class="loop-clock ${justClosed ? "closed" : ""}" id="loop-clock" ${live ? "" : "hidden"}>
    <div class="loop-clock-bar"><span class="loop-clock-fill" style="transform:scaleX(${justClosed ? 0 : 1})"></span>${loopClock.length ? ticks : ""}</div>
    <p class="loop-clock-word" aria-live="polite">${justClosed ? "Stop" : state.counting ? "Get ready…" : "Keep going…"}</p>
    <p class="loop-clock-sub">${justClosed ? "Loop closed. Listen to it play." : ""}</p>
  </div>`
}

function runLoopClock() {
  cancelAnimationFrame(loopClock.raf)
  const frame = () => {
    const box = $("loop-clock")
    if (!state.recording && !state.counting) {
      loopClock.raf = 0
      return
    }
    if (box) {
      box.hidden = false
      const fill = box.querySelector(".loop-clock-fill")
      const wordNode = box.querySelector(".loop-clock-word")
      const subNode = box.querySelector(".loop-clock-sub")
      const now = audioCtx ? audioCtx.currentTime : 0
      const beat = 60 / Math.max(40, state.bpm || 92)
      const bar = beat * 4
      const into = now - loopClock.start
      let word = "Keep going…"
      let sub = ""
      let left = 1
      if (state.counting || into < 0) {
        word = state.counting ? (state.countBeat ? String(state.countBeat) : "Get ready…") : "Go!"
        sub = "Start on the next 1"
      } else if (loopClock.length) {
        const remaining = Math.max(0, loopClock.length - into)
        left = remaining / loopClock.length
        const bars = Math.max(1, Math.round(loopClock.length / bar))
        const barNow = Math.min(bars, Math.floor(into / bar) + 1)
        const beatsLeft = Math.ceil(remaining / beat - 0.001)
        if (remaining <= 0.02) word = "Stop"
        else if (beatsLeft <= 3) word = String(beatsLeft)
        sub = remaining <= 0.02 ? "" : beatsLeft <= 3 ? "Almost there" : `Bar ${barNow} of ${bars}`
        box.classList.toggle("ending", beatsLeft <= 3)
      } else {
        // Free length: the block fills once per bar, and you stop when you're done.
        const barNow = Math.floor(into / bar) + 1
        left = 1 - (into % bar) / bar
        word = "Keep going…"
        sub = `Bar ${barNow} · tap the square when you're done`
      }
      if (fill) fill.style.transform = `scaleX(${left.toFixed(4)})`
      if (wordNode && wordNode.textContent !== word) wordNode.textContent = word
      if (subNode && subNode.textContent !== sub) subNode.textContent = sub
    }
    loopClock.raf = requestAnimationFrame(frame)
  }
  loopClock.raf = requestAnimationFrame(frame)
}

function looperBox() {
  const lengths = [[2, "2 bars"], [4, "4 bars"], [8, "8 bars"], [0, "Free"]]
  const busy = state.recording || state.counting || state.arming ? "disabled" : ""
  const set = state.loopSec && songHasSound()
  return `<div class="looper ${state.looper ? "on" : ""}">
    <div class="looper-head">
      <div>
        <p class="ask">Loop pedal</p>
        <p class="hint">${state.looper
          ? set
            ? `Your loop is ${loopWords(state.loopSec)}. Each take stacks on top, in time.`
            : state.loopBars
              ? `Records ${state.loopBars} bars, then loops right away.`
              : "Records until you tap stop, rounded to whole bars."
          : "Off. Takes wait for Keep or Try again."}</p>
      </div>
      <button class="switch ${state.looper ? "on" : ""}" data-action="toggle-looper" role="switch" aria-checked="${state.looper ? "true" : "false"}" aria-label="Loop pedal" ${busy}><span></span></button>
    </div>
    ${state.looper ? `<div class="choices" role="group" aria-label="Loop length">
      ${lengths.map(([bars, label]) => filterChip(label, `data-action="loop-bars" data-bars="${bars}" ${busy}`, state.loopBars === bars)).join("")}
    </div>
    ${set ? `<button class="looper-new" data-action="new-loop" ${busy}>New loop length</button>` : ""}` : ""}
  </div>`
}

function songHasSound() {
  return state.layers.some((layer) => buffers.get(layer.id + ":audio"))
}

function barSeconds() {
  return (60 / Math.max(40, state.bpm || 92)) * 4
}

// How long the loop pedal records before it closes the loop by itself.
// 0 means it waits for you to tap stop.
function loopTarget() {
  if (state.loopSec) return state.loopBars ? state.loopSec : 0
  return state.loopBars ? state.loopBars * barSeconds() : 0
}

function loopWords(seconds) {
  const bars = Math.max(1, Math.round(seconds / barSeconds()))
  return `${bars} ${bars === 1 ? "bar" : "bars"}`
}

// A loop take becomes one pass of whole bars, repeated for the song, the way
// a loop pedal closes a loop. The first take sets the loop. Later takes are
// one pass, or as many whole passes as you sang.
async function keepLoopTake() {
  const blob = pendingBlob
  if (!blob) return
  let decoded
  try {
    decoded = await blobPeaks(blob)
  } catch {
    $("save-status").textContent = "That take didn't open. Try recording again."
    pendingBlob = null
    renderInspector()
    return
  }
  const source = decoded.buffer
  const rate = source.sampleRate
  const data = source.getChannelData(0)
  const lead = Math.min(Math.max(0, recLead), Math.max(0, source.duration - 0.3))
  const sung = Math.max(0.2, source.duration - lead)
  const bar = barSeconds()
  const first = !state.loopSec
  let passSec
  if (first) {
    passSec = state.loopBars ? state.loopBars * bar : Math.max(1, Math.round(sung / bar)) * bar
    state.loopSec = passSec
  } else {
    const passes = state.loopBars ? 1 : Math.max(1, Math.round(sung / state.loopSec))
    passSec = passes * state.loopSec
  }
  const passLength = Math.max(1, Math.round(passSec * rate))
  const pass = new Float32Array(passLength)
  const from = Math.round(lead * rate)
  pass.set(data.subarray(from, Math.min(data.length, from + passLength)))
  const fade = Math.min(Math.floor(rate * 0.006), Math.floor(passLength / 6))
  for (let i = 0; i < fade; i++) {
    pass[i] *= i / fade
    pass[passLength - 1 - i] *= i / fade
  }
  let peak = 0
  for (let i = 0; i < passLength; i += 16) peak = Math.max(peak, Math.abs(pass[i]))
  if (peak < 0.002) {
    if (first) state.loopSec = null
    pendingBlob = null
    $("save-status").textContent = "That loop came in silent. Check the mic and try again."
    renderInspector()
    return
  }
  if (first && (!state.lengthSec || !songHasSound())) state.lengthSec = Math.max(1, Math.ceil(60 / state.loopSec)) * state.loopSec
  const songSec = Math.max(state.lengthSec || 60, passSec)
  const total = Math.round(songSec * rate)
  const tiled = new Float32Array(total)
  for (let at = 0; at < total; at += passLength) tiled.set(passLength <= total - at ? pass : pass.subarray(0, total - at), at)
  const count = state.layers.filter((layer) => layer.loop).length
  addLayer(blob, `Loop ${count + 1}`)
  const layer = state.layers[state.layers.length - 1]
  const buffer = loopedBuffer(tiled, rate, passLength)
  buffers.set(layer.id + ":audio", buffer)
  layer.peaks = peaksFromSamples(tiled)
  layer.loop = true
  layer.lengthSec = Math.round(songSec * 100) / 100
  layer.range = { start: 0, end: songSec }
  layer.from = `loop · ${loopWords(passSec)}`
  layer.sections = [{ id: uid(), name: "Loop", start: 0, end: 1 }]
  recordOrigin = 0
  recordedSeconds = 0
  pendingBlob = null
  state.playAt = 0
  rememberSong()
  renderRuler()
  renderTracks()
  renderInspector()
  wakeSky()
  const stack = state.layers.filter((item) => item.loop).length
  $("save-status").textContent = first
    ? `Loop closed: ${loopWords(passSec)}. It's playing. Tap record to stack the next layer, or Transform to turn it into an instrument.`
    : `Layer ${stack} is on the loop. Tap record for another, or Mix when it feels right.`
  keepSpeakerOn()
  try { play(0) } catch { /* the loop is still on the timeline */ }
  const ctx = ac()
  window.setTimeout(() => {
    if (ctx.state !== "running" && state.panel === "record") {
      $("save-status").textContent = "Your loop is ready. Tap ▶ Play to hear it."
    }
  }, 400)
}

function useTempo(bpm, source, lock) {
  state.bpm = bpm
  state.tempoSource = source
  state.tempoLocked = lock
  const field = $("bpm")
  if (field) field.value = String(bpm)
  rememberSong()
}

async function finishRecording(wasTempo) {
  if (!pendingBlob) {
    renderInspector()
    return
  }
  if (state.looper && !wasTempo) {
    await keepLoopTake()
    return
  }
  $("save-status").textContent = "Finding the tempo…"
  try {
    const decoded = await blobPeaks(pendingBlob)
    const found = wasTempo || !state.tempoLocked
      ? await engine.call("tempoFromAudio", samplesOf(decoded.buffer), decoded.buffer.sampleRate, wasTempo ? "pulse" : "melody")
      : null
    if (found && (wasTempo || !state.tempoLocked)) useTempo(found.bpm, wasTempo ? "your pulse" : "your humming", wasTempo)
    if (wasTempo && found) {
      await keepTake(state.input === "beat" ? "Beatbox" : "Claps", true)
      $("save-status").textContent = `Tempo is ${state.bpm} from your pulse. The click matches it. Record the rest of the song to that.`
      renderInspector()
      return
    }
    if (wasTempo) {
      $("save-status").textContent = "Clap, snap, or beatbox a steady pulse a few more times. At least four hits."
    } else if (found) {
      $("save-status").textContent = `Tempo is ${state.bpm} from your humming. Keep the take. The click will follow that next time.`
    }
  } catch {
    $("save-status").textContent = "Couldn't read the tempo from that take."
  }
  renderInspector()
}

function clickAt(time, accent) {
  if (state.recording && !state.headphones) {
    // No headphones: the click would go straight into the take, so it is
    // only seen, as the beat lights and the sky.
    sky.flashes.push({ when: time, strength: accent ? 1 : 0.42 })
    return
  }
  const ctx = ac()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = accent ? 1680 : 1120
  const peak = (accent ? 0.24 : 0.11) * (state.recording ? 0.6 : 1)
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + (accent ? 0.06 : 0.04))
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(time)
  osc.stop(time + 0.07)
  sky.flashes.push({ when: time, strength: accent ? 1 : 0.42 })
}

function startClick(startAt, beatIndex) {
  stopClick()
  if (!state.click) return
  const ctx = ac()
  const beat = 60 / state.bpm
  let next = startAt || ctx.currentTime + 0.06
  let index = beatIndex || 0
  clickTimer = window.setInterval(() => {
    const now = ctx.currentTime
    while (next < now + 0.25) {
      clickAt(next, index % 4 === 0)
      index += 1
      next += beat
    }
  }, 25)
}

function stopClick() {
  window.clearInterval(clickTimer)
}

function cancelRecord() {
  window.clearTimeout(recAutoStop)
  const wasTempo = state.tempoPass
  state.arming = false
  state.counting = false
  state.countBeat = 0
  state.recording = false
  state.tempoPass = false
  window.clearInterval(recTimer)
  recStream?.getTracks().forEach((track) => track.stop())
  if (playing) stopPlayback()
  else stopClick()
  if (recorder && recorder.state !== "inactive") {
    recorder._wasTempo = wasTempo
    recorder.stop()
    return
  }
  releaseMic()
  endSky()
  if (!pendingBlob) {
    recordOrigin = 0
    recordedSeconds = 0
  }
  renderRuler()
  renderTracks()
  renderInspector()
}

function waitUntil(ctx, when) {
  const ms = Math.max(0, (when - ctx.currentTime) * 1000)
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function countIn() {
  const ctx = ac()
  if (ctx.resume) await ctx.resume()
  const beat = 60 / Math.max(40, state.bpm || 92)
  state.counting = true
  state.countBeat = 0
  renderRuler()
  renderTracks()
  renderInspector()
  if (state.looper && !state.tempoPass) runLoopClock()
  runBeatLights()
  $("save-status").textContent = `Tempo ${state.bpm}. Then a count of four.`
  const countStart = ctx.currentTime + beat + 0.12
  for (let i = 1; i <= 4; i++) {
    await waitUntil(ctx, countStart + (i - 1) * beat)
    if (!state.counting) return false
    clickAt(ctx.currentTime + 0.01, i === 1)
    state.countBeat = i
    const node = $("rec-time")
    if (node) {
      node.textContent = String(i)
      node.classList.add("count-beat")
    }
  }
  await waitUntil(ctx, countStart + 4 * beat)
  return state.counting
}

async function toggleRecord() {
  if (state.recording || state.arming || state.counting) {
    cancelRecord()
    return
  }
  const tempoPass = state.tempoPass
  state.arming = true
  renderInspector()
  try {
    audioSession("play-and-record")
    // Phone-call processing (echo cancelling, noise gating, auto volume)
    // makes singing and instruments thin and wobbly, so it stays off.
    recStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
    })
  } catch {
    try {
      recStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      state.arming = false
      state.tempoPass = false
      $("save-status").textContent = "Microphone permission is needed to record."
      renderInspector()
      return
    }
  }
  guessHeadphones(recStream)
  await captureReady()
  if (!state.arming) {
    recStream?.getTracks().forEach((track) => track.stop())
    return
  }
  state.arming = false
  const span = state.lengthSec || state.span || 40
  if (state.looper && !tempoPass && !songHasSound()) state.loopSec = null
  recordOrigin = state.looper && !tempoPass ? 0 : state.playAt || 0
  if (recordOrigin > span - 0.4) recordOrigin = 0
  if (!tempoPass) {
    if (playing) stopPlayback()
    if (state.looper) {
      loopClock.start = Infinity
      loopClock.length = loopTarget()
      loopClock.closedAt = 0
    }
    const counted = await countIn()
    if (!counted) return
  }
  if (!recStream || recStream.getTracks().every((track) => track.readyState === "ended")) return
  state.counting = false
  state.countBeat = 0
  state.recording = true
  try { armHotMic(recStream) } catch { /* the take still records */ }
  beginSky("record")
  recChunks = []
  const media = startCapture(recStream) || new MediaRecorder(recStream, { audioBitsPerSecond: 256000 })
  media._wasTempo = tempoPass
  recorder = media
  media.ondataavailable = (event) => {
    if (event.data.size) recChunks.push(event.data)
  }
  media.onstop = () => {
    recordedSeconds = recStarted ? Math.max(0, (performance.now() - recStarted) / 1000) : 0
    pendingBlob = media.wav || new Blob(recChunks, { type: media.mimeType || "audio/webm" })
    if (media.firstSample != null) recLead = Math.max(0, media.songStart - media.firstSample) + media.outLatency
    state.recording = false
    state.counting = false
    state.countBeat = 0
    state.tempoPass = false
    if (playing) stopPlayback()
    else stopClick()
    releaseMic()
    endSky()
    renderRuler()
    renderTracks()
    void finishRecording(media._wasTempo)
  }
  media.start()
  const ctx = ac()
  const takeStart = ctx.currentTime
  const beat = 60 / Math.max(40, state.bpm || 92)
  const fromBeat = Math.round(recordOrigin / beat)
  const songStart = ctx.currentTime + 0.02
  if (state.click && !tempoPass) startClick(songStart, fromBeat)
  const hearSong = state.layers.some((layer) => audible(layer) && buffers.get(layer.id + ":audio"))
  if (hearSong && !tempoPass) play(recordOrigin, { keepClick: true })
  // You sing to what you hear, and you hear it a little late. That much is
  // trimmed off the front of a loop so the layers line up.
  recLead = Math.max(0, songStart - takeStart) + (ctx.outputLatency || 0) + (ctx.baseLatency || 0)
  media.songStart = songStart
  media.outLatency = (ctx.outputLatency || 0) + (ctx.baseLatency || 0)
  beatLights.origin = songStart + media.outLatency
  beatLights.firstBeat = fromBeat % 4
  if (!tempoPass) runBeatLights()
  window.clearTimeout(recAutoStop)
  const closeAt = state.looper && !tempoPass ? loopTarget() : 0
  loopClock.start = songStart + (ctx.outputLatency || 0) + (ctx.baseLatency || 0)
  loopClock.length = closeAt
  loopClock.closedAt = 0
  runLoopClock()
  if (closeAt) {
    recAutoStop = window.setTimeout(() => {
      if (recorder === media && state.recording) {
        loopClock.closedAt = performance.now()
        cancelRecord()
        window.setTimeout(() => {
          if (!state.recording && !state.counting && state.panel === "record") renderInspector()
        }, 1600)
      }
    }, (closeAt + recLead + 0.12) * 1000)
  }
  recStarted = performance.now()
  recTimer = window.setInterval(() => {
    const node = $("rec-time")
    if (!node || state.counting) return
    const seconds = Math.floor((performance.now() - recStarted) / 1000)
    const target = state.looper && !tempoPass ? loopTarget() : 0
    if (state.looper && !tempoPass) {
      node.textContent = target ? "The loop closes by itself. Tap the square to stop early." : "Tap the square when you're done. It rounds to whole bars."
      node.classList.remove("count-beat")
      syncRecordGuide()
      return
    }
    node.textContent = tempoPass
      ? `00:${String(seconds).padStart(2, "0")} · listening for the tempo`
      : `00:${String(seconds).padStart(2, "0")} · recording`
    node.classList.remove("count-beat")
    syncRecordGuide()
  }, 250)
  syncRecordGuide()
  $("save-status").textContent = hearSong && !tempoPass
    ? "Recording. You hear the song, and only your mic goes in the take."
    : `Recording at ${state.bpm}, full quality.`
  renderInspector()
}

function shapeSelectedLayer(lengthSec, shapeId, heard) {
  const layer = selectedLayer()
  if (!layer || !buffers.get(layer.id + ":audio")) {
    $("save-status").textContent = "Keep a recording on a layer first."
    return
  }
  const nextLength = clampLength(lengthSec || layer.lengthSec || 60)
  snapshot([layer.id])
  const source = buffers.get(layer.id + ":audio")
  const tiled = tilePhrase(source, nextLength)
  buffers.set(layer.id + ":audio", tiled)
  layer.peaks = peaksFromSamples(tiled.getChannelData(0))
  layer.lengthSec = nextLength
  if (layer.range) layer.range = { start: layer.range.start, end: layer.range.start + nextLength }
  if (shapeId && SHAPES[shapeId]) {
    layer.shape = shapeId
    state.shape = shapeId
    layer.sections = SHAPES[shapeId].bands.map(([name, start, end], index) => ({
      id: `${layer.id}-${shapeId}-${index}`,
      name,
      start,
      end,
    }))
    state.section = layer.sections[0].id
  } else if (!layer.sections?.length) {
    layer.sections = [{ id: uid(), name: "Part 1", start: 0, end: 1 }]
    state.section = layer.sections[0].id
  }
  const occupied = layer.range ? layer.range.end : nextLength
  state.lengthSec = Math.max(state.lengthSec || 0, occupied)
  state.heard = heard
  rememberSong()
  renderPlanNote()
  renderRuler()
  renderTracks()
  renderInspector()
  $("save-status").textContent = heard
  if (playing) play(state.playAt || 0)
}

function applyPlan(lengthSec, shapeId, heard) {
  const layer = selectedLayer()
  if (layer && buffers.get(layer.id + ":audio")) {
    shapeSelectedLayer(lengthSec, shapeId, heard)
    return
  }
  const nextLength = clampLength(lengthSec || state.lengthSec || 60)
  const nextShape = SHAPES[shapeId] ? shapeId : null
  snapshot()
  state.lengthSec = nextLength
  if (nextShape && nextShape !== state.shape) state.sections = null
  state.shape = nextShape
  state.heard = heard || (nextShape ? planMessage(nextLength, nextShape) : lengthNote(nextLength, false))
  rememberSong()
  renderPlanNote()
  renderRuler()
  renderTracks()
  renderInspector()
  $("save-status").textContent = state.heard
}

function lengthNote(seconds, hadShape, extra) {
  const clock = formatClock(seconds)
  const prefix = extra ? `${extra} ` : ""
  if (hadShape && state.shape) return `${prefix}${planMessage(seconds, state.shape)}`
  return `${prefix}${clock}. Recordings will loop to fill it. Choose a shape below if you want a build, a climax, or a soft ending.`
}

function useWish() {
  const wish = readWish(state.wish)
  if (!wish) {
    state.heard = "Say a length, like 3 minutes, and whether you want it steady, softened, or built up."
    renderInspector()
    $("save-status").textContent = state.heard
    return
  }
  const limit = [wish.tooLong ? "8:00 is the longest song here." : "", wish.tooShort ? "The shortest song here is 0:15." : ""].filter(Boolean).join(" ")
  if (wish.intent) state.intent = wish.intent
  if (wish.shape) {
    const layer = selectedLayer()
    const assumed = !wish.lengthSec && !layer?.lengthSec && !state.lengthSec
    const length = wish.lengthSec || layer?.lengthSec || state.lengthSec || 60
    const assumedNote = assumed ? "I used 1:00. " : ""
    applyPlan(length, wish.shape, `${assumedNote}${limit ? `${limit} ` : ""}${planMessage(length, wish.shape)}`)
    return
  }
  const ask = wish.intent === "climax"
    ? "You asked for a build-up or a climax. Pick one of these ways to do it."
    : wish.intent === "soft"
      ? "You asked to soften the edges. Pick the one that fits."
      : ""
  if (wish.lengthSec) {
    const hadShape = !!state.shape
    const note = hadShape
      ? `${planMessage(wish.lengthSec, state.shape)}${ask ? ` ${ask}` : ""}`
      : lengthNote(wish.lengthSec, false, [limit, ask].filter(Boolean).join(" "))
    applyPlan(wish.lengthSec, hadShape ? state.shape : null, note)
    return
  }
  state.heard = [limit, ask || "Pick a shape below."].filter(Boolean).join(" ")
  renderInspector()
  $("save-status").textContent = state.heard
}

function sectionWorkLine() {
  const section = activeSection()
  if (!section) return "Drag the play line, or click a section of this layer. A kept recording is 1:00. Add a section, then delete the part you don't want."
  const how = state.sectionMode === "replace" ? "Change this part replaces what is already there." : "Add onto this part keeps what is already there."
  return `${section.name}, ${sectionClock(section)}. ${how} Fill layer with this section repeats that part across the selected layer. Undo puts the layer back.`
}

function scheduleShape(gainNode, base, shapeId, startTime, span, fromSec) {
  const points = (SHAPES[shapeId] || SHAPES.even).points
  const param = gainNode.gain
  const from = Math.max(0, fromSec || 0)
  param.cancelScheduledValues(startTime)
  param.setValueAtTime(Math.max(0, base * levelAt(shapeId, from / span)), startTime)
  for (const [frac, level] of points) {
    const at = frac * span
    if (at <= from + 0.02) continue
    param.linearRampToValueAtTime(Math.max(0, base * level), startTime + (at - from))
  }
}

function scheduleHoles(hole, gaps, when, fromSec) {
  const param = hole.gain
  param.cancelScheduledValues(when)
  const upcoming = (gaps || []).filter((gap) => gap.end > fromSec + 0.01).sort((a, b) => a.start - b.start)
  let level = 1
  for (const gap of upcoming) {
    if (fromSec >= gap.start && fromSec < gap.end) level = 0
  }
  param.setValueAtTime(level, when)
  let cursor = when
  for (const gap of upcoming) {
    const down = Math.max(cursor + 0.01, when + Math.max(0, gap.start - fromSec))
    const up = Math.max(down + 0.01, when + (gap.end - fromSec))
    param.setValueAtTime(0, down)
    param.setValueAtTime(1, up)
    cursor = up
  }
}

function transformFit(layer, sound) {
  const family = mixFamily(layer)
  if (sound === "Drums") return family === "drums"
  if (sound === "Bass") return family === "bass"
  return family === "vocal" || family === "choir" || family === "instrument"
}

function missingPart(sound) {
  if (sound === "Drums") return "a beat"
  if (sound === "Bass") return "low notes"
  return "a melody"
}

function sourceForTransform(selected, sound, layers) {
  if (transformFit(selected, sound)) return { layer: selected, redirected: false }
  const match = layers.find((layer) => layer.id !== selected.id && transformFit(layer, sound))
  if (match) return { layer: match, redirected: true }
  return { layer: selected, redirected: false }
}

function playingChoice(sound) {
  if (!sound || sound === "Drums" || sound === "Vocals") return null
  const figure = state.figure === "chords" ? "chords" : "solo"
  const touch = state.touch === "beat" ? "beat" : state.touch === "strum" ? "strum" : "hold"
  if (sound === "Bass" || figure === "solo") return { figure: "solo", touch: touch === "strum" ? "hold" : touch }
  return { figure, touch }
}

function playingWords(playing) {
  if (!playing) return ""
  const notes = playing.figure === "chords" ? "chords" : "solo"
  const touch = playing.touch === "beat" ? "on the beat" : playing.touch === "strum" ? "strummed" : "held"
  return `${notes}, ${touch}`
}

function showSongCredit() {
  const song = state.song
  const author = $("song-author")
  const credit = $("song-credit")
  if (author) {
    author.value = song?.author || ""
    author.readOnly = !!song?.demo
  }
  if (credit) {
    credit.textContent = song?.credit || ""
    credit.title = song?.credit || ""
  }
}

function syncPlaying(layer) {
  if (layer?.pocket === "boom" || layer?.pocket === "backbeat" || layer?.pocket === "played") state.pocket = layer.pocket
  if (!layer?.figure) return
  state.figure = layer.figure === "chords" ? "chords" : "solo"
  state.touch = layer.touch === "beat" ? "beat" : layer.touch === "strum" ? "strum" : "hold"
}

function pianoKeys() {
  const whites = WHITE_KEYS.map((pc) => `<button type="button" class="piano-white ${state.keyPc === pc ? "on" : ""}" data-action="pick-key" data-key="${pc}" aria-label="Key of ${KEY_NAMES[pc]}">${KEY_NAMES[pc]}</button>`).join("")
  const blacks = BLACK_KEYS.map((key) => `<button type="button" class="piano-black ${state.keyPc === key.pc ? "on" : ""}" style="left:${key.left}" data-action="pick-key" data-key="${key.pc}" aria-label="Key of ${KEY_NAMES[key.pc]}">${KEY_NAMES[key.pc]}</button>`).join("")
  return `<div class="piano" role="group" aria-label="Piano key"><div class="piano-whites">${whites}</div><div class="piano-blacks">${blacks}</div></div>`
}

function previewKey(pc) {
  const ctx = ac()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "triangle"
  osc.frequency.value = 440 * 2 ** ((60 + pc - 69) / 12)
  const now = ctx.currentTime
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.55)
}

function addStarter() {
  const bpm = state.bpm || 96
  const beat = 60 / bpm
  const bars = state.lengthSec ? Math.max(4, Math.min(16, Math.round(state.lengthSec / (beat * 4)))) : 4
  if (state.transforming) return
  state.transforming = true
  $("save-status").textContent = "Making the starter…"
  const songId = state.song?.id
  void engine.call("starterAudio", { kind: state.vibe, bpm, key: state.keyPc || 0, bars })
    .then((made) => {
      state.transforming = false
      if (state.song?.id === songId) keepStarter(made, bpm)
    })
    .catch(() => {
      state.transforming = false
      $("save-status").textContent = "That starter didn't render. Nothing was added."
    })
}

function keepStarter(made, bpm) {
  if (!made?.samples?.length) {
    $("save-status").textContent = "That starter didn't render. Nothing was added."
    return
  }
  snapshot()
  const id = uid()
  const names = { claps: "Claps", snaps: "Snaps", guitar: "Guitar", piano: "Piano" }
  const sounds = { claps: "Claps", snaps: "Snaps", guitar: "Acoustic guitar", piano: "Piano" }
  const keyName = KEY_NAMES[state.keyPc] || "C"
  const layer = {
    id,
    name: names[state.vibe] || "Starter",
    sound: sounds[state.vibe] || "Layer",
    from: `starter · ${keyName} · ${bpm}`,
    color: state.vibe === "piano" ? "#f0a202" : state.vibe === "guitar" ? "#ff8ab0" : "#3d7eff",
    peaks: peaksFromSamples(made.samples),
    gain: state.vibe === "snaps" ? 0.55 : 0.72,
    pan: 0,
    low: 0,
    high: 0,
    space: state.vibe === "piano" || state.vibe === "guitar" ? 0.16 : 0.02,
    mute: false,
    solo: false,
    live: true,
  }
  state.layers.push(layer)
  state.selected = id
  buffers.set(id + ":audio", audioBuffer(made.samples, made.sampleRate))
  useTempo(bpm, "this starter", true)
  rememberSong()
  renderTracks()
  renderInspector()
  $("save-status").textContent = `${layer.name} is in, in the key of ${keyName}, at ${bpm}. Record from the mic when you want your voice on top.`
  try { play() } catch { /* the starter is still on the timeline */ }
}

function enhanceLabel(amount) {
  if (amount < 0.45) return "A light touch"
  if (amount < 0.8) return "A clear tidy"
  return "Strong"
}

function applyEnhance(mode) {
  if (state.transforming) return
  const names = { clear: "Magic clear", hiss: "Clear hiss", bright: "Brighten", warm: "Warm", smooth: "Smooth" }
  const layer = state.layers.find((item) => item.id === state.selected) || state.layers.find((item) => buffers.get(item.id + ":audio"))
  const audio = layer && buffers.get(layer.id + ":audio")
  if (!layer || !audio || typeof SongbirdMusic.enhanceAudio !== "function") {
    state.transformNote = "Keep a recording first, then Magic clear can tidy it."
    state.transformTone = "warn"
    $("save-status").textContent = state.transformNote
    renderInspector()
    return
  }
  const slider = $("enhance-amount")
  if (slider) state.enhanceAmount = Math.min(1, Math.max(0.25, Number(slider.value) || 0.65))
  state.transforming = true
  state.transformNote = `${names[mode] || "Magic clear"} is working on ${layer.name}… You can keep working.`
  state.transformTone = ""
  $("save-status").textContent = state.transformNote
  renderInspector()
  const songId = state.song?.id
  void engine.call("enhanceAudio", samplesOf(audio), audio.sampleRate, { mode: mode || "clear", amount: state.enhanceAmount, loopSamples: audio.loopSamples || 0 })
    .then((made) => {
      state.transforming = false
      if (state.song?.id !== songId || !state.layers.includes(layer) || buffers.get(layer.id + ":audio") !== audio) {
        renderInspector()
        return
      }
      keepEnhance(layer, audio, made, mode, names)
    })
    .catch(() => {
      state.transforming = false
      state.transformNote = "That didn't work. The layer is unchanged."
      state.transformTone = "warn"
      $("save-status").textContent = state.transformNote
      renderInspector()
    })
}

function keepEnhance(layer, audio, made, mode, names) {
  snapshot([layer.id])
  if (!buffers.get(layer.id + ":original")) buffers.set(layer.id + ":original", audio)
  const next = loopedBuffer(made, audio.sampleRate, audio.loopSamples || 0)
  buffers.set(layer.id + ":audio", next)
  layer.peaks = peaksFromSamples(made)
  if (!layer.from) layer.from = "enhanced"
  else if (layer.loop && !/enhanced/.test(layer.from)) layer.from = `${layer.from} · enhanced`
  state.selected = layer.id
  state.arrived = layer.id
  state.transformNote = `${names[mode] || "Magic clear"} is on ${layer.name}. Revert puts the original back. Undo steps back one edit.`
  state.transformTone = ""
  wakeSky()
  rememberSong()
  renderTracks()
  renderInspector()
  $("save-status").textContent = state.transformNote
}

function magicNote(fallback) {
  if (!state.pendingMagic) return fallback
  const label = state.pendingMagic
  state.pendingMagic = ""
  return `${label}. Hit Magic again for another idea. Revert puts the original back.`
}

function nextMagic(text) {
  const wish = String(text || "").toLowerCase()
  let pool = MAGIC_PRESETS.filter((item) => item.words.some((word) => wish.includes(word)))
  if (!pool.length) pool = MAGIC_PRESETS
  const preset = { ...pool[state.magicStep % pool.length] }
  if (/large|big room|hall/.test(wish)) {
    preset.room = "large"
    preset.reverb = true
  } else if (/small|close|dry/.test(wish)) {
    preset.room = "small"
    preset.reverb = false
  } else if (/room|reverb/.test(wish)) preset.reverb = true
  if (/echo|delay/.test(wish)) preset.echo = true
  if (/autotune/.test(wish)) preset.pitch = "autotune"
  const period = PERIODS.find((item) => wish.includes(String(item.id)) || wish.includes(item.name.toLowerCase()))
  if (period) preset.era = period.id
  return preset
}

function applyMagic() {
  if (state.transforming) return
  const box = $("magic-wish")
  if (box) state.magicWish = box.value
  const layer = state.layers.find((item) => item.id === state.selected) || state.layers.find((item) => buffers.get(item.id + ":audio"))
  if (!layer || !buffers.get(layer.id + ":audio") && !buffers.get(layer.id + ":original")) {
    state.transformNote = "Record a layer, or add a starter, then hit Magic."
    state.transformTone = "warn"
    $("save-status").textContent = state.transformNote
    renderInspector()
    return
  }
  state.selected = layer.id
  const preset = nextMagic(state.magicWish)
  state.magicStep += 1
  state.role = preset.role === "instrument" ? "instrument" : "vocals"
  state.vocalType = preset.vocalType || "solo"
  if (preset.instrument) state.instrument = preset.instrument
  if (preset.figure) state.figure = preset.figure
  if (preset.touch) state.touch = preset.touch
  if (preset.pocket) state.pocket = preset.pocket
  state.pitch = preset.pitch || "correct"
  state.room = preset.room || "medium"
  state.reverb = preset.reverb !== false
  state.echo = !!preset.echo
  if (preset.era) state.era = preset.era
  state.pendingMagic = preset.label
  state.suggestId = layer.id
  commitTransform()
}

function revertToOriginal() {
  const selected = state.layers.find((item) => item.id === state.selected) || state.layers.find((item) => buffers.get(item.id + ":audio"))
  if (!selected) {
    $("save-status").textContent = "Record a layer first."
    return
  }
  const original = buffers.get(selected.id + ":original")
  if (!original) {
    state.transformNote = `${selected.name} is already the original recording.`
    state.transformTone = ""
    $("save-status").textContent = state.transformNote
    renderInspector()
    return
  }
  snapshot([selected.id])
  buffers.set(selected.id + ":audio", original)
  selected.peaks = peaksFromSamples(original.getChannelData(0))
  selected.name = selected.baseName || selected.name
  selected.sound = selected.originSound || selected.sound || "Voice"
  selected.transformed = false
  selected.vocalType = ""
  selected.from = selected.baseName ? `was ${selected.baseName}` : ""
  state.pitch = "none"
  state.role = /drum|guitar|piano|rhodes|horn|bass|clap|snap/i.test(`${selected.sound} ${selected.name}`) ? "instrument" : "vocals"
  state.suggestId = selected.id
  state.arrived = selected.id
  state.transformNote = `${selected.name} is back to the original.`
  state.transformTone = ""
  rememberSong()
  renderTracks()
  renderInspector()
  $("save-status").textContent = state.transformNote
  try { play() } catch { /* the original is still on the timeline */ }
}

function suggestPackage(id) {
  if (state.genreTouched || typeof SongbirdPackages === "undefined") return
  const pack = SongbirdPackages.get(id)
  if (!pack) return
  state.genre = id
  state.subgenre = pack.subgenres?.[0]?.id || state.subgenre
}

function suggestIntoState(layer) {
  if (!layer || state.suggestId === layer.id) return
  if (layer.role) {
    state.role = layer.role === "instrument" ? "instrument" : "vocals"
    state.vocalType = layer.vocalType || "solo"
    state.pitch = layer.pitch || "none"
    state.mic = layer.mic || "close"
    state.reverb = layer.reverb !== false
    state.echo = !!layer.echo
    state.room = layer.room || "small"
    if (layer.figure) state.figure = layer.figure === "chords" ? "chords" : "solo"
    if (layer.touch) state.touch = layer.touch
    const instruments = ["Piano", "Rhodes", "Acoustic guitar", "Electric guitar", "Horn", "Drums", "Bass"]
    if (instruments.includes(layer.sound)) state.instrument = layer.sound
    if (layer.sound === "Choir") state.vocalType = "choir"
    const period = PERIODS.find((item) => (layer.from || "").includes(item.name))
    if (period) state.era = period.id
    state.suggestId = layer.id
    return
  }
  const text = `${layer.sound || ""} ${layer.name || ""}`.toLowerCase()
  const drums = /drum|clap|kit|beatbox/.test(text)
  const instruments = ["Piano", "Rhodes", "Acoustic guitar", "Electric guitar", "Horn", "Drums", "Bass"]
  const period = PERIODS.find((item) => (layer.from || "").includes(item.name))
  state.era = period?.id || "today"
  state.echo = false
  state.mic = "close"
  if (drums) {
    state.role = "instrument"
    state.instrument = "Drums"
    state.pitch = "correct"
    state.reverb = false
    state.room = "small"
    state.pocket = layer.pocket === "boom" || layer.pocket === "backbeat" || layer.pocket === "played" ? layer.pocket : "backbeat"
    suggestPackage("hiphop")
  } else if (layer.sound === "Choir") {
    state.role = "vocals"
    state.vocalType = "choir"
    state.pitch = "correct"
    state.reverb = true
    state.room = "large"
  } else if (instruments.includes(layer.sound)) {
    state.role = "instrument"
    state.instrument = layer.sound
    state.figure = layer.figure === "chords" ? "chords" : "solo"
    state.touch = layer.touch === "beat" || layer.touch === "strum" ? layer.touch : "hold"
    state.pitch = "correct"
    state.reverb = true
    state.room = "medium"
  } else if (/instrument/.test(text)) {
    state.role = "instrument"
    state.instrument = "Piano"
    state.figure = "solo"
    state.pitch = "correct"
    state.reverb = true
    state.room = "medium"
  } else {
    state.role = "vocals"
    state.vocalType = "solo"
    state.pitch = "none"
    state.reverb = true
    state.room = "small"
  }
  state.suggestId = layer.id
}

function suggestionLine(layer) {
  const pack = typeof SongbirdPackages !== "undefined" ? SongbirdPackages.get(state.genre) : null
  const variation = pack?.subgenres?.find((item) => item.id === state.subgenre)?.name || pack?.name || "R&B"
  const period = PERIODS.find((item) => item.id === state.era)?.name || "Today"
  const kind = state.role === "instrument" ? state.instrument : state.vocalType === "choir" ? "choir" : state.vocalType === "background" ? "background vocals" : "solo vocals"
  return `Based on ${layer.name}: ${pack?.name || "R&B"}, ${variation}, ${period}, ${kind}, ${state.room} room.`
}

function stampEffects(layer, voice) {
  const micTone = { close: [-1, 3.2], room: [2, -2.5], bright: [-2.2, 5] }[state.mic] || [-1, 3]
  const eraTone = { "1900": [2.4, -3], "1920": [1.6, -1.5], "1950": [0.8, -0.6], "1960": [1.4, -0.8], "1970": [0.6, 0.2], "1980": [-0.8, 2.2], "1990": [0.4, -0.8], "2000": [-0.6, 1.4], today: [0, 0.6] }[state.era] || [0, 0]
  layer.low = voice ? micTone[0] + eraTone[0] : micTone[0]
  layer.high = voice ? micTone[1] + eraTone[1] : micTone[1]
  layer.mic = state.mic
  const wet = { small: 0.16, medium: 0.4, large: 0.72 }[state.room] || 0.4
  const dry = { small: 0.02, medium: 0.08, large: 0.16 }[state.room] || 0.08
  layer.space = state.reverb ? wet : dry
  layer.echo = state.echo ? (state.room === "large" ? 0.42 : state.room === "medium" ? 0.32 : 0.24) : 0
  layer.room = state.room
  layer.reverb = !!state.reverb
  layer.role = state.role
  layer.pitch = state.pitch
}

function keepOriginalAudio(layer) {
  if (!buffers.get(layer.id + ":original")) {
    const current = buffers.get(layer.id + ":audio")
    if (current) buffers.set(layer.id + ":original", current)
  }
  if (!layer.originSound) layer.originSound = layer.sound
  if (!layer.baseName) layer.baseName = layer.name
  return buffers.get(layer.id + ":original") || buffers.get(layer.id + ":audio")
}

function finishVoice() {
  const selected = state.layers.find((item) => item.id === state.selected) || state.layers.find((item) => buffers.get(item.id + ":audio"))
  if (!selected || state.transforming) return
  const audio = keepOriginalAudio(selected)
  if (!audio) {
    state.transformNote = "Record a layer first."
    state.transformTone = "warn"
    $("save-status").textContent = state.transformNote
    renderInspector()
    return
  }
  state.transforming = true
  state.transformNote = "Updating the voice…"
  $("save-status").textContent = state.transformNote
  renderInspector()
  const songId = state.song?.id
  void (async () => {
    try {
      const source = buffers.get(selected.id + ":original") || audio
      const tune = state.pitch === "correct" || state.pitch === "autotune"
      const tuned = tune
        ? await engine.call("tuneVoice", samplesOf(source), source.sampleRate, state.pitch === "autotune" ? 0.95 : 0.62, source.loopSamples || 0)
        : null
      if (state.song?.id !== songId || !state.layers.includes(selected)) {
        state.transforming = false
        return
      }
      snapshot([selected.id])
      let samples = source.getChannelData(0)
      if (tune) {
        samples = tuned
        const pass = source.loopSamples ? (source.loopSamples * SongbirdMusic.sampleRate) / source.sampleRate : 0
        buffers.set(selected.id + ":audio", loopedBuffer(samples, SongbirdMusic.sampleRate, Number.isInteger(pass) ? pass : 0))
        selected.transformed = true
      } else {
        buffers.set(selected.id + ":audio", source)
        samples = source.getChannelData(0)
        selected.transformed = false
      }
      selected.peaks = peaksFromSamples(samples)
      const background = state.vocalType === "background"
      selected.name = background ? "Background vocals" : (selected.baseName || "Singing")
      selected.sound = "Voice"
      selected.vocalType = state.vocalType
      selected.gain = background ? 0.5 : 0.84
      selected.pan = background ? 0.34 : 0
      stampEffects(selected, true)
      const period = PERIODS.find((item) => item.id === state.era) || PERIODS[PERIODS.length - 1]
      const pitchWord = state.pitch === "autotune" ? "autotune" : state.pitch === "correct" ? "pitch correction" : "as recorded"
      selected.from = [`was ${selected.baseName}`, background ? "background" : "solo", period.name, pitchWord, `${state.room} room`].join(" · ")
      state.selected = selected.id
      state.arrived = selected.id
      state.transformNote = magicNote(background
        ? `${selected.baseName} is background vocals. ${pitchWord}. Revert puts the original back.`
        : `${selected.baseName} stays a lead vocal. ${pitchWord}. Revert puts the original back.`)
      state.transformTone = ""
      rememberSong()
      $("save-status").textContent = state.transformNote
      try { play() } catch { /* the voice is still on the timeline */ }
    } catch {
      state.transformNote = "That didn't work. The layer is unchanged."
      state.transformTone = "warn"
      $("save-status").textContent = state.transformNote
    }
    state.transforming = false
    renderTracks()
    renderInspector()
  })()
}

function restoreRecording() {
  const selected = state.layers.find((item) => item.id === state.selected) || state.layers.find((item) => buffers.get(item.id + ":audio"))
  if (!selected || state.transforming) return
  const audio = keepOriginalAudio(selected)
  if (!audio) return
  snapshot([selected.id])
  buffers.set(selected.id + ":audio", audio)
  selected.peaks = peaksFromSamples(audio.getChannelData(0))
  selected.transformed = false
  selected.sound = selected.originSound || selected.sound || "Voice"
  selected.name = selected.baseName || selected.name
  selected.vocalType = ""
  stampEffects(selected, true)
  const period = PERIODS.find((item) => item.id === state.era) || PERIODS[PERIODS.length - 1]
  selected.from = [`was ${selected.baseName}`, "as recorded", period.name, `${state.room} room`].join(" · ")
  state.arrived = selected.id
  state.transformNote = magicNote(`${selected.name} is the recording, with mic and room. Revert puts the original back.`)
  state.transformTone = ""
  rememberSong()
  $("save-status").textContent = state.transformNote
  renderTracks()
  renderInspector()
  try { play() } catch { /* the recording is still on the timeline */ }
}

function effectOnly() {
  const layer = state.layers.find((item) => item.id === state.selected) || state.layers[0]
  if (!layer) return
  snapshot()
  stampEffects(layer, state.role !== "instrument" && state.vocalType !== "choir")
  rememberSong()
  renderTracks()
  renderInspector()
  if (playing) play(state.playAt || 0)
  else refreshMix(layer)
  const room = state.room[0].toUpperCase() + state.room.slice(1)
  $("save-status").textContent = `${room} room. ${state.reverb ? "Reverb is on." : "Reverb is off."} ${state.echo ? "Echo is on." : "Echo is off."}`
}

function commitTransform() {
  if (state.transforming) return
  if (state.role === "instrument" && state.pitch === "none") {
    restoreRecording()
    return
  }
  if (state.role === "vocals" && state.vocalType !== "choir") {
    finishVoice()
    return
  }
  addTransformedLayer(state.role === "vocals" ? "Choir" : (state.instrument || "Piano"))
}

function retuneSelected() {
  const selected = state.layers.find((item) => item.id === state.selected)
  if (selected && selected.transformed && PACKAGES.some((item) => item.id === selected.sound) && selected.sound !== "Vocals") {
    addTransformedLayer(selected.sound)
    return true
  }
  renderInspector()
  return false
}

function keepAsSinging() {
  const selected = state.layers.find((item) => item.id === state.selected) || state.layers.find((item) => isVocalLayer(item)) || state.layers[0]
  if (!selected) {
    state.transformNote = "Record your singing first. It stays a voice."
    state.transformTone = "warn"
    $("save-status").textContent = state.transformNote
    renderInspector()
    return
  }
  const origin = state.layers.find((item) => item.id === selected.sourceId) || selected
  if (!isVocalLayer(origin)) {
    state.transformNote = `${selected.name} is not a vocal. Singing keeps a sung take as a voice. Select the singing, or record Hum or sing.`
    state.transformTone = "warn"
    $("save-status").textContent = state.transformNote
    renderInspector()
    return
  }
  snapshot()
  if (/^instrument$/i.test(origin.name)) origin.name = "Singing"
  origin.sound = "Voice"
  origin.gain = Math.max(origin.gain || 0.8, 0.84)
  origin.pan = 0
  origin.low = -1
  origin.high = 2.5
  origin.space = Math.min(origin.space ?? 0.12, 0.18)
  state.selected = origin.id
  rememberSong()
  refreshMix(origin)
  const extra = selected.id !== origin.id ? ` ${selected.name} stays beside it.` : ""
  state.transformNote = `${origin.name} stays singing. It was not turned into an instrument.${extra}`
  state.transformTone = ""
  $("save-status").textContent = state.transformNote
  renderTracks()
  renderInspector()
  try { play() } catch { /* the vocal is still on the timeline */ }
}

function addTransformedLayer(sound, extra) {
  if (sound === "Vocals") {
    keepAsSinging()
    return
  }
  if (state.transforming) return
  const layers = state.layers.filter((layer) => buffers.get(layer.id + ":audio") || buffers.get(layer.id + ":original"))
  const selected = layers.find((layer) => layer.id === state.selected) || layers[0]
  if (!selected) {
    state.transformNote = "Record a layer, then pick a sound."
    state.transformTone = "warn"
    $("save-status").textContent = state.transformNote
    renderInspector()
    return
  }
  state.transforming = true
  state.transformNote = `Turning ${selected.baseName || selected.name} into ${sound}…`
  state.transformTone = ""
  $("save-status").textContent = state.transformNote
  renderInspector()
  const ctx = ac()
  if (ctx.resume) void ctx.resume()
  const songId = state.song?.id
  void (async () => {
    try {
      if (!buffers.get(selected.id + ":original")) {
        const current = buffers.get(selected.id + ":audio")
        if (current) buffers.set(selected.id + ":original", current)
      }
      const audio = buffers.get(selected.id + ":original") || buffers.get(selected.id + ":audio")
      const copy = samplesOf(audio)
      const period = PERIODS.find((item) => item.id === state.era) || PERIODS[PERIODS.length - 1]
      const pack = PACKAGES.find((item) => item.id === sound)
      const playing = playingChoice(sound)
      const patternId = extra && extra.pattern ? extra.pattern : ""
      const pattern = patternId && typeof SongbirdPackages !== "undefined" ? SongbirdPackages.pattern(patternId) : null
      const made = await engine.call("transformAudio", copy, sound, {
        bpm: state.bpm,
        sampleRate: audio.sampleRate,
        loopSamples: audio.loopSamples || 0,
        era: period.id,
        ...(playing ? { figure: playing.figure, touch: playing.touch } : {}),
        ...(sound === "Drums" ? { pocket: state.pocket, ...(pattern ? { pattern } : {}) } : {}),
      })
      if (state.song?.id !== songId || !state.layers.includes(selected)) {
        state.transforming = false
        return
      }
      if (!made) {
        state.transformNote = `Couldn't find ${missingPart(sound)} in ${selected.baseName || selected.name}. Nothing changed.`
        state.transformTone = "warn"
        $("save-status").textContent = state.transformNote
      } else {
        snapshot([selected.id])
        const colors = { Piano: "#f0a202", Rhodes: "#7ee0c8", "Acoustic guitar": "#ff8ab0", "Electric guitar": "#ff4d8d", Guitar: "#ff8ab0", Horn: "#F9A8D4", Drums: "#3d7eff", Bass: "#d98a00", Choir: "#b44dff" }
        const label = pack ? pack.name : sound
        const played = playingWords(playing)
        const pocketLabel = sound !== "Drums" ? "" : patternId || (state.pocket === "boom" ? "boom-bap" : state.pocket === "backbeat" ? "backbeat" : "backbeat")
        if (!selected.baseName) selected.baseName = selected.name
        selected.name = label
        selected.sound = sound
        selected.vocalType = sound === "Choir" ? "choir" : ""
        selected.transformed = true
        selected.figure = playing ? playing.figure : ""
        selected.touch = playing ? playing.touch : ""
        selected.pocket = sound === "Drums" ? (patternId || state.pocket) : ""
        selected.from = [`was ${selected.baseName}`, period.name, played, pocketLabel].filter(Boolean).join(" · ")
        selected.color = colors[sound] || "#7aa2ff"
        selected.peaks = peaksFromSamples(made.samples)
        buffers.set(selected.id + ":audio", loopedBuffer(made.samples, SongbirdMusic.sampleRate, made.loop ? made.loop.period * SongbirdMusic.sampleRate : 0))
        stampEffects(selected, false)
        state.selected = selected.id
        state.arrived = selected.id
        state.transformNote = magicNote(`${selected.baseName} is now ${label}. ${period.name}, ${state.room} room. Revert puts the original back.`)
        state.transformTone = ""
        rememberSong()
        $("save-status").textContent = state.transformNote
        try { play() } catch { /* the transformed layer is still on the timeline */ }
      }
    } catch {
      state.transformNote = "That didn't work. The layer is unchanged."
      state.transformTone = "warn"
      $("save-status").textContent = state.transformNote
    }
    state.transforming = false
    renderTracks()
    renderInspector()
    document.querySelector(".track.arrived")?.scrollIntoView?.({ block: "nearest", inline: "nearest" })
  })()
}

function genreOrigin() {
  const layers = state.layers.filter((layer) => buffers.get(layer.id + ":audio"))
  return layers.find((layer) => isVocalLayer(layer)) || layers.find((layer) => layer.sound !== "Drums") || layers[0] || null
}

async function renderGenreTakes() {
  const profile = SongbirdPackages.get(state.genre)
  const steps = SongbirdPackages.readySteps(state.genre, state.subgenre, state.blend)
  const origin = genreOrigin()
  if (!profile || !origin) return { error: "Record a layer first. The package list is here, and nothing is applied until there is audio." }
  if (!steps.length) return { error: "Those packages have no ready steps to combine. Nothing was changed." }
  const audio = buffers.get(origin.id + ":audio")
  const songId = state.song?.id
  const plan = steps.map((step) => ({
    sound: step.sound,
    options: {
      era: step.era,
      ...(step.figure ? { figure: step.figure, touch: step.touch || "hold" } : {}),
      ...(step.pattern ? { pattern: SongbirdPackages.pattern(step.pattern) } : {}),
    },
  }))
  const outs = await engine.call("transformSteps", samplesOf(audio), plan, {
    bpm: state.bpm,
    sampleRate: audio.sampleRate,
    loopSamples: audio.loopSamples || 0,
  })
  if (state.song?.id !== songId) return { stale: true }
  const made = []
  steps.forEach((step, index) => {
    const out = outs && outs[index]
    if (out) made.push({ step, out, pattern: plan[index].options.pattern || null })
  })
  if (!made.length) return { error: `Couldn't find a melody in ${origin.name}. Nothing was added.`, profile, origin }
  return { profile, origin, steps, made }
}

let previewSources = []

function stopPreview() {
  for (const source of previewSources) {
    try { source.stop() } catch { /* already stopped */ }
  }
  previewSources = []
}

function playGenrePreview(made) {
  stopPlayback()
  stopPreview()
  const ctx = ac()
  const when = ctx.currentTime + 0.02
  for (const item of made) {
    const buffer = audioBuffer(item.out.samples, SongbirdMusic.sampleRate)
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    source.buffer = buffer
    gain.gain.value = Math.min(0.45, item.step.gain ?? 0.3)
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start(when)
    previewSources.push(source)
  }
}

function previewGenrePackage() {
  if (state.transforming || typeof SongbirdPackages === "undefined") return
  state.transforming = true
  state.transformNote = "Building a preview of the ready steps…"
  state.transformTone = ""
  $("save-status").textContent = state.transformNote
  renderInspector()
  void (async () => {
    try {
      const built = await renderGenreTakes()
      if (built.stale) {
        state.transforming = false
        return
      }
      if (built.error) {
        state.transformNote = built.error
        state.transformTone = "warn"
      } else {
        playGenrePreview(built.made)
        state.transformNote = `Preview of ${built.profile.name}: ${built.made.length} ready ${built.made.length === 1 ? "layer" : "layers"}. Nothing was added. Apply puts them on the timeline.`
        state.transformTone = ""
      }
    } catch {
      state.transformNote = "That preview didn't work. Nothing was changed."
      state.transformTone = "warn"
    }
    $("save-status").textContent = state.transformNote
    state.transforming = false
    renderInspector()
  })()
}

function applyGenrePackage() {
  if (state.transforming || typeof SongbirdPackages === "undefined") return
  state.transforming = true
  const profileGuess = SongbirdPackages.get(state.genre)
  state.transformNote = `Building the ready ${profileGuess ? profileGuess.name : "package"} steps…`
  state.transformTone = ""
  $("save-status").textContent = state.transformNote
  renderInspector()
  void (async () => {
    try {
      const built = await renderGenreTakes()
      if (built.stale) {
        state.transforming = false
        return
      }
      const profile = built.profile
      const origin = built.origin
      const made = built.made || []
      if (built.error) {
        state.transformNote = built.error
        state.transformTone = "warn"
        $("save-status").textContent = state.transformNote
      } else {
      stopPreview()
      const colors = { Piano: "#f0a202", Rhodes: "#7ee0c8", "Acoustic guitar": "#ff8ab0", "Electric guitar": "#ff4d8d", Horn: "#F9A8D4", Drums: "#3d7eff", Bass: "#d98a00", Choir: "#b44dff" }
      if (!made.length) {
        state.transformNote = `Couldn't find a melody in ${origin.name}. Nothing was added.`
        state.transformTone = "warn"
      } else {
        snapshot()
        const packageId = profile.id === "hybrid" ? `hybrid:${state.subgenre}:${state.blend}` : profile.id
        state.layers = state.layers.filter((layer) => {
          if (!layer.packageId) return true
          if (layer.packageId === packageId) return false
          if (profile.id === "hybrid" && String(layer.packageId).startsWith("hybrid:")) return false
          return true
        })
        made.forEach((item, index) => {
          const id = uid()
          const step = item.step
          state.layers.push({
            id,
            name: `${profile.name} ${step.role || step.sound}`,
            sound: step.sound,
            figure: step.figure || "",
            touch: step.touch || "",
            pocket: step.pattern || "",
            from: `${profile.name} package · ${step.renders || step.sound}`,
            color: colors[step.sound] || "#7aa2ff",
            peaks: peaksFromSamples(item.out.samples),
            gain: step.gain ?? 0.3,
            pan: step.pan ?? (index % 2 === 0 ? -0.12 : 0.12),
            low: 0,
            high: 0,
            space: step.sound === "Choir" ? 0.2 : 0.04,
            mute: false,
            solo: false,
            live: true,
            sourceId: origin.id,
            packageId,
          })
          buffers.set(id + ":audio", audioBuffer(item.out.samples, SongbirdMusic.sampleRate))
        })
        if (profile.recipe.shape && SHAPES[profile.recipe.shape]) state.shape = profile.recipe.shape
        state.selected = state.layers[state.layers.length - 1].id
        const kept = isVocalLayer(origin) ? "Your singing stays." : "The original layer stays."
        state.transformNote = `${profile.name} added ${made.length} ready ${made.length === 1 ? "layer" : "layers"}. ${kept} Undo removes this package.`
        state.transformTone = ""
        $("save-status").textContent = state.transformNote
        rememberSong()
        try { play() } catch { /* the new layers are still on the timeline */ }
      }
      }
    } catch {
      state.transformNote = "That didn't work. The original layer is unchanged."
      state.transformTone = "warn"
      $("save-status").textContent = state.transformNote
    }
    state.transforming = false
    renderTracks()
    renderInspector()
  })()
}

function spaceImpulse(ctx) {
  if (spaceImpulse.cache && spaceImpulse.cache.sampleRate === ctx.sampleRate) return spaceImpulse.cache
  const length = Math.floor(ctx.sampleRate * 1.1)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.6
  }
  spaceImpulse.cache = buffer
  return buffer
}

// One shared room for the whole song. Every layer sends to it by its own
// amount. Reverb adds up the same way, and a phone runs one room, not one
// per layer.
const spaceBuses = new WeakMap()

function spaceBus(ctx, destination) {
  let byDestination = spaceBuses.get(ctx)
  if (!byDestination) {
    byDestination = new Map()
    spaceBuses.set(ctx, byDestination)
  }
  let verb = byDestination.get(destination)
  if (!verb) {
    verb = ctx.createConvolver()
    verb.buffer = spaceImpulse(ctx)
    verb.connect(destination)
    byDestination.set(destination, verb)
  }
  return verb
}

function refreshMix(layer) {
  const nodes = mixNodes.get(layer.id)
  if (!nodes || !playing) return
  const now = ac().currentTime
  nodes.low.gain.setValueAtTime(layer.low || 0, now)
  nodes.high.gain.setValueAtTime(layer.high || 0, now)
  nodes.pan.pan.setValueAtTime(layer.pan || 0, now)
  const space = Math.max(0, Math.min(1, layer.space || 0))
  nodes.dry.gain.setValueAtTime(1 - space * 0.35, now)
  nodes.wet.gain.setValueAtTime(space * 0.5, now)
  if (nodes.echo) nodes.echo.gain.setValueAtTime(Math.min(0.5, layer.echo || 0), now)
  const span = nodes.span || layer.lengthSec || state.lengthSec || 1
  const elapsed = songSeconds(now)
  const shapeId = layer.shape || state.shape
  if (shapeId && (layer.lengthSec || state.lengthSec)) scheduleShape(nodes.gain, layer.gain, shapeId, now, span, elapsed)
  else nodes.gain.gain.setValueAtTime(layer.gain, now)
  if (nodes.gate) {
    nodes.gate.gain.cancelScheduledValues(now)
    nodes.gate.gain.setValueAtTime(audible(layer) ? 1 : 0, now)
  }
}

function audible(layer) {
  if (!layer || layer.mute) return false
  if (state.layers.some((item) => item.solo)) return !!layer.solo
  return true
}

function hearingMark(layer) {
  const on = audible(layer)
  const soloing = state.layers.some((item) => item.solo)
  if (!on) return { className: "quiet", label: layer.mute ? "Muted" : "Quiet" }
  if (soloing || layer.solo) return { className: "hearing", label: "Solo" }
  return { className: "", label: "" }
}

function scheduleLayer(ctx, layer, buffer, from, span, destination, when) {
  const rangeStart = layer.range ? layer.range.start : 0
  const rangeEnd = layer.range ? Math.min(span, layer.range.end) : span
  if (from >= rangeEnd - 0.02) return null
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const sectionLen = Math.max(0.05, rangeEnd - rangeStart)
  const loop = buffer.duration >= 0.05 && buffer.duration < sectionLen - 0.05
  if (loop) source.loop = true
  const into = Math.max(0, from - rangeStart)
  const offset = !buffer.duration
    ? 0
    : loop
      ? into % buffer.duration
      : Math.min(into, Math.max(0, buffer.duration - 0.03))
  const low = ctx.createBiquadFilter()
  low.type = "lowshelf"
  low.frequency.value = 140
  low.gain.value = layer.low || 0
  const high = ctx.createBiquadFilter()
  high.type = "highshelf"
  high.frequency.value = 4200
  high.gain.value = layer.high || 0
  const gain = ctx.createGain()
  const gate = ctx.createGain()
  gate.gain.value = audible(layer) ? 1 : 0
  const hole = ctx.createGain()
  const pan = ctx.createStereoPanner()
  pan.pan.value = layer.pan || 0
  const dry = ctx.createGain()
  const wet = ctx.createGain()
  const space = Math.max(0, Math.min(1, layer.space || 0))
  dry.gain.value = 1 - space * 0.35
  wet.gain.value = space * 0.5
  const verb = spaceBus(ctx, destination)
  let echoGain = null
  if ((layer.echo || 0) > 0.02) {
    const delay = ctx.createDelay(1.5)
    delay.delayTime.value = layer.room === "large" ? 0.32 : layer.room === "medium" ? 0.2 : 0.13
    const feedback = ctx.createGain()
    feedback.gain.value = Math.min(0.42, (layer.echo || 0) * 0.7)
    echoGain = ctx.createGain()
    echoGain.gain.value = Math.min(0.5, layer.echo)
    pan.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(echoGain)
    echoGain.connect(destination)
  }
  source.connect(low)
  low.connect(high)
  high.connect(gain)
  gain.connect(gate)
  gate.connect(hole)
  hole.connect(pan)
  pan.connect(dry)
  dry.connect(destination)
  pan.connect(wet)
  wet.connect(verb)
  const shapeId = layer.shape || (state.lengthSec ? state.shape : null)
  if (shapeId) scheduleShape(gain, layer.gain ?? 0.8, shapeId, when, layer.lengthSec || span, from)
  else gain.gain.setValueAtTime(layer.gain ?? 0.8, when)
  scheduleHoles(hole, layer.gaps, when, from)
  const begin = when + Math.max(0, rangeStart - from)
  const playFor = Math.max(0.05, rangeEnd - Math.max(from, rangeStart))
  source.start(begin, offset)
  source.stop(begin + playFor)
  return { source, gain, gate, hole, low, high, pan, dry, wet, echo: echoGain, span }
}

function hearLayers() {
  if (!playing) return
  const at = songSeconds(ac().currentTime)
  const missing = state.layers.some((layer) => audible(layer) && buffers.get(layer.id + ":audio") && !mixNodes.get(layer.id))
  if (missing) {
    play(at)
    return
  }
  const now = ac().currentTime
  for (const layer of state.layers) {
    const nodes = mixNodes.get(layer.id)
    if (!nodes?.gate) continue
    nodes.gate.gain.cancelScheduledValues(now)
    nodes.gate.gain.setValueAtTime(audible(layer) ? 1 : 0, now)
  }
}

function play(fromSec, options = {}) {
  const ctx = ac()
  const keepClick = !!(options.keepClick || state.recording)
  const spanGuess = state.lengthSec || state.span || 40
  let from = typeof fromSec === "number" ? fromSec : state.playAt || 0
  if (from >= spanGuess - 0.05) from = 0
  const candidates = state.layers.filter((layer) => audible(layer) && buffers.get(layer.id + ":audio"))
  if (!candidates.length) {
    stopPlayback(keepClick)
    const anyAudio = state.layers.some((layer) => buffers.get(layer.id + ":audio"))
    $("save-status").textContent = state.buildingExample
      ? "Still building this example. It plays in a moment."
      : state.openingSound
      ? "Opening the saved sound…"
      : anyAudio
        ? "Mute or solo is hiding every layer. Turn a layer on to hear it."
        : state.missingSound
          ? (state.song?.audioKept
            ? "The sound didn't open from this device. Try Play again in a moment."
            : "This song is in the list, but the sound was not kept. Record the layer again to hear it.")
          : "Nothing recorded to play yet. The colored layout is a picture of the song."
    return
  }
  stopPlayback(keepClick)
  playing = true
  playFrom = from
  state.playAt = from
  playStarted = ctx.currentTime
  const playButton = $("play-btn")
  if (playButton) {
    playButton.classList.add("is-on")
    playButton.setAttribute("aria-label", "Stop")
    const playIcon = playButton.querySelector(".glyph")
    if (playIcon) playIcon.textContent = "■"
  }
  beginSky(state.recording ? "record" : "play")
  const span = spanSeconds()
  let started = 0
  let ended = 0
  for (const layer of candidates) {
    const buffer = buffers.get(layer.id + ":audio")
    const nodes = scheduleLayer(ctx, layer, buffer, from, span, ctx.destination, ctx.currentTime)
    if (!nodes) continue
    const watch = ctx.createAnalyser()
    watch.fftSize = 64
    watch.smoothingTimeConstant = 0.78
    nodes.pan.connect(watch)
    nodes.watch = watch
    nodes.bins = new Uint8Array(watch.frequencyBinCount)
    mixNodes.set(layer.id, nodes)
    activeSources.push(nodes.source)
    started += 1
    nodes.source.onended = () => {
      ended += 1
      if (playing && ended >= started) stopPlayback(state.recording)
    }
  }
  if (!started) {
    stopPlayback(keepClick)
    $("save-status").textContent = "The play line is past the sound in this part. Move it back, or pick Whole song."
    return
  }
  const tick = () => {
    if (!playing) return
    const elapsed = songSeconds(ctx.currentTime)
    if (elapsed >= span) {
      const stillRecording = state.recording
      if (state.looper && !stillRecording && state.loopSec) {
        play(0)
        return
      }
      stopPlayback(stillRecording)
      placePlayhead(stillRecording ? span : 0)
      if (stillRecording) $("save-status").textContent = "The song ended. The mic is still recording."
      return
    }
    placePlayhead(elapsed, true)
    const timeline = $("timeline")
    const x = state.headX || 0
    if (timeline) {
      if (!view.width) view.width = timeline.clientWidth
      const left = timeline.scrollLeft
      sky.beamX = x - left
      if (x > left + view.width * 0.72) timeline.scrollLeft = x - view.width * 0.35
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}

function encodeWav(audio) {
  const channels = audio.numberOfChannels
  const rate = audio.sampleRate
  const length = audio.length
  const bytes = new ArrayBuffer(44 + length * channels * 2)
  const view = new DataView(bytes)
  const write = (offset, text) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }
  write(0, "RIFF")
  view.setUint32(4, 36 + length * channels * 2, true)
  write(8, "WAVE")
  write(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * channels * 2, true)
  view.setUint16(32, channels * 2, true)
  view.setUint16(34, 16, true)
  write(36, "data")
  view.setUint32(40, length * channels * 2, true)
  const data = []
  for (let channel = 0; channel < channels; channel++) data.push(audio.getChannelData(channel))
  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < channels; channel++) {
      const sample = Math.max(-1, Math.min(1, data[channel][i] || 0))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }
  return bytes
}

async function downloadMix() {
  const live = state.layers.filter((layer) => audible(layer) && buffers.get(layer.id + ":audio"))
  const note = $("finish-note")
  if (!live.length) {
    const message = state.layers.some((layer) => buffers.get(layer.id + ":audio"))
      ? "Mute or solo is hiding every layer. Turn a layer on, then master the song."
      : "Open a song and press play once so the audio is loaded, then master it."
    $("save-status").textContent = message
    if (note) note.textContent = message
    return
  }
  const span = spanSeconds()
  const rate = ac().sampleRate
  $("save-status").textContent = "Making the song file…"
  if (note) note.textContent = "Making the song file…"
  const offline = new OfflineAudioContext(2, Math.max(1, Math.ceil(span * rate)), rate)
  for (const layer of live) scheduleLayer(offline, layer, buffers.get(layer.id + ":audio"), 0, span, offline.destination, 0)
  const rendered = await offline.startRendering()
  const wav = encodeWav(rendered)
  const name = (state.song?.title || "Songbird").replace(/[^\w\s-]+/g, "").trim() || "Songbird"
  const url = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }))
  const link = document.createElement("a")
  link.href = url
  link.download = `${name}.wav`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  const message = `${name}.wav is downloading. It matches mute, solo, and the mix. Nothing is uploaded.`
  $("save-status").textContent = message
  if (note) note.textContent = message
}

function stopPlayback(keepClick) {
  playing = false
  stopPreview()
  cancelAnimationFrame(raf)
  if (!keepClick) stopClick()
  for (const source of activeSources) {
    try { source.stop() } catch { /* already stopped */ }
  }
  for (const nodes of mixNodes.values()) {
    try { nodes.dry?.disconnect() } catch { /* already stopped */ }
    try { nodes.wet?.disconnect() } catch { /* already stopped */ }
    try { nodes.echo?.disconnect() } catch { /* already stopped */ }
    try { nodes.watch?.disconnect() } catch { /* already stopped */ }
  }
  activeSources = []
  mixNodes.clear()
  if (!keepClick) endSky()
  const playButton = $("play-btn")
  if (playButton) {
    playButton.classList.remove("is-on")
    playButton.setAttribute("aria-label", "Play")
    const playIcon = playButton.querySelector(".glyph")
    if (playIcon) playIcon.textContent = "▶"
  }
}

function fromControl(event) {
  const path = typeof event.composedPath === "function" ? event.composedPath() : [event.target]
  return path.find((item) => item?.dataset?.action || item?.id === "search" || item?.id === "song-title" || item?.id === "song-author" || item?.id === "wish" || item?.id === "magic-wish" || item?.id === "bpm" || item?.classList?.contains?.("layer-name") || item?.classList?.contains?.("share-email")) || event.target
}

document.body.addEventListener("change", (event) => {
  const node = event.target
  if (node?.id === "genre-pack") {
    state.genreTouched = true
    state.genre = node.value
    const genre = SongbirdPackages.get(state.genre)
    state.subgenre = genre?.id === "hybrid" ? "rnb" : (genre?.subgenres[0]?.id || "")
    renderInspector()
  }
  if (node?.id === "genre-sub") {
    state.genreTouched = true
    state.subgenre = node.value
    if (state.genre === "hybrid" && state.blend === state.subgenre) {
      const other = SongbirdPackages.listGenres().find((genre) => genre.id !== "hybrid" && genre.id !== state.subgenre)
      if (other) state.blend = other.id
    }
    renderInspector()
  }
  if (node?.id === "genre-blend") {
    state.blend = node.value
    renderInspector()
  }
})

document.body.addEventListener("click", (event) => {
  const node = fromControl(event)
  if (!node?.dataset?.action) return
  const action = node.dataset.action
  if (action === "show-library") {
    setScreen("library")
    closePanel()
    renderSongs()
  }
  if (action === "new-song") newSong()
  if (action === "open-song") openSong(node.dataset.id)
  if (action === "share-song") {
    state.shareFor = node.dataset.id
    state.deleteFor = null
    renderSongs()
    renderProjectActions()
  }
  if (action === "ask-delete") {
    state.deleteFor = node.dataset.id
    state.shareFor = null
    renderSongs()
    renderProjectActions()
  }
  if (action === "cancel-song") {
    state.shareFor = null
    state.deleteFor = null
    renderSongs()
    renderProjectActions()
  }
  if (action === "confirm-delete") deleteSong(node.dataset.id)
  if (action === "add-share") {
    const field = node.parentElement?.querySelector(".share-email")
    shareSong(node.dataset.id, field ? field.value : "")
  }
  if (action === "play") playing ? stopPlayback() : play()
  if (action === "jump") jumpSection(Number(node.dataset.jump) < 0 ? -1 : 1)
  if (action === "record-mode") {
    if (state.recording || state.counting) return
    state.recordMode = node.dataset.mode === "vibe" ? "vibe" : "mic"
    renderInspector()
  }
  if (action === "pick-vibe") {
    state.vibe = ["snaps", "guitar", "piano"].includes(node.dataset.vibe) ? node.dataset.vibe : "claps"
    renderInspector()
  }
  if (action === "pick-key") {
    const pc = Number(node.dataset.key)
    state.keyPc = Number.isFinite(pc) ? ((pc % 12) + 12) % 12 : 0
    previewKey(state.keyPc)
    renderInspector()
    $("save-status").textContent = `Key of ${KEY_NAMES[state.keyPc]}.`
  }
  if (action === "vibe-tempo") {
    const bpm = Number(node.dataset.bpm)
    if (bpm) useTempo(bpm, "this starter", true)
    renderInspector()
  }
  if (action === "add-starter") addStarter()
  if (action === "toggle-phones") {
    if (state.recording || state.counting) return
    state.headphones = !state.headphones
    state.headphonesSet = true
    renderInspector()
    $("save-status").textContent = state.headphones
      ? "Headphones on. You'll hear the click while you record."
      : "No headphones. The click stays silent while you record. Watch the beat lights."
  }
  if (action === "toggle-looper") {
    if (state.recording || state.counting) return
    state.looper = !state.looper
    syncLoopChip()
    renderRuler()
    renderTracks()
    renderInspector()
    $("save-status").textContent = state.looper
      ? "Loop pedal is on. Record a few bars and they loop right away. The song repeats when it plays."
      : "Loop pedal is off. Takes wait for Keep, and the song plays once."
  }
  if (action === "loop-bars") {
    const bars = Number(node.dataset.bars)
    state.loopBars = [0, 2, 4, 8].includes(bars) ? bars : 4
    if (!songHasSound()) state.loopSec = null
    renderInspector()
  }
  if (action === "new-loop") {
    state.loopSec = null
    rememberSong()
    renderInspector()
    $("save-status").textContent = "The next take sets a new loop length. The layers you have stay."
  }
  if (action === "magic-again") applyMagic()
  if (action === "enhance") applyEnhance(node.dataset.mode || "clear")
  if (action === "revert-original") revertToOriginal()
  if (action === "tempo-pass") {
    if (!state.recording) state.tempoPass = true
    void toggleRecord()
  }
  if (action === "record" || action === "toggle-record") {
    if (!state.recording) state.tempoPass = false
    void toggleRecord()
  }
  if (action === "panel") setPanel(node.dataset.panel)
  if (action === "zoom") {
    const level = Number(node.dataset.zoom)
    state.zoom = level === 1.5 || level === 2 ? level : 1
    renderRuler()
    renderTracks()
  }
  if (action === "close-panel") closePanel()
  if (action === "undo" && undoStack.length) {
    const back = undoStack.pop()
    const ids = back && typeof back === "object" && back.audio ? Object.keys(back.audio) : []
    const audio = {}
    for (const id of ids) {
      const buf = buffers.get(id + ":audio")
      if (buf) audio[id] = buf
    }
    redoStack.push({ raw: capture(), audio })
    restore(back)
    rememberSong()
  }
  if (action === "redo" && redoStack.length) {
    const forward = redoStack.pop()
    const ids = forward && typeof forward === "object" && forward.audio ? Object.keys(forward.audio) : []
    const audio = {}
    for (const id of ids) {
      const buf = buffers.get(id + ":audio")
      if (buf) audio[id] = buf
    }
    undoStack.push({ raw: capture(), audio })
    restore(forward)
    rememberSong()
  }
  if (action === "toggle-click") {
    state.click = !state.click
    if (!state.click) stopClick()
    else if (state.recording) startClick()
    const clickButton = $("click-btn")
    if (clickButton) {
      clickButton.classList.toggle("on", state.click)
      clickButton.setAttribute("aria-pressed", state.click ? "true" : "false")
      clickButton.textContent = state.click ? "Click" : "Muted"
    }
  }
  if (action === "pick-section") {
    const section = songSections().find((item) => item.id === node.dataset.id)
    if (section) {
      const same = state.section === section.id
      state.section = same ? null : section.id
      if (!same) placePlayhead(section.start * spanSeconds())
      if (playing) play(state.playAt)
      renderRuler()
      renderInspector()
      $("save-status").textContent = sectionWorkLine()
    }
  }
  if (action === "add-section") addSection()
  if (action === "remove-section") removeSection(node.dataset.id)
  if (action === "section-mode") {
    state.sectionMode = node.dataset.mode === "replace" ? "replace" : "add"
    renderRuler()
    renderInspector()
    $("save-status").textContent = sectionWorkLine()
  }
  if (action === "fill-section") fillLayerWithSection()
  if (action === "whole-song") {
    state.section = null
    renderRuler()
    renderInspector()
    $("save-status").textContent = "The whole song is selected. New layers cover all of it."
  }
  if (action === "select-layer") {
    state.selected = node.dataset.id
    syncPlaying(state.layers.find((item) => item.id === state.selected))
    if (state.panel !== "transform" && state.panel !== "build" && state.panel !== "record") {
      state.panel = "mix"
      showInspector()
    }
    renderTracks()
    renderRuler()
    if (state.panel === "mix" && !window.matchMedia("(min-width: 1100px)").matches) setPanel("mix")
    else renderInspector()
  }
  if (action === "pick-transform-layer") {
    state.selected = node.dataset.id
    syncPlaying(state.layers.find((item) => item.id === state.selected))
    state.panel = "transform"
    renderTracks()
    renderInspector()
  }
  if (action === "toggle-rec-more") {
    state.recMore = !state.recMore
    renderInspector()
  }
  if (action === "rec-mode") {
    state.mode = node.dataset.mode
    renderInspector()
  }
  if (action === "pick-input") {
    state.input = node.dataset.input
    renderInspector()
  }
  if (action === "monitor") {
    state.monitor = node.dataset.monitor
    if (sky.monitor) {
      try { sky.monitor.disconnect() } catch { /* already released */ }
      sky.monitor = null
    }
    const hear = state.monitor === "original" || state.monitor === "both"
    if (state.recording && hear && sky.micSource) {
      const monitor = ac().createGain()
      monitor.gain.value = 0.35
      sky.micSource.connect(monitor)
      monitor.connect(ac().destination)
      sky.monitor = monitor
    }
    $("save-status").textContent = state.monitor === "transformed"
      ? "Hearing a transformed voice while you sing is not live yet. The microphone is quiet in the speakers."
      : hear
        ? "You can hear yourself. Headphones keep that out of the take."
        : "The microphone is quiet in the speakers."
    renderInspector()
  }
  if (action === "keep-take") void keepTake()
  if (action === "next-transform") {
    setPanel("transform")
    $("save-status").textContent = "Transform this layer. Mix, after this, is for every layer."
  }
  if (action === "next-mix") {
    setPanel("mix")
    $("save-status").textContent = "Mix is for every layer."
  }
  if (action === "fix-timing") fixTiming()
  if (action === "revert-timing") revertTiming()
  if (action === "discard-take") {
    pendingBlob = null
    recordedSeconds = 0
    recordOrigin = 0
    renderRuler()
    renderTracks()
    renderInspector()
  }
  if (action === "read-wish") {
    const box = $("wish")
    if (box) state.wish = box.value
    useWish()
  }
  if (action === "apply-length") {
    const seconds = Number(node.dataset.seconds)
    const hadShape = !!state.shape
    applyPlan(seconds, hadShape ? state.shape : null, lengthNote(clampLength(seconds), hadShape))
  }
  if (action === "apply-length-custom") {
    const minutes = Number($("len-min")?.value)
    const seconds = Number($("len-sec")?.value)
    const total = (Number.isFinite(minutes) ? minutes : 0) * 60 + (Number.isFinite(seconds) ? seconds : 0)
    if (total <= 0) {
      state.heard = "Enter a length, or pick one of the times above."
      renderInspector()
      $("save-status").textContent = state.heard
    } else {
      const hadShape = !!state.shape
      const limit = total > 480 ? "8:00 is the longest song here." : total < 15 ? "The shortest song here is 0:15." : ""
      const clamped = clampLength(total)
      applyPlan(clamped, hadShape ? state.shape : null, lengthNote(clamped, hadShape, limit))
    }
  }
  if (action === "pick-intent") {
    state.intent = node.dataset.intent
    const intent = INTENTS.find((item) => item.id === state.intent)
    if (intent?.shapes.length === 1) {
      const layer = selectedLayer()
      const assumed = !layer?.lengthSec && !state.lengthSec
      const length = layer?.lengthSec || state.lengthSec || 60
      const intro = assumed ? "I used 1:00. " : ""
      applyPlan(length, intent.shapes[0], `${intro}${planMessage(length, intent.shapes[0])}`)
    } else {
      state.heard = state.intent === "climax"
        ? "Here are common ways to build. Pick one, and the song will follow it."
        : "Here are two ways to soften the intro and the ending. Pick one."
      renderInspector()
      $("save-status").textContent = state.heard
    }
  }
  if (action === "apply-shape") {
    const layer = selectedLayer()
    const assumed = !layer?.lengthSec && !state.lengthSec
    const length = layer?.lengthSec || state.lengthSec || 60
    const intro = assumed ? "I used 1:00. " : ""
    applyPlan(length, node.dataset.shape, `${intro}${planMessage(length, node.dataset.shape)}`)
  }
  if (action === "add-and-record") {
    state.input = node.dataset.input
    setPanel("record")
  }
  if (action === "use-transform") commitTransform()
  if (action === "pick-role") {
    state.role = node.dataset.role === "instrument" ? "instrument" : "vocals"
    if (state.role === "instrument" && state.pitch === "none") state.pitch = "correct"
    commitTransform()
  }
  if (action === "pick-vocal") {
    state.role = "vocals"
    state.vocalType = node.dataset.vocal === "background" ? "background" : node.dataset.vocal === "choir" ? "choir" : "solo"
    commitTransform()
  }
  if (action === "pick-pitch") {
    state.pitch = node.dataset.pitch === "autotune" ? "autotune" : node.dataset.pitch === "correct" ? "correct" : "none"
    commitTransform()
  }
  if (action === "pick-mic") {
    state.mic = node.dataset.mic === "room" ? "room" : node.dataset.mic === "bright" ? "bright" : "close"
    effectOnly()
  }
  if (action === "pick-reverb") {
    state.reverb = !state.reverb
    effectOnly()
  }
  if (action === "pick-echo") {
    state.echo = !state.echo
    effectOnly()
  }
  if (action === "pick-room") {
    state.room = node.dataset.room === "large" ? "large" : node.dataset.room === "medium" ? "medium" : "small"
    effectOnly()
  }
  if (action === "pick-era") {
    const period = PERIODS.find((item) => item.id === node.dataset.era)
    if (period) state.era = period.id
    commitTransform()
  }
  if (action === "pick-figure") {
    state.role = "instrument"
    state.figure = node.dataset.figure === "chords" ? "chords" : "solo"
    if (state.figure === "solo" && state.touch === "strum") state.touch = "hold"
    if (state.pitch === "none") state.pitch = "correct"
    commitTransform()
  }
  if (action === "pick-touch") {
    state.role = "instrument"
    state.touch = node.dataset.touch === "beat" ? "beat" : node.dataset.touch === "strum" ? "strum" : "hold"
    if (state.pitch === "none") state.pitch = "correct"
    commitTransform()
  }
  if (action === "pick-pocket") {
    state.role = "instrument"
    state.instrument = "Drums"
    state.pocket = node.dataset.pocket === "boom" ? "boom" : node.dataset.pocket === "backbeat" ? "backbeat" : "played"
    if (state.pitch === "none") state.pitch = "correct"
    commitTransform()
  }
  if (action === "transform-as") {
    if (node.dataset.era) state.era = node.dataset.era
    if (node.dataset.figure) state.figure = node.dataset.figure
    if (node.dataset.touch) state.touch = node.dataset.touch
    addTransformedLayer(node.dataset.sound, { pattern: node.dataset.pattern || "" })
  }
  if (action === "apply-sound") {
    state.role = "instrument"
    state.instrument = node.dataset.sound || "Piano"
    if (state.pitch === "none") state.pitch = "correct"
    commitTransform()
  }
  if (action === "preview-genre") previewGenrePackage()
  if (action === "apply-genre") applyGenrePackage()
  if (action === "apply-mix") applyMix(node.dataset.preset)
  if (action === "toggle-fine") {
    state.fine = !state.fine
    renderInspector()
  }
  if (action === "toggle-mute" || action === "toggle-solo") {
    if (node.dataset.id) state.selected = node.dataset.id
    const layer = state.layers.find((item) => item.id === node.dataset.id) || selectedLayer()
    if (!layer) return
    snapshot()
    if (action === "toggle-mute") layer.mute = !layer.mute
    else layer.solo = !layer.solo
    rememberSong()
    renderTracks()
    renderInspector()
    hearLayers()
    const others = state.layers.filter((item) => item.solo)
    const what = layer.mute ? `${layer.name} is muted.` : layer.solo ? `${layer.name} is solo. The other layers are quiet.` : others.length ? `${layer.name} is back, and solo still hides the rest.` : `${layer.name} is back in the song.`
    $("save-status").textContent = what
  }
  if (action === "reset-pan") {
    const layer = selectedLayer()
    if (!layer) return
    snapshot()
    layer.pan = 0
    rememberSong()
    refreshMix(layer)
    renderInspector()
  }
  if (action === "delete-layer") {
    const layer = state.layers.find((item) => item.id === node.dataset.id) || selectedLayer()
    if (!layer) return
    snapshot()
    state.layers = state.layers.filter((item) => item.id !== layer.id)
    if (!state.layers.some((item) => item.id === state.selected)) state.selected = state.layers[0]?.id ?? null
    rememberSong()
    renderTracks()
    renderInspector()
    $("save-status").textContent = `${layer.name} was removed. Undo puts it back.`
    if (playing) {
      if (state.layers.length) play(state.playAt || 0)
      else stopPlayback()
    }
  }
  if (action === "download-mix") void downloadMix()
  if (action === "video-note") {
    const note = $("finish-note")
    if (note) note.textContent = "Video creation is not connected in this prototype."
  }
})

document.body.addEventListener("keydown", (event) => {
  const node = fromControl(event)
  if (event.key === "Enter" && node.classList?.contains("layer-name")) {
    event.preventDefault()
    node.blur()
    return
  }
  if (event.key !== "Enter" || !node.classList?.contains("share-email")) return
  event.preventDefault()
  shareSong(node.dataset.id, node.value)
})

document.body.addEventListener("focusin", (event) => {
  const node = fromControl(event)
  if (!node.classList?.contains("layer-name")) return
  state.selected = node.dataset.rename
  node.dataset.previous = node.value
  document.querySelectorAll(".track").forEach((track) => track.classList.toggle("selected", track.dataset.id === node.dataset.rename))
})

document.body.addEventListener("input", (event) => {
  const node = fromControl(event)
  if (node.id === "search") {
    state.query = node.value
    renderSongs()
  }
  if (node.id === "song-title" || node.id === "song-author") {
    rememberSong()
    showSongCredit()
  }
  if (node.classList?.contains("layer-name")) {
    if (node.dataset.snapped !== "1" && node.value.trim() !== node.dataset.previous) {
      snapshot()
      node.dataset.snapped = "1"
    }
    nameLayer(node.dataset.rename, node.value, false)
  }
  if (node.classList?.contains("section-name")) {
    if (node.dataset.snapped !== "1") {
      snapshot()
      node.dataset.snapped = "1"
    }
    nameSection(node.dataset.section, node.value, false)
  }
  if (node.id === "wish") state.wish = node.value
  if (node.id === "magic-wish") state.magicWish = node.value
  if (node.id === "timing-slack") {
    state.timingSlack = Math.min(0.4, Math.max(0.08, Number(node.value) || 0.18))
    const mark = node.parentElement?.querySelector("[data-timing-readout]")
    if (mark) mark.textContent = timingSlackLabel(state.timingSlack)
  }
  if (node.id === "enhance-amount") {
    state.enhanceAmount = Math.min(1, Math.max(0.25, Number(node.value) || 0.65))
    const mark = node.parentElement?.querySelector("[data-enhance-readout]")
    if (mark) mark.textContent = enhanceLabel(state.enhanceAmount)
  }
  if (node.id === "bpm") {
    state.bpm = Math.min(200, Math.max(40, Number(node.value) || 92))
    state.tempoLocked = true
    state.tempoSource = "you"
    rememberSong()
  }
  const mixKey = { "set-gain": "gain", "set-pan": "pan", "set-low": "low", "set-high": "high", "set-space": "space" }[node.dataset.action]
  if (mixKey) {
    if (node.dataset.id) state.selected = node.dataset.id
    const layer = state.layers.find((item) => item.id === node.dataset.id) || selectedLayer()
    if (!layer) return
    layer[mixKey] = Number(node.value)
    if (node.nextElementSibling) node.nextElementSibling.textContent = mixReadout(mixKey, layer[mixKey])
    refreshMix(layer)
    rememberSong()
  }
})

document.body.addEventListener("focusout", (event) => {
  const node = fromControl(event)
  if (node.classList?.contains("layer-name")) {
    nameLayer(node.dataset.rename, node.value, true)
    node.dataset.snapped = ""
  }
  if (node.classList?.contains("section-name")) {
    nameSection(node.dataset.section, node.value, true)
    node.dataset.snapped = ""
  }
})

document.body.addEventListener("pointerdown", (event) => {
  if (event.target.closest("[data-mix]")) snapshot()
})

$("timeline").addEventListener("wheel", (event) => {
  const timeline = $("timeline")
  const mostlyVertical = Math.abs(event.deltaY) > Math.abs(event.deltaX)
  const canScrollDown = timeline.scrollHeight > timeline.clientHeight + 4
  if (!mostlyVertical) return
  if (event.shiftKey || !canScrollDown) {
    timeline.scrollLeft += event.deltaY
    event.preventDefault()
  }
}, { passive: false })

$("timeline").addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return
  if (event.target.closest("button, a, input, textarea, label")) return
  const wasPlaying = playing
  if (wasPlaying) stopPlayback()
  const move = (ev) => placePlayhead(timeAt(ev.clientX))
  const up = () => {
    window.removeEventListener("pointermove", move)
    window.removeEventListener("pointerup", up)
    if (wasPlaying) play()
  }
  event.preventDefault()
  $("timeline").focus()
  move(event)
  window.addEventListener("pointermove", move)
  window.addEventListener("pointerup", up)
})

$("timeline").addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
  event.preventDefault()
  const step = event.shiftKey ? 5 : 1
  const wasPlaying = playing
  if (wasPlaying) stopPlayback()
  placePlayhead((state.playAt || 0) + (event.key === "ArrowRight" ? step : -step))
  if (wasPlaying) play()
})

renderSongs()
renderProjectActions()
renderRuler()
renderTracks()
renderInspector()
if (window.matchMedia("(min-width: 1100px)").matches) document.body.classList.add("sheet-open")
syncDock()
sky.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
seedStars()
paintSky(0, 0)
if (window.ResizeObserver) {
  const stage = document.querySelector(".stage")
  if (stage) {
    new ResizeObserver(() => {
      measureView()
      if (!sky.raf) paintSky(performance.now(), sky.level)
    }).observe(stage)
  }
}
