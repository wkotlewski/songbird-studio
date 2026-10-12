const STARTERS = [
  { id: "grandpa", title: "Grandpa's Sunday Song", privacy: "Shared", demo: true },
  { id: "family", title: "Our Family Song", privacy: "Shared", demo: true },
  { id: "summer", title: "Summer Memories", privacy: "Shared", demo: true },
  { id: "ella", title: "Ella's Happy Song", privacy: "Shared", demo: true },
  { id: "bright", title: "A Brighter Day", privacy: "Shared", demo: true },
]

const INPUTS = [
  ["hum", "Hum or sing"],
  ["clap", "Clap or tap"],
  ["beat", "Beatbox"],
  ["instrument", "Instrument"],
]

const ERAS = [
  { id: "old", name: "Old school", line: "Warmer, softer, more room." },
  { id: "modern", name: "Modern", line: "Closer, brighter, tighter." },
]

const PACKAGES = [
  { id: "Piano", name: "Acoustic piano", line: "Piano under the tune." },
  { id: "Rhodes", name: "Rhodes", line: "Electric piano keys." },
  { id: "Acoustic guitar", name: "Acoustic guitar", line: "A guitar under the tune." },
  { id: "Electric guitar", name: "Electric guitar", line: "Amp guitar under the tune." },
  { id: "Drums", name: "Drums", line: "A kit from the claps." },
  { id: "Bass", name: "Bass", line: "Low notes that hold." },
  { id: "Choir", name: "Choir", line: "Voices around the melody." },
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
let playing = false
let playStarted = 0
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
  era: "old",
  songs: loadSongs(),
  song: null,
  layers: [],
  selected: null,
  panel: "mix",
  input: "hum",
  mode: "first",
  monitor: "original",
  recording: false,
  bpm: 92,
  click: true,
  countIn: true,
  tempoSource: "",
  tempoLocked: false,
  tempoPass: false,
  arming: false,
  mix: null,
  fine: false,
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
  const mine = state.songs.filter((song) => !song.demo).map((song) => ({ ...song, privacy: "Shared", sharedWith: songEmails(song) }))
  localStorage.setItem("songbird-songs", JSON.stringify(mine))
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

function wave(peaks, color, id) {
  const mark = id ? ` data-layer="${id}"` : ""
  return `<div class="wave"${mark} style="background:${color}33;--wave:${color}">${peaks
    .map((peak) => `<i style="height:${Math.max(8, peak * 46)}px;background:${color}"></i>`)
    .join("")}</div>`
}

function ac() {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === "suspended") void audioCtx.resume()
  return audioCtx
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

function fitSky() {
  const canvas = $("sky")
  const stage = canvas?.parentElement || document.querySelector(".stage")
  if (!canvas || !stage) return null
  const width = Math.max(320, stage.clientWidth || 0)
  const height = Math.max(180, stage.clientHeight || 0)
  const dpr = Math.min(2, window.devicePixelRatio || 1)
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
    const waveEl = document.querySelector(`.wave[data-layer="${nodes.id}"]`)
    if (waveEl) waveEl.style.setProperty("--pulse", layerEnergy.toFixed(3))
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
  if (!state.recording || !sky.micBins) return
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
    bars[i].style.height = `${Math.round(6 + (peak / 255) * 30)}px`
  }
}

function paintSky(now, level) {
  const fitted = fitSky()
  if (!fitted) return
  const { ctx, width, height } = fitted
  const awake = !!document.body.dataset.sound
  ctx.clearRect(0, 0, width, height)
  const wash = ctx.createLinearGradient(0, 0, width, height)
  wash.addColorStop(0, "rgba(7, 28, 23, 0.08)")
  wash.addColorStop(0.55, "rgba(16, 53, 44, 0.05)")
  wash.addColorStop(1, "rgba(7, 28, 23, 0.16)")
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, width, height)
  for (let i = 0; i < CLOUDS.length; i++) {
    const cloud = CLOUDS[i]
    const drift = sky.reduced ? 0 : Math.sin(now / 4200 + i) * 0.035
    const cx = (cloud.x + drift) * width
    const cy = (cloud.y + Math.cos(now / 5100 + i) * (sky.reduced ? 0 : 0.02)) * height
    const radius = Math.max(width, height) * (0.22 + level * 0.18)
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    const alpha = (awake ? 0.05 + level * 0.22 : 0.035).toFixed(3)
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
    const head = $("playhead")
    const stage = document.querySelector(".stage")
    if (head && stage) {
      const headBox = head.getBoundingClientRect()
      const stageBox = stage.getBoundingClientRect()
      const x = headBox.left - stageBox.left + headBox.width / 2
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

function drawSky(now) {
  const energy = readEnergy()
  sky.level += (energy - sky.level) * (sky.reduced ? 1 : 0.22)
  document.documentElement.style.setProperty("--pulse", sky.level.toFixed(3))
  paintSky(now, sky.level)
  paintMeter()
  const awake = !!document.body.dataset.sound
  if (!awake && sky.level < 0.02 && !sky.motes.length) {
    sky.raf = 0
    document.documentElement.style.setProperty("--pulse", "0")
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

function attachMic(stream) {
  releaseMic()
  const ctx = ac()
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  analyser.smoothingTimeConstant = 0.72
  source.connect(analyser)
  sky.micSource = source
  sky.micAnalyser = analyser
  sky.micBins = new Uint8Array(analyser.frequencyBinCount)
}

function releaseMic() {
  try { sky.micSource?.disconnect() } catch { /* already released */ }
  sky.micSource = null
  sky.micAnalyser = null
  sky.micBins = null
}

function snapshot() {
  undoStack.push(JSON.stringify({ layers: state.layers, lengthSec: state.lengthSec, shape: state.shape, intent: state.intent }))
  if (undoStack.length > 30) undoStack.shift()
  redoStack = []
}

function restore(raw) {
  const data = JSON.parse(raw)
  if (Array.isArray(data)) {
    state.layers = data
  } else {
    state.layers = data.layers
    state.lengthSec = data.lengthSec
    state.shape = data.shape
    state.intent = data.intent
  }
  if (!state.layers.some((layer) => layer.id === state.selected)) state.selected = state.layers[0]?.id ?? null
  renderPlanNote()
  renderRuler()
  renderTracks()
  renderInspector()
}

function setScreen(screen) {
  state.screen = screen
  document.body.dataset.screen = screen
}

function showInspector() {
  document.body.classList.remove("inspector-closed")
  document.body.classList.add("sheet-open")
}

function setPanel(panel) {
  state.panel = panel
  showInspector()
  renderInspector()
}

function closePanel() {
  document.body.classList.remove("sheet-open")
  document.body.classList.add("inspector-closed")
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
        <button class="primary" data-action="confirm-delete" data-id="${song.id}">Delete</button>
        <button class="choice" data-action="cancel-song">Keep it</button>
      </div>
    </div>`
  }
  if (state.shareFor !== song.id) return ""
  const emails = songEmails(song)
  return `<div class="share-box">
    <p class="hint">Add their email. It is saved on this song in this browser. Songbird does not send mail yet.</p>
    ${emails.length ? `<p class="hint">${emails.map((email) => esc(email)).join(", ")}</p>` : ""}
    <div class="share-row">
      <input class="share-email" type="email" data-id="${song.id}" placeholder="name@email.com" aria-label="Email address" />
      <button class="primary" data-action="add-share" data-id="${song.id}">Share</button>
    </div>
  </div>`
}

function renderSongs() {
  const q = state.query.trim().toLowerCase()
  const list = $("song-list")
  const songs = state.songs.filter((song) => song.title.toLowerCase().includes(q))
  if (!songs.length) {
    list.innerHTML = `<p class="empty">Make your first sound.</p>`
    return
  }
  list.innerHTML = songs
    .map(
      (song) => `<article class="song">
        <button class="song-open" data-action="open-song" data-id="${song.id}">
          <span class="swatch" style="background:linear-gradient(135deg,#1fbfa7,#3d7eff)"></span>
          <span class="song-copy"><b>${esc(song.title)}</b><span class="meta">${esc(shareDetail(song))}</span></span>
          <span class="badge">Shared</span>
        </button>
        <div class="song-actions">
          <button class="choice" data-action="share-song" data-id="${song.id}">Share</button>
          <button class="choice" data-action="ask-delete" data-id="${song.id}">Delete</button>
        </div>
        ${renderShareBox(song)}
      </article>`,
    )
    .join("")
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
      <button class="choice" data-action="share-song" data-id="${song.id}">Share</button>
      <button class="choice" data-action="ask-delete" data-id="${song.id}">Delete</button>
    </div>
    ${renderShareBox(song)}`
}

function shareSong(id, raw) {
  const song = state.songs.find((item) => item.id === id)
  if (!song) return
  const email = String(raw || "").trim().toLowerCase()
  if (!validEmail(email)) {
    state.shareFor = id
    $("save-status").textContent = "Enter an email address like name@email.com."
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
  state.deleteFor = null
  $("save-status").textContent = `Shared with ${email}. The address is saved on this song in this browser.`
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
  if (!song.demo) saveSongs()
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
    renderTracks()
    renderInspector()
  }
  $("save-status").textContent = `${song.title} was deleted.`
  renderSongs()
  renderProjectActions()
}

function layoutTimeline() {
  const total = state.lengthSec || 40
  const width = Math.max(980, Math.round(total * 8) + 180)
  state.span = total
  state.trackWidth = width
  const inner = document.querySelector(".timeline-inner")
  if (inner) inner.style.width = `${width}px`
  return { total, width }
}

function renderPlanNote() {
  const note = document.querySelector(".note")
  if (!note) return
  if (state.song?.demo && state.heard) {
    note.textContent = state.heard
    return
  }
  if (!state.lengthSec) {
    note.textContent = "Open Build to set a length and a shape. Recordings loop to that length. A transform keeps the original and adds a new layer made from it."
    return
  }
  if (!state.shape) {
    note.textContent = `${formatClock(state.lengthSec)}. Recordings loop to this length. Choose a shape in Build if you want a build, a climax, or a soft ending.`
    return
  }
  const shape = SHAPES[state.shape]
  note.textContent = `${formatClock(state.lengthSec)} · ${shape.name}. Recordings loop to this length, and loudness follows the shape. Your original take is unchanged.`
}

function renderRuler() {
  const { total } = layoutTimeline()
  const step = total <= 45 ? 5 : total <= 90 ? 10 : total <= 180 ? 15 : 30
  const marks = []
  for (let t = 0; t < total - 0.5; t += step) marks.push(`<span>${formatClock(t)}</span>`)
  marks.push(`<span>${formatClock(total)}</span>`)
  const shape = SHAPES[state.shape]
  const bands = shape
    ? `<div class="shape-row">${shape.bands
        .map(([name, start, end]) => `<i style="width:${(end - start) * 100}%;background:${BAND_COLOR[name] || "#3d7eff"}">${name}</i>`)
        .join("")}</div>`
    : ""
  $("ruler").innerHTML = `${bands}<div class="ruler-marks">${marks.join("")}</div>`
}

function shapedPeaks(layer) {
  const src = layer.peaks?.length ? layer.peaks : [0.4]
  if (!state.lengthSec) return src
  const count = Math.max(40, Math.round((state.trackWidth - 190) / 6))
  const out = []
  for (let i = 0; i < count; i++) {
    const frac = count === 1 ? 0 : i / (count - 1)
    const level = state.shape ? levelAt(state.shape, frac) : 1
    out.push(Math.max(0.08, Math.min(1, src[i % src.length] * level)))
  }
  return out
}

function renderTracks() {
  const box = $("tracks")
  if (!state.layers.length) {
    box.innerHTML = `<p class="empty">Make your first sound. Record, then keep the take on the timeline.</p>`
    return
  }
  box.innerHTML = state.layers
    .map(
      (layer) => `<div class="track ${layer.id === state.selected ? "selected" : ""} ${layer.id === state.arrived ? "arrived" : ""}">
        <button class="track-label" data-action="select-layer" data-id="${layer.id}">
          ${layer.name}
          <small>${layer.sound}${layer.from ? ` · ${layer.from}` : ""}${layer.live ? "" : " · layout"}</small>
        </button>
        ${wave(shapedPeaks(layer), layer.color, layer.id)}
      </div>`,
    )
    .join("")
}

function slider(label, key, min, max, step, value, id, readout) {
  const mark = readout == null ? value : readout
  const layerId = id ? ` data-id="${id}" data-mix="1"` : ""
  return `<label class="field">${label}
    <input class="slider" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-action="set-${key}"${layerId} />
    <span>${mark}</span>
  </label>`
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

function mixFamily(layer) {
  const text = `${layer.sound || ""} ${layer.name || ""}`.toLowerCase()
  if (/choir/.test(text)) return "choir"
  if (/drum|clap/.test(text)) return "drums"
  if (/bass|beatbox/.test(text)) return "bass"
  if (/guitar|piano|rhodes|keyboard|string|brass|synth|instrument/.test(text)) return "instrument"
  if (/voice|hum|sing|hook/.test(text)) return "vocal"
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

function mixBox(id, name, line) {
  return `<button class="plan ${state.mix === id ? "on" : ""}" data-action="apply-mix" data-preset="${id}"><b>${name}</b><span>${line}</span></button>`
}

function renderMix(head, layer) {
  if (!state.layers.length) {
    return `${head("Mix")}<p class="empty">Record a layer, or open an example, then pick a mix.</p>`
  }
  const current = layer || state.layers[0]
  const gain = current.gain ?? 0.8
  const pan = current.pan ?? 0
  const low = current.low ?? 0
  const high = current.high ?? 0
  const space = current.space ?? 0
  const strips = state.layers.map((item) => `<div class="strip ${item.id === current.id ? "on" : ""}">
      <button class="strip-name" data-action="select-layer" data-id="${item.id}">${esc(item.name)}</button>
      <input class="fader" type="range" min="0" max="1" step="0.01" value="${item.gain ?? 0.8}" data-mix="1" data-action="set-gain" data-id="${item.id}" aria-label="${esc(item.name)} volume" />
      <div class="strip-buttons">
        <button class="mini ${item.mute ? "on" : ""}" data-action="toggle-mute" data-id="${item.id}" aria-label="Mute ${esc(item.name)}">M</button>
        <button class="mini ${item.solo ? "on" : ""}" data-action="toggle-solo" data-id="${item.id}" aria-label="Solo ${esc(item.name)}">S</button>
      </div>
    </div>`).join("")
  const fine = state.fine ? `<div class="fine-body">
      <p class="hint">${esc(current.name)} · ${esc(current.sound || "Layer")}</p>
      ${slider("Volume", "gain", 0, 1, 0.01, gain, current.id, mixReadout("gain", gain))}
      ${slider("Bass", "low", -6, 6, 1, low, current.id, mixReadout("low", low))}
      ${slider("Treble", "high", -6, 6, 1, high, current.id, mixReadout("high", high))}
      ${slider("Left and right", "pan", -1, 1, 0.01, pan, current.id, mixReadout("pan", pan))}
      ${slider("Space", "space", 0, 1, 0.01, space, current.id, mixReadout("space", space))}
      <p class="hint">Bass and treble are tone. Left and right is where it sits in the speakers. Space is room around the sound. Scrolling the timeline still moves through the song.</p>
    </div>` : ""
  return `${head("Mix")}
    <p class="hint">Pick a sound you want. The faders are the mixer. Fine tune is for the few things people usually adjust.</p>
    <p class="ask">For the whole song</p>
    <div class="mix-boxes">${Object.entries(SONG_MIXES).map(([id, item]) => mixBox(id, item.name, item.line)).join("")}</div>
    <p class="ask">For one kind of part</p>
    <div class="mix-boxes parts">${Object.entries(MIX_PARTS).map(([id, item]) => mixBox(id, item.name, item.line)).join("")}</div>
    <div class="strips">${strips}</div>
    <button class="choice" data-action="toggle-fine">${state.fine ? "Hide fine tune" : "Fine tune this layer"}</button>
    ${fine}`
}

function applyMix(id) {
  if (!state.layers.length) {
    $("save-status").textContent = "Add a layer first, or open an example."
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

function renderInspector() {
  const layer = selectedLayer()
  const head = (title) => `<div class="sheet-head"><h2>${title}</h2><button class="icon-btn" data-action="close-panel" aria-label="Close">×</button></div>`
  let body = ""
  if (state.panel === "record") {
    const tempoLine = state.tempoSource
      ? `Tempo ${state.bpm} from ${state.tempoSource}. The click follows it.`
      : "Clap, snap, or beatbox a steady pulse first. Songbird sets the metronome from it. If you just hum, it finds the tempo from that instead."
    const listening = state.recording && state.tempoPass
    body = `${head("Make a sound")}
      <p class="ask">First, the tempo</p>
      <p class="hint">${tempoLine}</p>
      <button class="primary" data-action="tempo-pass">${listening ? "Stop and set the tempo" : "Clap the tempo"}</button>
      <div class="seg">
        <button class="${state.mode === "first" ? "on" : ""}" data-action="rec-mode" data-mode="first">Record First</button>
        <button class="${state.mode === "live" ? "on" : ""}" data-action="rec-mode" data-mode="live">Play Live</button>
      </div>
      <div class="grid">${INPUTS.map(([id, label]) => `<button class="tile ${state.input === id ? "on" : ""}" data-action="pick-input" data-input="${id}">${label}</button>`).join("")}</div>
      <div class="meter ${state.recording ? "go" : ""}" aria-hidden="true">${Array.from({ length: 18 }, () => "<i></i>").join("")}</div>
      <button class="mic ${state.recording ? "hot" : ""}" data-action="toggle-record" aria-label="${state.recording ? "Stop recording" : "Record"}">${state.recording ? "■" : "●"}</button>
      <p class="hint" id="rec-time">${listening ? "Listening for the tempo. No click yet." : state.recording ? "Recording. The click stays in the speakers, not in the take." : state.tempoLocked ? "The click counts in four beats at this tempo." : "00:00"}</p>
      ${state.mode === "live" ? `<p class="warn">Live instrument monitoring is not connected yet. You can still record your voice.</p>` : ""}
      <p class="hint">Headphones help keep the click out of the microphone.</p>
      <div class="seg">
        ${["original", "both", "transformed"].map((id) => `<button class="${state.monitor === id ? "on" : ""}" data-action="monitor" data-monitor="${id}">${id === "both" ? "Original + transformed" : id[0].toUpperCase() + id.slice(1)}</button>`).join("")}
      </div>
      <div class="row">
        <button class="primary" data-action="keep-take" ${pendingBlob ? "" : "disabled"}>Keep</button>
        <button class="choice" data-action="discard-take">Try again</button>
      </div>`
  } else if (state.panel === "transform") {
    const sources = state.layers.filter((item) => buffers.get(item.id + ":audio"))
    const current = sources.find((item) => item.id === state.selected) || sources[0]
    const locked = state.transforming ? "disabled" : ""
    const note = state.transformNote
      ? `<p class="${state.transformTone === "warn" ? "warn" : "hint"}">${esc(state.transformNote)}</p>`
      : ""
    body = `${head("Transform this layer")}
      <p class="hint">Your original stays. Pick old school or modern, then a package. Highlighted packages fit the layer you picked. A melody can become piano, Rhodes, guitar, or choir. Claps become drums. Low notes become bass.</p>
      ${sources.length ? `<p class="ask">Listen to</p>
        <div class="choices">${sources.map((item) => `<button class="${item.id === current.id ? "on" : ""}" data-action="pick-transform-layer" data-id="${item.id}" ${locked}>${esc(item.name)}</button>`).join("")}</div>` : `<p class="hint">Record a layer first, or open an example.</p>`}
      <p class="ask">Old school or modern</p>
      <div class="mix-boxes parts">${ERAS.map((era) => `<button class="plan ${state.era === era.id ? "on" : ""}" data-action="pick-era" data-era="${era.id}" ${locked}><b>${era.name}</b><span>${era.line}</span></button>`).join("")}</div>
      <p class="ask">Package</p>
      <div class="mix-boxes parts">${PACKAGES.map((pack) => `<button class="plan ${current && transformFit(current, pack.id) ? "on" : ""}" data-action="apply-sound" data-sound="${esc(pack.id)}" ${locked}><b>${pack.name}</b><span>${pack.line}</span></button>`).join("")}</div>
      ${note}`
  } else if (state.panel === "build") {
    const mins = state.lengthSec ? Math.floor(state.lengthSec / 60) : ""
    const secs = state.lengthSec ? String(state.lengthSec % 60).padStart(2, "0") : ""
    const suggestions = INTENTS.find((item) => item.id === state.intent)
    body = `${head("Shape this song")}
      <p class="hint">Say how long you want it, and whether it should stay even, soften at the edges, or build to a climax. Songbird loops what you record to that length. The preset changes loudness over the song. It does not rewrite the recording.</p>
      <label class="field">What do you want this song to do?
        <textarea id="wish" rows="3" placeholder="3 minutes, soft intro, build up, then soften at the end">${esc(state.wish)}</textarea>
      </label>
      <button class="primary" data-action="read-wish">Use what I said</button>
      ${state.heard ? `<p class="hint">${esc(state.heard)}</p>` : ""}
      <p class="ask">How long do you want it?</p>
      <div class="choices">${LENGTHS.map(([seconds, label, tag]) => `<button class="${state.lengthSec === seconds ? "on" : ""}" data-action="apply-length" data-seconds="${seconds}">${label}${tag ? `<small>${tag}</small>` : ""}</button>`).join("")}</div>
      <div class="length-entry">
        <label class="field">Minutes<input id="len-min" type="number" min="0" max="8" value="${mins}" /></label>
        <label class="field">Seconds<input id="len-sec" type="number" min="0" max="59" value="${secs}" /></label>
        <button class="choice" data-action="apply-length-custom">Use this length</button>
      </div>
      <p class="ask">What should it do?</p>
      <div class="choices">${INTENTS.map((item) => `<button class="${state.intent === item.id ? "on" : ""}" data-action="pick-intent" data-intent="${item.id}">${item.title}</button>`).join("")}</div>
      ${suggestions ? `<p class="hint">${esc(suggestions.detail)}</p>${suggestions.shapes.map((id) => {
        const shape = SHAPES[id]
        return `<button class="plan ${state.shape === id ? "on" : ""}" data-action="apply-shape" data-shape="${id}"><b>${shape.name}</b><span>${shape.line}</span>${curve(id)}</button>`
      }).join("")}` : ""}
      <p class="ask">Add another layer</p>
      <p class="hint">Each sound stays its own layer. The shape applies to all of them.</p>
      <div class="grid">${INPUTS.map(([id, label]) => `<button class="tile" data-action="add-and-record" data-input="${id}">${label}</button>`).join("")}</div>`
  } else if (state.panel === "finish") {
    body = `${head("Finish your song")}
      <div class="seg"><button class="on">Audio</button><button data-action="video-note">Video</button></div>
      <p class="warn">Export is not connected in this prototype. Nothing is uploaded.</p>
      <button class="primary" data-action="video-note">Master my song</button>
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

function dropLayerAudio() {
  for (const layer of state.layers) {
    buffers.delete(layer.id)
    buffers.delete(layer.id + ":audio")
  }
}

function openSong(id) {
  const song = state.songs.find((item) => item.id === id)
  if (!song) return
  dropLayerAudio()
  state.song = song
  $("song-title").value = song.title
  let exampleNote = ""
  if (song.demo) {
    const made = SongbirdMusic.makeExample(song.id)
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
    exampleNote = made.blurb
  } else {
    state.layers = song.layers ?? []
  }
  state.selected = state.layers[0]?.id ?? null
  if (!song.demo) {
    state.lengthSec = song.lengthSec || null
    state.shape = song.shape || null
    state.intent = song.intent || null
    state.bpm = song.bpm || 92
    state.tempoSource = song.tempoSource || ""
    state.tempoLocked = !!song.tempoLocked
    $("bpm").value = state.bpm
  }
  state.heard = exampleNote
  state.transformNote = ""
  state.transformTone = ""
  state.transforming = false
  state.arrived = null
  undoStack = []
  redoStack = []
  showInspector()
  setScreen("studio")
  renderPlanNote()
  renderRuler()
  renderTracks()
  renderInspector()
  $("save-status").textContent = song.demo ? "Example ready · press play" : "Saved on this device · audio stays in this tab"
  renderProjectActions()
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

function rememberSong() {
  if (!state.song || state.song.demo) return
  state.song.title = $("song-title").value.trim() || "Untitled song"
  state.song.lengthSec = state.lengthSec
  state.song.shape = state.shape
  state.song.intent = state.intent
  state.song.bpm = state.bpm
  state.song.tempoSource = state.tempoSource
  state.song.tempoLocked = state.tempoLocked
  state.song.layers = state.layers.map(({ id, name, sound, from, color, peaks, gain, pan, low, high, space, mute, solo, live }) => ({
    id, name, sound, from, color, peaks, gain, pan, low, high, space, mute, solo, live,
  }))
  saveSongs()
  $("save-status").textContent = "Saved just now"
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
  buffers.set(layer.id + ":audio", decoded.buffer)
  pendingBlob = null
  rememberSong()
  renderTracks()
  if (!stayOpen) closePanel()
  const tempo = state.tempoSource ? ` Tempo is ${state.bpm} from ${state.tempoSource}.` : ""
  $("save-status").textContent = `Take kept. Your original recording is safe.${tempo}`
  wakeSky()
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
  $("save-status").textContent = "Finding the tempo…"
  try {
    const decoded = await blobPeaks(pendingBlob)
    const copy = new Float32Array(decoded.buffer.length)
    copy.set(decoded.buffer.getChannelData(0))
    const found = wasTempo || !state.tempoLocked
      ? SongbirdMusic.tempoFromAudio(copy, decoded.buffer.sampleRate, wasTempo ? "pulse" : "melody")
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
  const ctx = ac()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = accent ? 1680 : 1120
  const peak = accent ? 0.24 : 0.11
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + (accent ? 0.06 : 0.04))
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(time)
  osc.stop(time + 0.07)
  sky.flashes.push({ when: time, strength: accent ? 1 : 0.42 })
}

function startClick(startAt) {
  stopClick()
  if (!state.click) return
  const ctx = ac()
  const beat = 60 / state.bpm
  let next = startAt || ctx.currentTime + 0.06
  let index = 0
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
  const wasTempo = state.tempoPass
  state.arming = false
  state.recording = false
  state.tempoPass = false
  window.clearInterval(recTimer)
  stopClick()
  recStream?.getTracks().forEach((track) => track.stop())
  if (recorder && recorder.state !== "inactive") {
    recorder._wasTempo = wasTempo
    recorder.stop()
    return
  }
  releaseMic()
  endSky()
  renderInspector()
}

async function toggleRecord() {
  if (state.recording || state.arming) {
    cancelRecord()
    return
  }
  const tempoPass = state.tempoPass
  state.arming = true
  try {
    recStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    state.arming = false
    state.tempoPass = false
    $("save-status").textContent = "Microphone permission is needed to record."
    return
  }
  if (!state.arming) {
    recStream?.getTracks().forEach((track) => track.stop())
    return
  }
  state.recording = true
  state.arming = false
  renderInspector()
  attachMic(recStream)
  beginSky("record")
  ac()
  if (!tempoPass && state.countIn && state.click) {
    const beat = 60 / state.bpm
    const lead = 0.08
    $("save-status").textContent = `Count-in at ${state.bpm}. Then you record.`
    startClick(ac().currentTime + lead)
    await new Promise((resolve) => window.setTimeout(resolve, (lead + beat * 4) * 1000))
  } else if (!tempoPass) {
    startClick()
  }
  if (!state.recording) return
  recChunks = []
  const media = new MediaRecorder(recStream)
  media._wasTempo = tempoPass
  recorder = media
  media.ondataavailable = (event) => {
    if (event.data.size) recChunks.push(event.data)
  }
  media.onstop = () => {
    pendingBlob = new Blob(recChunks, { type: media.mimeType || "audio/webm" })
    state.recording = false
    state.tempoPass = false
    releaseMic()
    endSky()
    void finishRecording(media._wasTempo)
  }
  media.start()
  recStarted = performance.now()
  recTimer = window.setInterval(() => {
    const node = $("rec-time")
    if (!node) return
    const seconds = Math.floor((performance.now() - recStarted) / 1000)
    node.textContent = tempoPass ? `00:${String(seconds).padStart(2, "0")} · listening for the tempo` : `00:${String(seconds).padStart(2, "0")} · recording`
  }, 250)
  renderInspector()
}

function applyPlan(lengthSec, shapeId, heard) {
  const nextLength = clampLength(lengthSec || state.lengthSec || 180)
  const nextShape = SHAPES[shapeId] ? shapeId : null
  snapshot()
  state.lengthSec = nextLength
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
    const assumed = !wish.lengthSec && !state.lengthSec
    const length = wish.lengthSec || state.lengthSec || 180
    const assumedNote = assumed ? "I used 3:00, a common song length. " : ""
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

function scheduleShape(gainNode, base, shapeId, startTime, duration) {
  const points = (SHAPES[shapeId] || SHAPES.even).points
  const param = gainNode.gain
  param.cancelScheduledValues(startTime)
  param.setValueAtTime(Math.max(0, base * points[0][1]), startTime)
  for (let i = 1; i < points.length; i++) {
    param.linearRampToValueAtTime(Math.max(0, base * points[i][1]), startTime + points[i][0] * duration)
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

function addTransformedLayer(sound) {
  if (state.transforming) return
  const layers = state.layers.filter((layer) => buffers.get(layer.id + ":audio"))
  const selected = layers.find((layer) => layer.id === state.selected) || layers[0]
  if (!selected) {
    state.transformNote = "Record a layer, or open an example, then pick a sound."
    state.transformTone = "warn"
    $("save-status").textContent = state.transformNote
    renderInspector()
    return
  }
  const source = sourceForTransform(selected, sound, layers)
  state.transforming = true
  state.transformNote = `Listening to ${source.layer.name}…`
  state.transformTone = ""
  $("save-status").textContent = state.transformNote
  renderInspector()
  const ctx = ac()
  if (ctx.resume) void ctx.resume()
  window.setTimeout(() => {
    try {
      const audio = buffers.get(source.layer.id + ":audio")
      const copy = new Float32Array(audio.length)
      copy.set(audio.getChannelData(0))
      const era = state.era === "modern" ? "modern" : "old"
      const eraName = era === "modern" ? "modern" : "old school"
      const pack = PACKAGES.find((item) => item.id === sound)
      const made = SongbirdMusic.transformAudio(copy, sound, { bpm: state.bpm, sampleRate: audio.sampleRate, era })
      if (!made) {
        state.transformNote = `Couldn't find ${missingPart(sound)} in ${source.layer.name}. The original is unchanged.`
        state.transformTone = "warn"
        $("save-status").textContent = state.transformNote
      } else {
        snapshot()
        const id = uid()
        const colors = { Piano: "#f0a202", Rhodes: "#7ee0c8", "Acoustic guitar": "#ff8ab0", "Electric guitar": "#ff4d8d", Guitar: "#ff8ab0", Drums: "#3d7eff", Bass: "#d98a00", Choir: "#b44dff" }
        const label = pack ? pack.name : sound
        const layer = {
          id,
          name: label,
          sound,
          from: `from ${source.layer.name} · ${eraName}`,
          color: colors[sound] || "#7aa2ff",
          peaks: peaksFromSamples(made.samples),
          gain: 0.7,
          pan: 0.15,
          low: 0,
          high: 0,
          space: 0,
          mute: false,
          solo: false,
          live: true,
        }
        buffers.set(id + ":audio", audioBuffer(made.samples, SongbirdMusic.sampleRate))
        state.layers.push(layer)
        state.selected = id
        state.arrived = id
        const heard = source.redirected
          ? `${label}, ${eraName}, was added from ${source.layer.name}. There isn't ${missingPart(sound)} in ${selected.name}, so Songbird used ${source.layer.name}.`
          : `${label}, ${eraName}, was added from ${source.layer.name}. The original layer is still there.`
        state.transformNote = `${heard} Playing them together.`
        state.transformTone = ""
        $("save-status").textContent = state.transformNote
        rememberSong()
        try { play() } catch { /* the new layer is still on the timeline */ }
      }
    } catch {
      state.transformNote = "That didn't work. The original layer is unchanged."
      state.transformTone = "warn"
      $("save-status").textContent = state.transformNote
    }
    state.transforming = false
    renderTracks()
    renderInspector()
    document.querySelector(".track.arrived")?.scrollIntoView?.({ block: "nearest", inline: "nearest" })
  }, 30)
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
  const span = nodes.span || state.lengthSec || 1
  if (state.shape && state.lengthSec) {
    const elapsed = Math.max(0, now - playStarted)
    nodes.gain.gain.cancelScheduledValues(now)
    nodes.gain.gain.setValueAtTime(Math.max(0, layer.gain * levelAt(state.shape, Math.min(1, elapsed / span))), now)
    for (const [frac, level] of (SHAPES[state.shape] || SHAPES.even).points) {
      const time = playStarted + frac * span
      if (time > now + 0.03) nodes.gain.gain.linearRampToValueAtTime(Math.max(0, layer.gain * level), time)
    }
  } else nodes.gain.gain.setValueAtTime(layer.gain, now)
}

function audible(layer) {
  if (layer.mute) return false
  if (state.layers.some((item) => item.solo)) return layer.solo
  return true
}

function play() {
  const ctx = ac()
  const live = state.layers.filter((layer) => audible(layer) && buffers.get(layer.id + ":audio"))
  if (!live.length) {
    $("save-status").textContent = "Nothing recorded to play yet. The colored layout is a picture of the song."
    return
  }
  stopPlayback()
  playing = true
  playStarted = ctx.currentTime
  $("play-btn").textContent = "■"
  beginSky("play")
  const span = state.lengthSec || Math.max(...live.map((layer) => buffers.get(layer.id + ":audio").duration))
  let ended = 0
  for (const layer of live) {
    const buffer = buffers.get(layer.id + ":audio")
    const source = ctx.createBufferSource()
    source.buffer = buffer
    if (state.lengthSec && buffer.duration >= 0.05 && buffer.duration < span - 0.05) source.loop = true
    const lowFilter = ctx.createBiquadFilter()
    lowFilter.type = "lowshelf"
    lowFilter.frequency.value = 140
    lowFilter.gain.value = layer.low || 0
    const highFilter = ctx.createBiquadFilter()
    highFilter.type = "highshelf"
    highFilter.frequency.value = 4200
    highFilter.gain.value = layer.high || 0
    const gain = ctx.createGain()
    const pan = ctx.createStereoPanner()
    pan.pan.value = layer.pan || 0
    const dry = ctx.createGain()
    const wet = ctx.createGain()
    const space = Math.max(0, Math.min(1, layer.space || 0))
    dry.gain.value = 1 - space * 0.35
    wet.gain.value = space * 0.5
    const verb = ctx.createConvolver()
    verb.buffer = spaceImpulse(ctx)
    source.connect(lowFilter)
    lowFilter.connect(highFilter)
    highFilter.connect(gain)
    gain.connect(pan)
    const watch = ctx.createAnalyser()
    watch.fftSize = 64
    watch.smoothingTimeConstant = 0.78
    pan.connect(dry)
    dry.connect(ctx.destination)
    pan.connect(verb)
    verb.connect(wet)
    wet.connect(ctx.destination)
    pan.connect(watch)
    const start = ctx.currentTime
    if (state.shape && state.lengthSec) scheduleShape(gain, layer.gain, state.shape, start, span)
    else gain.gain.value = layer.gain
    mixNodes.set(layer.id, { id: layer.id, gain, low: lowFilter, high: highFilter, pan, dry, wet, span, watch, bins: new Uint8Array(watch.frequencyBinCount) })
    source.start()
    source.stop(start + Math.max(0.05, span))
    activeSources.push(source)
    source.onended = () => {
      ended += 1
      if (playing && ended >= live.length) stopPlayback()
    }
  }
  const tick = () => {
    if (!playing) return
    const elapsed = ctx.currentTime - playStarted
    const travel = Math.max(1, state.trackWidth - 190)
    const x = 164 + (elapsed / span) * travel
    $("playhead").style.left = `${Math.min(state.trackWidth - 12, x)}px`
    const timeline = $("timeline")
    if (x > timeline.scrollLeft + timeline.clientWidth * 0.72) timeline.scrollLeft = x - timeline.clientWidth * 0.35
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}

function stopPlayback() {
  playing = false
  cancelAnimationFrame(raf)
  stopClick()
  for (const source of activeSources) {
    try { source.stop() } catch { /* already stopped */ }
  }
  for (const nodes of mixNodes.values()) {
    try { nodes.dry?.disconnect() } catch { /* already stopped */ }
    try { nodes.wet?.disconnect() } catch { /* already stopped */ }
    try { nodes.watch?.disconnect() } catch { /* already stopped */ }
  }
  activeSources = []
  mixNodes.clear()
  endSky()
  const playButton = $("play-btn")
  if (playButton) playButton.textContent = "▶"
}

document.body.addEventListener("click", (event) => {
  const node = event.target.closest("[data-action]")
  if (!node) return
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
  if (action === "tempo-pass") {
    if (!state.recording) state.tempoPass = true
    void toggleRecord()
  }
  if (action === "record" || action === "toggle-record") {
    if (!state.recording) state.tempoPass = false
    void toggleRecord()
  }
  if (action === "panel") setPanel(node.dataset.panel)
  if (action === "close-panel") closePanel()
  if (action === "undo" && undoStack.length) {
    redoStack.push(JSON.stringify(state.layers))
    restore(undoStack.pop())
    rememberSong()
  }
  if (action === "redo" && redoStack.length) {
    undoStack.push(JSON.stringify(state.layers))
    restore(redoStack.pop())
    rememberSong()
  }
  if (action === "toggle-click") {
    state.click = !state.click
    $("click-btn").classList.toggle("on", state.click)
    $("click-btn").textContent = state.click ? "Click" : "Muted"
  }
  if (action === "select-layer") {
    state.selected = node.dataset.id
    if (state.panel !== "transform") {
      state.panel = "mix"
      showInspector()
    }
    renderTracks()
    if (state.panel === "mix" && !window.matchMedia("(min-width: 1100px)").matches) setPanel("mix")
    else renderInspector()
  }
  if (action === "pick-transform-layer") {
    state.selected = node.dataset.id
    state.panel = "transform"
    renderTracks()
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
    if (state.monitor === "transformed") {
      $("save-status").textContent = "Transformed monitoring is not connected yet. You still hear the original."
    }
    renderInspector()
  }
  if (action === "keep-take") void keepTake()
  if (action === "discard-take") {
    pendingBlob = null
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
      const assumed = !state.lengthSec
      const length = state.lengthSec || 180
      const intro = assumed ? "I used 3:00, a common song length. " : ""
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
    const assumed = !state.lengthSec
    const length = state.lengthSec || 180
    const intro = assumed ? "I used 3:00, a common song length. " : ""
    applyPlan(length, node.dataset.shape, `${intro}${planMessage(length, node.dataset.shape)}`)
  }
  if (action === "add-and-record") {
    state.input = node.dataset.input
    setPanel("record")
  }
  if (action === "pick-era") {
    state.era = node.dataset.era === "modern" ? "modern" : "old"
    renderInspector()
  }
  if (action === "apply-sound") addTransformedLayer(node.dataset.sound)
  if (action === "apply-mix") applyMix(node.dataset.preset)
  if (action === "toggle-fine") {
    state.fine = !state.fine
    renderInspector()
  }
  if (action === "toggle-mute" || action === "toggle-solo") {
    if (node.dataset.id) state.selected = node.dataset.id
    const layer = selectedLayer()
    if (!layer) return
    snapshot()
    if (action === "toggle-mute") layer.mute = !layer.mute
    else layer.solo = !layer.solo
    rememberSong()
    renderInspector()
  }
  if (action === "reset-pan") {
    const layer = selectedLayer()
    if (!layer) return
    snapshot()
    layer.pan = 0
    rememberSong()
    renderInspector()
  }
  if (action === "delete-layer") {
    const layer = selectedLayer()
    if (!layer) return
    snapshot()
    state.layers = state.layers.filter((item) => item.id !== layer.id)
    state.selected = state.layers[0]?.id ?? null
    rememberSong()
    renderTracks()
    renderInspector()
  }
  if (action === "video-note") {
    const note = $("finish-note")
    if (note) note.textContent = "Video creation is not connected in this prototype."
  }
})

document.body.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || !event.target.classList?.contains("share-email")) return
  event.preventDefault()
  shareSong(event.target.dataset.id, event.target.value)
})

document.body.addEventListener("input", (event) => {
  const node = event.target
  if (node.id === "search") {
    state.query = node.value
    renderSongs()
  }
  if (node.id === "song-title") rememberSong()
  if (node.id === "wish") state.wish = node.value
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

document.body.addEventListener("pointerdown", (event) => {
  if (event.target.closest("[data-mix]")) snapshot()
})

$("timeline").addEventListener("wheel", (event) => {
  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
    $("timeline").scrollLeft += event.deltaY
    event.preventDefault()
  }
}, { passive: false })

renderSongs()
renderProjectActions()
renderRuler()
renderTracks()
renderInspector()
if (window.matchMedia("(min-width: 1100px)").matches) document.body.classList.add("sheet-open")
sky.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
seedStars()
paintSky(0, 0)
if (window.ResizeObserver) {
  const stage = document.querySelector(".stage")
  if (stage) {
    new ResizeObserver(() => {
      if (!sky.raf) paintSky(performance.now(), sky.level)
    }).observe(stage)
  }
}
