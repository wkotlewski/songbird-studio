const STARTERS = [
  { id: "grandpa", title: "Grandpa's Sunday Song", privacy: "Private", demo: true },
  { id: "family", title: "Our Family Song", privacy: "Family only", demo: true },
  { id: "summer", title: "Summer Memories", privacy: "Shared with family", demo: true },
  { id: "ella", title: "Ella's Happy Song", privacy: "Private", demo: true },
  { id: "bright", title: "A Brighter Day", privacy: "Public", demo: true },
]

const INPUTS = [
  ["hum", "Hum or sing"],
  ["clap", "Clap or tap"],
  ["beat", "Beatbox"],
  ["instrument", "Instrument"],
]

const TRANSFORMS = ["Piano", "Guitar", "Drums", "Bass", "Choir"]

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
let clickTimer
let undoStack = []
let redoStack = []

const state = {
  screen: "library",
  tab: "mine",
  query: "",
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
  lengthSec: null,
  shape: null,
  intent: null,
  wish: "",
  heard: "",
  span: 40,
  trackWidth: 1400,
}

const $ = (id) => document.getElementById(id)

function loadSongs() {
  try {
    const saved = JSON.parse(localStorage.getItem("songbird-songs") || "[]")
    return [...STARTERS, ...saved]
  } catch {
    return [...STARTERS]
  }
}

function saveSongs() {
  const mine = state.songs.filter((song) => !song.demo)
  localStorage.setItem("songbird-songs", JSON.stringify(mine))
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

function wave(peaks, color) {
  return `<div class="wave" style="background:${color}33">${peaks
    .map((peak) => `<i style="height:${Math.max(8, peak * 46)}px;background:${color}"></i>`)
    .join("")}</div>`
}

function ac() {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === "suspended") void audioCtx.resume()
  return audioCtx
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

function setPanel(panel) {
  state.panel = panel
  document.body.classList.add("sheet-open")
  renderInspector()
}

function closePanel() {
  if (window.matchMedia("(min-width: 1100px)").matches) return
  document.body.classList.remove("sheet-open")
}

function renderSongs() {
  const q = state.query.trim().toLowerCase()
  const list = $("song-list")
  if (state.tab === "community") {
    list.innerHTML = `<p class="empty">Community is not open yet.</p>`
    return
  }
  if (state.tab === "shared") {
    list.innerHTML = `<p class="empty">Nothing shared with you yet.</p>`
    return
  }
  const songs = state.songs.filter((song) => song.title.toLowerCase().includes(q))
  if (!songs.length) {
    list.innerHTML = `<p class="empty">Make your first sound.</p>`
    return
  }
  list.innerHTML = songs
    .map(
      (song) => `<button class="song" data-action="open-song" data-id="${song.id}">
        <span class="swatch" style="background:linear-gradient(135deg,#1fbfa7,#3d7eff)"></span>
        <span><b>${song.title}</b><span class="meta">${song.demo ? "Example · press play" : "On this device"} · ${song.privacy}</span></span>
        <span class="badge">${song.privacy}</span>
      </button>`,
    )
    .join("")
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
      (layer) => `<div class="track ${layer.id === state.selected ? "selected" : ""}">
        <button class="track-label" data-action="select-layer" data-id="${layer.id}">
          ${layer.name}
          <small>${layer.sound}${layer.from ? ` · ${layer.from}` : ""}${layer.live ? "" : " · layout"}</small>
        </button>
        ${wave(shapedPeaks(layer), layer.color)}
      </div>`,
    )
    .join("")
}

function slider(label, key, min, max, step, value) {
  return `<label class="field">${label}
    <input class="slider" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-action="set-${key}" />
    <span>${value}</span>
  </label>`
}

function selectedLayer() {
  return state.layers.find((layer) => layer.id === state.selected) ?? state.layers[0]
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
    body = `${head("Transform this layer")}
      <p class="hint">Your original stays. Songbird listens and adds a new layer. Piano, guitar, and choir follow a melody. Drums follow claps. Bass follows low notes.</p>
      <div class="grid">${TRANSFORMS.map((name) => `<button class="tile" data-action="apply-sound" data-sound="${name}">${name}</button>`).join("")}</div>
      <p class="hint">${layer ? `Selected: ${layer.name}${layer.from ? ` · ${layer.from}` : ""}` : "Record a layer first, or open an example."}</p>`
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
    const gain = layer?.gain ?? 0.8
    const pan = layer?.pan ?? 0
    body = `${head("Layer controls")}
      <p>${layer ? `${layer.name} · ${layer.sound}` : "No layer yet"}</p>
      ${layer ? `${slider("Volume", "gain", 0, 1, 0.01, gain)}
        ${slider("Stereo pan  L–C–R", "pan", -1, 1, 0.01, pan)}
        <div class="row">
          <button class="mini ${layer.mute ? "on" : ""}" data-action="toggle-mute">Mute</button>
          <button class="mini ${layer.solo ? "on" : ""}" data-action="toggle-solo">Solo</button>
          <button class="mini" data-action="reset-pan">Reset pan</button>
          <button class="mini" data-action="delete-layer" style="color:var(--danger)">Delete</button>
        </div>
        <p class="hint">Pan here is left and right in the speakers. Scrolling the timeline moves through the song.</p>` : `<p class="empty">Make your first sound.</p>`}`
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
  undoStack = []
  redoStack = []
  setScreen("studio")
  renderPlanNote()
  renderRuler()
  renderTracks()
  renderInspector()
  $("save-status").textContent = song.demo ? "Example ready · press play" : "Saved on this device · audio stays in this tab"
}

function newSong() {
  const song = { id: uid(), title: "Untitled song", privacy: "Private", demo: false, layers: [] }
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
  state.song.layers = state.layers.map(({ id, name, sound, from, color, peaks, gain, pan, mute, solo, live }) => ({
    id, name, sound, from, color, peaks, gain, pan, mute, solo, live,
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

function addTransformedLayer(sound) {
  const source = selectedLayer()
  const audio = source && buffers.get(source.id + ":audio")
  if (!source || !audio) {
    $("save-status").textContent = "Choose a layer that has sound. Open an example or keep a recording first."
    return
  }
  const copy = new Float32Array(audio.length)
  copy.set(audio.getChannelData(0))
  const made = SongbirdMusic.transformAudio(copy, sound, { bpm: state.bpm, sampleRate: audio.sampleRate })
  if (!made) {
    const heard = sound === "Drums" ? "a beat" : sound === "Bass" ? "low notes" : "a melody"
    $("save-status").textContent = `Couldn't find ${heard} in ${source.name}. The original is unchanged.`
    return
  }
  snapshot()
  const id = uid()
  const colors = { Piano: "#f0a202", Guitar: "#ff8ab0", Drums: "#3d7eff", Bass: "#d98a00", Choir: "#b44dff" }
  const layer = {
    id,
    name: sound,
    sound,
    from: `from ${source.name}`,
    color: colors[sound] || "#7aa2ff",
    peaks: peaksFromSamples(made.samples),
    gain: 0.7,
    pan: 0.15,
    mute: false,
    solo: false,
    live: true,
  }
  buffers.set(id + ":audio", audioBuffer(made.samples, SongbirdMusic.sampleRate))
  state.layers.push(layer)
  state.selected = id
  rememberSong()
  renderTracks()
  renderInspector()
  $("save-status").textContent = `${sound} was added from ${source.name}. The original layer is still there.`
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
  const span = state.lengthSec || Math.max(...live.map((layer) => buffers.get(layer.id + ":audio").duration))
  let ended = 0
  for (const layer of live) {
    const buffer = buffers.get(layer.id + ":audio")
    const source = ctx.createBufferSource()
    source.buffer = buffer
    if (state.lengthSec && buffer.duration >= 0.05 && buffer.duration < span - 0.05) source.loop = true
    const gain = ctx.createGain()
    const pan = ctx.createStereoPanner()
    pan.pan.value = layer.pan
    source.connect(gain)
    gain.connect(pan)
    pan.connect(ctx.destination)
    const start = ctx.currentTime
    if (state.shape && state.lengthSec) scheduleShape(gain, layer.gain, state.shape, start, span)
    else gain.gain.value = layer.gain
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
  activeSources = []
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
  if (action === "tab") {
    state.tab = node.dataset.tab
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("on", tab.dataset.tab === state.tab))
    renderSongs()
  }
  if (action === "open-song") openSong(node.dataset.id)
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
    state.panel = "mix"
    renderTracks()
    if (window.matchMedia("(min-width: 1100px)").matches) renderInspector()
    else setPanel("mix")
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
  if (action === "apply-sound") addTransformedLayer(node.dataset.sound)
  if (action === "toggle-mute" || action === "toggle-solo") {
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
  if (node.dataset.action === "set-gain" || node.dataset.action === "set-pan") {
    const layer = selectedLayer()
    if (!layer) return
    const key = node.dataset.action === "set-gain" ? "gain" : "pan"
    layer[key] = Number(node.value)
    node.nextElementSibling.textContent = node.value
    rememberSong()
  }
})

$("timeline").addEventListener("wheel", (event) => {
  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
    $("timeline").scrollLeft += event.deltaY
    event.preventDefault()
  }
}, { passive: false })

renderSongs()
renderRuler()
renderTracks()
renderInspector()
if (window.matchMedia("(min-width: 1100px)").matches) document.body.classList.add("sheet-open")
