// Play an instrument: piano keys, guitar chords, and drum pads you tap.
// Try them any time. Tap record and Songbird counts you in, plays your song
// and the beat, and keeps what you play, on the beat, as a real instrument.
// Your part keeps its notes, so you can fix them later or change the sound.

const PAD_KINDS = [
  { id: "piano", name: "Piano", icon: "piano", family: "keys", instrument: "grand-piano" },
  { id: "guitar", name: "Guitar", icon: "music_note", family: "guitar", instrument: "steel-guitar" },
  { id: "drums", name: "Drums", icon: "graphic_eq", family: "drums" },
]

const DRUM_PADS = [
  { kind: "kick", name: "Kick", say: "Boom" },
  { kind: "snare", name: "Snare", say: "Crack" },
  { kind: "hat", name: "Hi-hat", say: "Tss" },
  { kind: "clap", name: "Clap", say: "Clap" },
  { kind: "high-tom", name: "Tom", say: "Dum" },
  { kind: "low-tom", name: "Low tom", say: "Doom" },
  { kind: "open-hat", name: "Open hat", say: "Tsss" },
  { kind: "crash", name: "Crash", say: "Crash" },
]

// Computer keys, for anyone at a keyboard.
const PIANO_KEYS = "awsedftgyhujkolp;"
const DRUM_KEYS = "asdfghjk"

const pad = {
  kind: "piano",
  octave: 60,
  kit: "standard",
  key: null,
  start: 0,
  lat: 0,
  events: [],
  held: new Map(),
  timer: 0,
  lastNote: "",
}

function padInfo() {
  return PAD_KINDS.find((item) => item.id === pad.kind) || PAD_KINDS[0]
}

function padKey() {
  if (pad.key) return pad.key
  const root = state.songKey ?? state.keyPc ?? 0
  return { root: ((root + (state.transpose || 0)) % 12 + 12) % 12, minor: false }
}

function padOut() {
  return ac().destination
}

function warmPad() {
  const info = padInfo()
  const ctx = ac()
  const job = info.family === "drums" ? SongbirdSampler.warm(ctx, { kit: pad.kit }) : SongbirdSampler.warm(ctx, { instrument: info.instrument })
  job.catch(() => {
    $("save-status").textContent = "The instrument sounds didn't load. Check the connection and try again."
  })
  return job
}

// Six chords that fit the key, in the order people reach for them.
function padChords(key) {
  const full = SongbirdMusic.keyFrom(key)
  const degrees = full.minor ? [0, 3, 4, 5, 6, 2] : [0, 3, 4, 5, 1, 2]
  return degrees.map((degree, i) => {
    let root = SongbirdMusic.scaleStep(full.root + 48, degree, key)
    while (root > 51) root -= 12
    while (root < 40) root += 12
    const tones = SongbirdMusic.chordTones(root, key, root)
    const third = (tones[1] - tones[0] + 12) % 12
    const fifth = (tones[2] - tones[0] + 12) % 12
    return {
      root,
      home: i === 0,
      name: noteName(root) + (third === 3 ? (fifth === 6 ? "dim" : "m") : ""),
      // Spread over six strings, the way a guitar chord is held.
      tones: [0, fifth, 12, 12 + third, 12 + fifth, 24],
    }
  })
}

// ---------------------------------------------------------------------------
// What you see

function padPanel() {
  const info = padInfo()
  const live = state.padRec || state.counting
  const busy = live || state.arming ? "disabled" : ""
  const key = padKey()
  let surface = ""
  if (info.id === "piano") {
    surface = `<div class="check-keys pad-keys">
      ${iconButton("chevron_left", `data-pad="oct-down" aria-label="Lower keys"`)}
      ${keyboardMarkup(pad.octave, 10, "data-pad-key", { key, octaves: true })}
      ${iconButton("chevron_right", `data-pad="oct-up" aria-label="Higher keys"`)}
    </div>`
  } else if (info.id === "guitar") {
    surface = `<div class="chord-pads">${padChords(key).map((chord) => `<button class="chord-pad ${chord.home ? "home" : ""}" data-pad-chord="${chord.root}" data-tones="${chord.tones.join(",")}" aria-label="${esc(chord.name)} chord">${esc(chord.name)}${chord.home ? "<small>home</small>" : ""}</button>`).join("")}</div>`
  } else {
    surface = `<div class="drum-pads">${DRUM_PADS.map((item) => `<button class="drum-pad" data-pad-hit="${item.kind}" aria-label="${esc(item.name)}"><b>${esc(item.say)}</b><small>${esc(item.name)}</small></button>`).join("")}</div>`
  }
  const keyRow = info.id === "drums"
    ? `<div class="choices kit-row" role="group" aria-label="Drum kit">${KITS.map((kit) => filterChip(esc(kit.name), `data-pad-kit="${kit.id}" ${busy}`, pad.kit === kit.id)).join("")}</div>`
    : `<div class="key-pick">
        <span class="ask">Key</span>
        ${iconButton("chevron_left", `data-pad="key-down" aria-label="Previous key" ${busy}`)}
        <b class="key-now">${esc(keyName(key))}</b>
        ${iconButton("chevron_right", `data-pad="key-up" aria-label="Next key" ${busy}`)}
        ${filterChip(key.minor ? "Make it major" : "Make it minor", `data-pad="key-mode" ${busy}`, false)}
      </div>`
  return `<p class="ask">What do you want to play?</p>
    <div class="pad-kinds" role="group" aria-label="Instrument">
      ${PAD_KINDS.map((item) => `<button class="pad-kind ${item.id === pad.kind ? "on" : ""}" data-pad-kind="${item.id}" aria-pressed="${item.id === pad.kind}" ${busy}>${ms(item.icon)}<span>${item.name}</span></button>`).join("")}
    </div>
    ${live ? "" : tempoBox()}
    ${keyRow}
    ${beatLightsMarkup()}
    ${surface}
    <button class="mic ${live ? "hot" : ""}" data-pad="record" data-state="${live ? "recording" : "idle"}" aria-label="${live ? "Stop recording" : "Record what I play"}">${ms(live ? "stop" : "fiber_manual_record", "glyph")}</button>
    ${state.looper ? loopClockMarkup() : ""}
    <p class="hint ${state.counting ? "count-beat" : ""}" id="rec-time">${state.counting ? (state.countBeat ? String(state.countBeat) : `Tempo ${state.bpm}`) : state.padRec ? "Recording. Play along!" : "Try it first. Then tap the record button."}</p>
    ${!live && songHasSound() ? `<button class="listen-btn ${playing ? "on" : ""}" data-action="play" id="listen-btn" aria-label="${playing ? "Stop" : "Play what you have"}">${ms(playing ? "stop" : "play_arrow")}${playing ? "Stop" : "Listen to what you have"}</button>` : ""}
    ${looperBox()}
    <p class="hint">We count 1, 2, 3, 4, then you play along with the dots. ${info.id === "piano" ? "Hold a key longer for a longer note." : info.id === "guitar" ? "Each tap strums the chord." : "Tap the pads to the beat."} Every note lands on the beat when “Fix my timing” is on.</p>`
}

// ---------------------------------------------------------------------------
// Sound and recording

function padTime() {
  const ctx = ac()
  return ctx.currentTime - pad.start - pad.lat
}

function hitNote(midi, id) {
  const info = padInfo()
  const voice = SongbirdSampler.playNote(ac(), padOut(), info.instrument, midi, 0.85)
  const record = state.padRec ? { midi, time: padTime(), dur: 0 } : null
  if (record) pad.events.push(record)
  pad.held.set(id, { voice, record, at: ac().currentTime })
}

function releaseNote(id) {
  const held = pad.held.get(id)
  if (!held) return
  pad.held.delete(id)
  if (held.record) held.record.dur = Math.max(0.12, ac().currentTime - held.at)
  void held.voice.then((voice) => voice?.stop()).catch(() => {})
}

function hitChord(root, tones) {
  const ctx = ac()
  const now = ctx.currentTime
  tones.forEach((step, i) => {
    void SongbirdSampler.playNote(ctx, padOut(), "steel-guitar", root + step, i ? 0.7 : 0.85, now + i * 0.022).catch(() => {})
  })
  if (state.padRec) pad.events.push({ midi: root, tones: [...tones], time: padTime(), dur: 0 })
}

function hitDrum(kind) {
  void SongbirdSampler.playHit(ac(), padOut(), pad.kit, kind, 0.9).catch(() => {})
  if (state.padRec) pad.events.push({ kind, time: padTime(), vel: 0.9 })
}

function stopPadRecordUi() {
  window.clearTimeout(pad.timer)
  stopClick()
  if (playing) stopPlayback()
  for (const id of [...pad.held.keys()]) releaseNote(id)
}

async function togglePadRecord() {
  if (state.padRec) {
    await finishPad()
    return
  }
  if (state.counting) {
    // Tapped during the count: call it off.
    state.counting = false
    state.countBeat = 0
    renderInspector()
    return
  }
  stopBeatPreview()
  stopMicTest()
  if (playing) stopPlayback()
  try {
    await warmPad()
  } catch {
    return
  }
  pad.events = []
  const target = state.looper ? loopTarget() : 0
  loopClock.start = Infinity
  loopClock.length = target
  loopClock.closedAt = 0
  const counted = await countIn()
  if (!counted) {
    state.counting = false
    renderInspector()
    return
  }
  const ctx = ac()
  state.counting = false
  state.countBeat = 0
  state.padRec = true
  pad.start = ctx.currentTime + 0.02
  pad.lat = (ctx.outputLatency || 0) + (ctx.baseLatency || 0)
  // The beat plays out loud: the pads aren't recorded through the mic, so
  // the click can't get into your part.
  const keep = state.click
  state.click = true
  startClick(pad.start, 0)
  state.click = keep
  if (songHasSound()) play(0, { keepClick: true })
  beatLights.origin = pad.start + pad.lat
  beatLights.firstBeat = 0
  runBeatLights()
  loopClock.start = pad.start + pad.lat
  loopClock.length = target
  runLoopClock()
  if (target) {
    pad.timer = window.setTimeout(() => {
      if (!state.padRec) return
      loopClock.closedAt = performance.now()
      void finishPad()
    }, (target + pad.lat + 0.2) * 1000)
  }
  renderInspector()
}

async function finishPad() {
  if (!state.padRec) return
  const elapsed = Math.max(0, padTime())
  stopPadRecordUi()
  state.padRec = false
  const info = padInfo()
  const events = pad.events.filter((item) => item.time > -0.3)
  pad.events = []
  if (!events.length) {
    $("save-status").textContent = "Nothing was played. Tap the keys or pads after the count of four."
    renderInspector()
    return
  }
  const beat = 60 / Math.max(40, state.bpm || 92)
  const bar = beat * 4
  const first = !(state.loopSec && songHasSound())
  let pass
  let loop = false
  if (state.looper) {
    loop = true
    if (!first) {
      const passes = state.loopBars ? 1 : Math.max(1, Math.round(elapsed / state.loopSec))
      pass = passes * state.loopSec
    } else {
      pass = state.loopBars ? state.loopBars * bar : Math.max(1, Math.round(elapsed / bar)) * bar
      state.loopSec = pass
      if (!state.lengthSec || !songHasSound()) state.lengthSec = Math.max(1, Math.ceil(60 / pass)) * pass
    }
  } else {
    pass = Math.max(bar, Math.ceil((elapsed - 0.05) / bar) * bar, songHasSound() ? state.lengthSec || 0 : 0)
    if (!songHasSound()) state.lengthSec = pass
  }
  const total = loop ? Math.max(state.lengthSec || pass, pass) : pass
  const snapped = SongbirdMusic.snapPlayed(events.map((item) => ({ ...item, time: Math.max(0, item.time) })), {
    beat,
    pass,
    loop,
    grid: state.snap ? (info.family === "drums" ? 4 : 2) : 1000,
  })
  const transpose = state.transpose || 0
  const key = padKey()
  let choice
  if (info.family === "drums") {
    choice = { family: "drums", drums: "kit", kit: pad.kit, hits: snapped.map(({ kind, time, vel }) => ({ kind, time, vel })) }
  } else {
    let melody = snapped.map((item) => ({ ...item, midi: item.midi - transpose }))
    if (info.id === "guitar") {
      // A strummed chord rings until the next one.
      melody = melody.map((item, i) => {
        const next = melody[i + 1]
        const until = next ? next.time : loop ? pass + (melody[0]?.time || 0) : pass
        return { ...item, dur: Math.max(beat * 0.5, Math.min(bar * 2, until - item.time)) }
      })
    }
    choice = {
      family: info.family,
      instrument: info.instrument,
      play: "solo",
      rhythm: info.id === "guitar" ? "strum" : "played",
      melody,
      key: { root: (key.root - transpose + 120) % 12, minor: key.minor },
    }
  }
  Object.assign(choice, { era: state.era || "today", pass, total, loop, beat, phase: 0 })
  $("save-status").textContent = "Making your part…"
  renderInspector()
  const reply = await makePart(choice)
  const made = !reply.warn
  if (made) {
    const layer = state.layers.find((item) => item.id === state.selected)
    if (layer) {
      const base = `My ${info.name.toLowerCase()}`
      const count = state.layers.filter((item) => item !== layer && item.name.startsWith(base)).length
      layer.name = `${base}${count ? ` ${count + 1}` : ""}`
      layer.sound = layer.name
      rememberSong()
      renderTracks()
    }
  }
  $("save-status").textContent = made
    ? `Got it! Your ${info.name.toLowerCase()} part is playing.${info.family === "drums" ? "" : " To fix a note, tap the note button in Sounds."} Add another, or make it magic.`
    : reply.text
  renderInspector()
}

// ---------------------------------------------------------------------------
// Taps

document.body.addEventListener("click", (event) => {
  const node = event.target.closest?.("[data-pad],[data-pad-kind],[data-pad-kit]")
  if (!node || node.disabled) return
  const d = node.dataset
  if (d.padKind) {
    pad.kind = d.padKind
    warmPad()
  }
  if (d.padKit) {
    pad.kit = d.padKit
    warmPad()
  }
  const key = padKey()
  if (d.pad === "oct-up") pad.octave = Math.min(84, pad.octave + 12)
  if (d.pad === "oct-down") pad.octave = Math.max(36, pad.octave - 12)
  if (d.pad === "key-up" || d.pad === "key-down") pad.key = { ...key, root: (key.root + (d.pad === "key-up" ? 1 : 11)) % 12 }
  if (d.pad === "key-mode") pad.key = { ...key, minor: !key.minor }
  if (d.pad === "record") {
    void togglePadRecord()
    return
  }
  if (!state.padRec) renderInspector()
})

// Keys, chords and pads sound on touch down, not on release, so playing
// feels immediate.
document.body.addEventListener("pointerdown", (event) => {
  const node = event.target.closest?.("[data-pad-key],[data-pad-chord],[data-pad-hit]")
  if (!node || node.disabled) return
  event.preventDefault()
  try { node.setPointerCapture(event.pointerId) } catch { /* fine */ }
  node.classList.add("on")
  const d = node.dataset
  if (d.padKey) hitNote(Number(d.padKey), `p${event.pointerId}`)
  if (d.padChord) hitChord(Number(d.padChord), d.tones.split(",").map(Number))
  if (d.padHit) hitDrum(d.padHit)
})

for (const type of ["pointerup", "pointercancel"]) {
  document.body.addEventListener(type, (event) => {
    releaseNote(`p${event.pointerId}`)
    document.querySelectorAll(".key.on[data-pad-key], .chord-pad.on, .drum-pad.on").forEach((node) => node.classList.remove("on"))
  })
}

function padKeysLive() {
  return state.panel === "record" && state.recordMode === "play" && document.body.classList.contains("sheet-open")
}

document.addEventListener("keydown", (event) => {
  if (!padKeysLive() || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
  if (/input|textarea|select/i.test(event.target?.tagName || "")) return
  const k = event.key.toLowerCase()
  const info = padInfo()
  if (info.id === "piano" && PIANO_KEYS.includes(k)) {
    event.preventDefault()
    const midi = pad.octave + PIANO_KEYS.indexOf(k)
    hitNote(midi, `k${k}`)
    document.querySelector(`[data-pad-key="${midi}"]`)?.classList.add("on")
  } else if (info.id === "guitar" && /^[1-6]$/.test(k)) {
    event.preventDefault()
    const node = document.querySelectorAll("[data-pad-chord]")[Number(k) - 1]
    if (node) {
      node.classList.add("on")
      hitChord(Number(node.dataset.padChord), node.dataset.tones.split(",").map(Number))
    }
  } else if (info.id === "drums" && DRUM_KEYS.includes(k)) {
    event.preventDefault()
    const item = DRUM_PADS[DRUM_KEYS.indexOf(k)]
    document.querySelector(`[data-pad-hit="${item.kind}"]`)?.classList.add("on")
    hitDrum(item.kind)
  }
})

document.addEventListener("keyup", (event) => {
  const k = event.key.toLowerCase()
  releaseNote(`k${k}`)
  document.querySelectorAll(".key.on[data-pad-key], .chord-pad.on, .drum-pad.on").forEach((node) => node.classList.remove("on"))
})
