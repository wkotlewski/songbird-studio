const STARTERS = [
  { id: "grandpa", title: "Grandpa's Sunday Song", privacy: "Private", demo: true },
  { id: "family", title: "Our Family Song", privacy: "Family only", demo: true },
  { id: "summer", title: "Summer Memories", privacy: "Shared with family", demo: true },
  { id: "ella", title: "Ella's Happy Song", privacy: "Private", demo: true },
  { id: "bright", title: "A Brighter Day", privacy: "Public", demo: true },
]

const DEMO = [
  ["My humming", "Guitar", "#1fbfa7", 3],
  ["My claps", "Drums", "#3d7eff", 7],
  ["My singing", "Choir", "#b44dff", 11],
  ["My beatbox", "Bass", "#f0a202", 5],
]

const INPUTS = [
  ["hum", "Hum or sing"],
  ["clap", "Clap or tap"],
  ["beat", "Beatbox"],
  ["instrument", "Instrument"],
]

const INSTRUMENTS = ["Guitar", "Piano", "Drums", "Bass", "Choir", "Strings", "Synth", "Brass"]

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
}

const $ = (id) => document.getElementById(id)

function loadSongs() {
  try {
    const saved = JSON.parse(localStorage.getItem("songbird-songs") || "[]")
    return [...saved, ...STARTERS]
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
  undoStack.push(JSON.stringify(state.layers))
  if (undoStack.length > 30) undoStack.shift()
  redoStack = []
}

function restore(raw) {
  state.layers = JSON.parse(raw)
  if (!state.layers.some((layer) => layer.id === state.selected)) state.selected = state.layers[0]?.id ?? null
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
        <span><b>${song.title}</b><span class="meta">${song.demo ? "Layout preview" : "On this device"} · ${song.privacy}</span></span>
        <span class="badge">${song.privacy}</span>
      </button>`,
    )
    .join("")
}

function renderRuler() {
  $("ruler").innerHTML = ["0:00", "0:10", "0:20", "0:30", "0:40"].map((mark) => `<span>${mark}</span>`).join("")
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
          <small>${layer.sound}${layer.live ? "" : " · layout"}</small>
        </button>
        ${wave(layer.peaks, layer.color)}
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
    body = `${head("Make a sound")}
      <div class="seg">
        <button class="${state.mode === "first" ? "on" : ""}" data-action="rec-mode" data-mode="first">Record First</button>
        <button class="${state.mode === "live" ? "on" : ""}" data-action="rec-mode" data-mode="live">Play Live</button>
      </div>
      <div class="grid">${INPUTS.map(([id, label]) => `<button class="tile ${state.input === id ? "on" : ""}" data-action="pick-input" data-input="${id}">${label}</button>`).join("")}</div>
      <div class="meter ${state.recording ? "go" : ""}" aria-hidden="true">${Array.from({ length: 18 }, () => "<i></i>").join("")}</div>
      <button class="mic ${state.recording ? "hot" : ""}" data-action="toggle-record" aria-label="${state.recording ? "Stop recording" : "Record"}">${state.recording ? "■" : "●"}</button>
      <p class="hint" id="rec-time">${state.recording ? "Recording… metronome stays in the speakers, not in the take." : "00:00 / 0:20"}</p>
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
      <p class="warn">Your original recording is safe. Choosing an instrument names the layer. It does not change the sound yet.</p>
      <div class="grid">${INSTRUMENTS.map((name) => `<button class="tile ${layer?.sound === name ? "on" : ""}" data-action="apply-sound" data-sound="${name}">${name}</button>`).join("")}</div>
      <p class="hint">${layer ? `Selected: ${layer.name}` : "Record a layer first."}</p>`
  } else if (state.panel === "build") {
    body = `${head("Add a layer")}
      <p class="hint">Each sound stays its own layer. Record into the one you add.</p>
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

function openSong(id) {
  const song = state.songs.find((item) => item.id === id)
  if (!song) return
  state.song = song
  $("song-title").value = song.title
  if (song.demo) {
    state.layers = DEMO.map(([name, sound, color, seed]) => ({
      id: uid(),
      name,
      sound,
      color,
      peaks: bars(seed),
      gain: 0.8,
      pan: 0,
      mute: false,
      solo: false,
      live: false,
    }))
  } else {
    state.layers = song.layers ?? []
  }
  state.selected = state.layers[0]?.id ?? null
  undoStack = []
  redoStack = []
  setScreen("studio")
  renderTracks()
  renderInspector()
  $("save-status").textContent = song.demo ? "Layout preview · record to add a real take" : "Saved on this device · audio stays in this tab"
}

function newSong() {
  const song = { id: uid(), title: "Untitled song", privacy: "Private", demo: false, layers: [] }
  state.songs.unshift(song)
  saveSongs()
  renderSongs()
  openSong(song.id)
  $("save-status").textContent = "Saved just now"
}

function rememberSong() {
  if (!state.song || state.song.demo) return
  state.song.title = $("song-title").value.trim() || "Untitled song"
  state.song.layers = state.layers.map(({ id, name, sound, color, peaks, gain, pan, mute, solo, live }) => ({
    id, name, sound, color, peaks, gain, pan, mute, solo, live,
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

async function keepTake() {
  if (!pendingBlob) return
  const decoded = await blobPeaks(pendingBlob)
  const label = INPUTS.find(([id]) => id === state.input)?.[1] ?? "Voice"
  addLayer(pendingBlob, label)
  const layer = state.layers[state.layers.length - 1]
  layer.peaks = decoded.peaks
  buffers.set(layer.id + ":audio", decoded.buffer)
  pendingBlob = null
  renderTracks()
  closePanel()
  $("save-status").textContent = "Take kept. Your original recording is safe."
}

function clickAt(time) {
  const ctx = ac()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = 1200
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(0.15, time + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(time)
  osc.stop(time + 0.05)
}

function startClick() {
  stopClick()
  if (!state.click) return
  const ctx = ac()
  const beat = 60 / state.bpm
  let next = ctx.currentTime + 0.05
  clickTimer = window.setInterval(() => {
    const now = ctx.currentTime
    while (next < now + 0.2) {
      clickAt(next)
      next += beat
    }
  }, 40)
}

function stopClick() {
  window.clearInterval(clickTimer)
}

async function toggleRecord() {
  if (state.recording) {
    state.recording = false
    recorder?.stop()
    recStream?.getTracks().forEach((track) => track.stop())
    window.clearInterval(recTimer)
    stopClick()
    renderInspector()
    return
  }
  try {
    recStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    $("save-status").textContent = "Microphone permission is needed to record."
    return
  }
  ac()
  if (state.countIn && state.click) {
    startClick()
    await new Promise((resolve) => window.setTimeout(resolve, (60 / state.bpm) * 4 * 1000))
  } else {
    startClick()
  }
  recChunks = []
  recorder = new MediaRecorder(recStream)
  recorder.ondataavailable = (event) => {
    if (event.data.size) recChunks.push(event.data)
  }
  recorder.onstop = () => {
    pendingBlob = new Blob(recChunks, { type: recorder.mimeType || "audio/webm" })
    state.recording = false
    renderInspector()
  }
  recorder.start()
  state.recording = true
  recStarted = performance.now()
  recTimer = window.setInterval(() => {
    const node = $("rec-time")
    if (!node) return
    const seconds = Math.floor((performance.now() - recStarted) / 1000)
    node.textContent = `00:${String(seconds).padStart(2, "0")} · recording`
  }, 250)
  renderInspector()
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
  if (state.click) startClick()
  let ended = 0
  for (const layer of live) {
    const source = ctx.createBufferSource()
    source.buffer = buffers.get(layer.id + ":audio")
    const gain = ctx.createGain()
    gain.gain.value = layer.gain
    const pan = ctx.createStereoPanner()
    pan.pan.value = layer.pan
    source.connect(gain)
    gain.connect(pan)
    pan.connect(ctx.destination)
    source.start()
    activeSources.push(source)
    source.onended = () => {
      ended += 1
      if (playing && ended >= live.length) stopPlayback()
    }
  }
  const tick = () => {
    if (!playing) return
    const x = 160 + ((ctx.currentTime - playStarted) / 40) * 1240
    $("playhead").style.left = `${Math.min(1380, x)}px`
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
  if (action === "record" || action === "toggle-record") void toggleRecord()
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
  if (action === "add-and-record") {
    state.input = node.dataset.input
    setPanel("record")
  }
  if (action === "apply-sound") {
    const layer = selectedLayer()
    if (!layer) return
    snapshot()
    layer.sound = node.dataset.sound
    rememberSong()
    renderTracks()
    renderInspector()
    $("save-status").textContent = "Your original recording is safe. The sound itself is unchanged."
  }
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
  if (node.id === "bpm") state.bpm = Math.min(200, Math.max(40, Number(node.value) || 92))
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
