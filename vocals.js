// Your vocal, made to sit in the song: lined up with the beat, a studio
// sound, room in the music where the words are, and background singers
// made from your own voice. Each step is one Undo; Do it all is one too.

const SINGERS = [
  ["double", "Double me", "A second you, a hair behind, for a fuller sound"],
  ["third", "A third up", "Harmony above you, following the key"],
  ["low", "Octave below", "A low voice under you"],
  ["high", "Octave above", "A high voice over you"],
]
const SINGER_MIX = {
  double: { name: "Double", gain: 0.55, pan: -0.35 },
  third: { name: "Harmony (third up)", gain: 0.42, pan: 0.38 },
  low: { name: "Low octave", gain: 0.4, pan: -0.12 },
  high: { name: "High octave", gain: 0.28, pan: 0.22 },
}

const vocal = { layerId: null, working: "", said: "", singers: new Set(["double", "third", "low"]), where: null, fit: "gentle" }

function vocalTakes() {
  return state.layers.filter((layer) => isRecording(layer) && !layer.singer && kindOf(layer) === "vocals" && buffers.get(layer.id + ":audio"))
}

function leadVocal() {
  const takes = vocalTakes()
  return takes.find((layer) => layer.id === vocal.layerId) || takes.find((layer) => layer.id === state.selected) || takes.find((layer) => layer.lead) || takes[0] || null
}

function singersOf(lead) {
  return state.layers.filter((layer) => layer.singer && layer.sourceId === lead.id)
}

function chorusSections() {
  const total = state.lengthSec || 0
  if (!state.sections?.length || !total) return []
  return state.sections.map((section) => ({ name: section.name, start: section.start * total, end: section.end * total })).filter((section) => CHORUS.test(section.name))
}

// Gaps that keep a singer to the choruses.
function chorusGaps() {
  const total = state.lengthSec || 0
  const on = chorusSections()
  if (!on.length) return []
  const gaps = []
  let at = 0
  for (const section of on) {
    if (section.start > at + 0.01) gaps.push({ start: at, end: section.start })
    at = section.end
  }
  if (at < total - 0.01) gaps.push({ start: at, end: total })
  return gaps
}

function vocalSay(text) {
  vocal.said = text
  const node = $("vocal-note")
  if (node) node.textContent = text
}

async function vocalStep(label, run) {
  if (vocal.working || state.transforming) return { text: "Still working on the last one." }
  vocal.working = label
  state.transforming = true
  vocalSay(label)
  renderInspector()
  try {
    return await run()
  } catch (error) {
    console.error("Vocal step failed:", error)
    return { text: "That didn't work. Nothing changed.", warn: true }
  } finally {
    vocal.working = ""
    state.transforming = false
  }
}

// One pass of a looped take, or the whole take.
function takeAudio(layer) {
  const audio = buffers.get(layer.id + ":audio")
  const loop = audio.loopSamples || 0
  const all = samplesOf(audio)
  return { audio, rate: audio.sampleRate, loop, pass: loop ? all.slice(0, loop) : all, length: all.length }
}

function keepOriginal(layer) {
  if (!buffers.get(layer.id + ":original")) buffers.set(layer.id + ":original", buffers.get(layer.id + ":audio"))
}

// ---------------------------------------------------------------------------
// Timing

async function fitVocal(layer, how = vocal.fit) {
  return vocalStep("Lining your vocal up with the beat…", async () => {
    const { rate, loop, pass, length } = takeAudio(layer)
    const start = layer.range?.start || 0
    const late = await engine.call("vocalOffset", pass, rate, { bpm: state.bpm || 92, start })
    let samples = pass
    if (Math.abs(late) > 0.005) {
      // The whole take moves together first: the lag a phone adds, or a
      // singer who's always a touch behind.
      const by = Math.round(late * rate)
      const moved = new Float32Array(samples.length)
      if (by > 0) moved.set(samples.subarray(by))
      else moved.set(samples.subarray(0, samples.length + by), -by)
      samples = moved
    }
    const fixed = await engine.call("fixTiming", [{ id: "take", samples, sampleRate: rate, start }], { bpm: state.bpm || 92, slack: how === "tight" ? 0.3 : 0.22, strength: how === "tight" ? 0.9 : 0.55 })
    const moved = fixed?.[0]?.moved || 0
    if (fixed?.[0]?.samples) samples = fixed[0].samples
    if (!moved && Math.abs(late) <= 0.005) return { text: `${layer.name} is already on the beat.` }
    snapshot([layer.id, ...singersOf(layer).map((item) => item.id)])
    keepOriginal(layer)
    const full = loop ? tileTo(samples, length) : samples
    buffers.set(layer.id + ":audio", loopedBuffer(full, rate, loop))
    layer.peaks = peaksFromSamples(full)
    layer.tight = true
    await followVocal(layer)
    rememberSong()
    renderTracks()
    playFromVocal(layer)
    const bits = []
    if (Math.abs(late) > 0.005) bits.push(`moved your whole vocal ${Math.round(Math.abs(late) * 1000)} ms ${late > 0 ? "earlier" : "later"} to sit with the band`)
    if (moved) bits.push(`${how === "tight" ? "snapped" : "nudged"} ${moved} ${moved === 1 ? "note" : "notes"} ${how === "tight" ? "onto" : "toward"} the beat`)
    return { text: `${capital(bits.join(", and "))}. Undo puts it back.` }
  })
}

function capital(text) {
  return text ? text[0].toUpperCase() + text.slice(1) : text
}

// Parts that follow the vocal (and its background singers) move with it.
async function followVocal(layer) {
  for (const part of state.layers.filter((item) => item.make && item.make.sourceId === layer.id && buffers.get(item.id + ":audio"))) {
    try {
      const made = await buildPart(part.make, layer)
      if (!made.error) {
        buffers.set(part.id + ":audio", loopedBuffer(made.samples, made.rate, made.loopSamples))
        part.peaks = peaksFromSamples(made.samples)
      }
    } catch { /* stays as it was */ }
  }
  for (const singer of singersOf(layer)) {
    const made = await singerAudio(layer, singer.singer)
    if (made) {
      buffers.set(singer.id + ":audio", made.buffer)
      singer.peaks = made.peaks
    }
  }
  if (layer.lead) layer.phrases = await phrasesOf(layer)
}

// ---------------------------------------------------------------------------
// Studio sound

async function shineVocal(layer) {
  if (layer.shine) return { text: `${layer.name} already has the studio sound. Undo takes it off.` }
  return vocalStep("Giving your vocal a studio sound…", async () => {
    const { audio, rate, loop } = takeAudio(layer)
    const samples = await engine.call("vocalShine", samplesOf(audio), rate, { amount: 0.7, loopSamples: loop })
    snapshot([layer.id, ...singersOf(layer).map((item) => item.id)])
    keepOriginal(layer)
    buffers.set(layer.id + ":audio", loopedBuffer(samples, rate, loop))
    layer.peaks = peaksFromSamples(samples)
    layer.shine = true
    // Front and center, with a little room around it.
    layer.gain = Math.max(layer.gain ?? 0.8, 0.85)
    layer.pan = 0
    layer.low = 0
    layer.high = 0
    layer.space = Math.max(layer.space || 0, 0.18)
    layer.echo = Math.max(layer.echo || 0, 0.06)
    await followVocal(layer)
    refreshMix(layer)
    rememberSong()
    renderTracks()
    playFromVocal(layer)
    return { text: "Your vocal has a studio sound: hiss and rumble out, clearer words, softer S sounds, and an even level, with a little room around it. Undo takes it off." }
  })
}

// ---------------------------------------------------------------------------
// Room in the music

async function phrasesOf(layer) {
  const { audio, rate } = takeAudio(layer)
  const found = await engine.call("vocalPhrases", samplesOf(audio), rate)
  const start = layer.range?.start || 0
  const end = Math.min(spanSeconds(), layer.range ? layer.range.end : spanSeconds())
  const length = audio.duration
  const out = []
  const loops = length > 0.05 && length < end - start - 0.05
  for (let at = start; at < end - 0.01; at += length) {
    for (const phrase of found) if (at + phrase.start < end) out.push({ start: Math.round((at + phrase.start) * 1000) / 1000, end: Math.round(Math.min(end, at + phrase.end) * 1000) / 1000 })
    if (!loops) break
  }
  return out.slice(0, 600)
}

function layerLevel(layer) {
  const buffer = buffers.get(layer.id + ":audio")
  if (!buffer) return 0
  const data = buffer.getChannelData(0)
  let sum = 0
  let n = 0
  for (let i = 0; i < data.length; i += 61) {
    sum += data[i] * data[i]
    n++
  }
  return Math.sqrt(sum / Math.max(1, n))
}

async function makeRoom(layer) {
  return vocalStep("Making room in the music for your voice…", async () => {
    const phrases = await phrasesOf(layer)
    if (!phrases.length) return { text: `I couldn't hear singing in ${layer.name}.`, warn: true }
    snapshot()
    for (const item of state.layers) if (item.lead && item.id !== layer.id) item.lead = false
    layer.lead = true
    layer.phrases = phrases
    const band = state.layers.filter((item) => item !== layer && !item.singer && buffers.get(item.id + ":audio"))
    for (const item of band) {
      const kind = kindOf(item)
      item.carve = kind === "drums" ? 1 : kind === "bass" ? 0 : 3
      item.duck = kind === "drums" ? 0.25 : kind === "bass" ? 0.3 : 0.7
    }
    // The voice rides on top: about as loud as the whole band together.
    const voice = layerLevel(layer) * (layer.gain ?? 0.8)
    const rest = Math.sqrt(band.filter(audible).reduce((sum, item) => sum + (layerLevel(item) * (item.gain ?? 0.8)) ** 2, 0))
    let changed = ""
    if (voice > 0 && rest > voice / 0.9) {
      const want = rest * 0.9
      const up = Math.min(1, (layer.gain ?? 0.8) * (want / voice))
      const reached = layerLevel(layer) * up
      layer.gain = Math.round(up * 100) / 100
      if (reached < want) {
        const down = Math.max(0.6, reached / want)
        for (const item of band) item.gain = Math.round((item.gain ?? 0.8) * down * 100) / 100
        if (down < 0.97) changed = ` I turned the band down ${Math.round((1 - down) * 100)}% so you're on top.`
      }
    }
    rememberSong()
    renderTracks()
    playFromVocal(layer)
    return { text: `Made room for your voice: while you sing, the music steps back a little and leaves space where your words are.${changed} Undo puts it back.` }
  })
}

function noRoom(layer) {
  snapshot()
  layer.lead = false
  for (const item of state.layers) {
    item.carve = 0
    item.duck = 0
  }
  rememberSong()
  renderTracks()
  if (playing) play(songSeconds(ac().currentTime))
  return { text: "The music doesn't step back for the vocal now. Undo turns it on again." }
}

// ---------------------------------------------------------------------------
// Background singers

let notesFor = new Map()

async function vocalNotes(layer, pass, rate) {
  if (layer.notes?.melody?.length) return layer.notes
  const cached = notesFor.get(layer.id)
  if (cached && cached.buffer === buffers.get(layer.id + ":audio")) return cached.notes
  const notes = await engine.call("readNotes", pass, rate, { bpm: state.bpm || 92 })
  notesFor.set(layer.id, { buffer: buffers.get(layer.id + ":audio"), notes })
  return notes
}

async function singerAudio(lead, kind) {
  const { rate, loop, pass, length } = takeAudio(lead)
  const options = { double: { semitones: 0.12, delay: 0.022 }, low: { semitones: -12 }, high: { semitones: 12 } }[kind] || {}
  if (kind === "third") {
    const notes = await vocalNotes(lead, pass, rate)
    if (!notes?.melody?.length) return null
    Object.assign(options, { steps: 2, melody: notes.melody, key: notes.key })
  }
  const made = await engine.call("harmonyVoice", pass, rate, options)
  if (!made?.samples) return null
  let samples = made.samples
  // Back to the take's rate and length.
  if (made.sampleRate !== rate) {
    const ratio = made.sampleRate / rate
    const back = new Float32Array(pass.length)
    for (let i = 0; i < back.length; i++) {
      const at = i * ratio
      const index = Math.floor(at)
      const frac = at - index
      back[i] = (samples[index] || 0) * (1 - frac) + (samples[index + 1] || 0) * frac
    }
    samples = back
  }
  const full = loop ? tileTo(samples, length) : samples
  return { buffer: loopedBuffer(full, rate, loop), peaks: peaksFromSamples(full) }
}

async function addSingers(lead, kinds = vocal.singers, where = vocal.where) {
  const want = [...kinds].filter((kind) => SINGER_MIX[kind])
  if (!want.length) return { text: "Pick at least one singer.", warn: true }
  return vocalStep("Making background singers from your voice…", async () => {
    const made = []
    for (const kind of want) {
      vocal.working = `Making ${SINGER_MIX[kind].name.toLowerCase()}…`
      vocalSay(vocal.working)
      const audio = await singerAudio(lead, kind)
      if (audio) made.push({ kind, ...audio })
    }
    if (!made.length) return { text: "I couldn't hear clear notes to sing along with. Try “Double me” or an octave instead.", warn: true }
    const old = singersOf(lead).filter((item) => want.includes(item.singer))
    snapshot()
    state.layers = state.layers.filter((item) => !old.includes(item))
    const choruses = where !== "song" && chorusSections().length ? chorusGaps() : []
    const at = state.layers.indexOf(lead) + 1
    const added = made.map(({ kind, buffer, peaks }) => {
      const mix = SINGER_MIX[kind]
      const id = uid()
      buffers.set(id + ":audio", buffer)
      return {
        id,
        name: mix.name,
        sound: "Background singer",
        from: `from ${lead.name}${choruses.length ? " · in the choruses" : ""}`,
        family: "voices",
        generated: true,
        singer: kind,
        sourceId: lead.id,
        color: "#b44dff",
        peaks,
        gain: Math.round((lead.gain ?? 0.8) * mix.gain * 100) / 100,
        pan: mix.pan,
        low: -2,
        high: -4,
        space: 0.42,
        echo: 0,
        mute: false,
        solo: false,
        live: true,
        loop: lead.loop,
        lengthSec: lead.lengthSec,
        range: lead.range ? { ...lead.range } : undefined,
        gaps: choruses.map((gap) => ({ ...gap })),
      }
    })
    state.layers.splice(at, 0, ...added)
    rememberSong()
    renderTracks()
    playFromVocal(lead, choruses.length ? chorusSections()[0].start : null)
    const names = added.map((item) => item.name.toLowerCase())
    const missed = want.length > made.length ? " I couldn't hear clear enough notes for the harmony, so it's left out." : ""
    return { text: `Added background singers from your voice: ${names.join(", ")}${choruses.length ? ", in the choruses" : ""}.${missed} Undo takes them away.` }
  })
}

function removeSingers(lead) {
  const old = singersOf(lead)
  if (!old.length) return { text: "There are no background singers yet." }
  snapshot()
  state.layers = state.layers.filter((item) => !old.includes(item))
  rememberSong()
  renderTracks()
  return { text: "Took the background singers out. Undo brings them back." }
}

// ---------------------------------------------------------------------------
// All of it

async function vocalAll(lead) {
  if (vocal.working || state.transforming) return { text: "Still working on the last one." }
  const mark = undoStack.length
  snapshot([lead.id])
  const said = []
  const steps = [
    () => fitVocal(lead, vocal.fit),
    () => (lead.shine ? null : shineVocal(lead)),
    () => makeRoom(lead),
    () => addSingers(lead, vocal.singers, vocal.where),
  ]
  for (const step of steps) {
    const reply = await step()
    if (reply?.warn) said.push(reply.text)
  }
  undoStack.splice(mark + 1)
  const text = `Your vocal is lined up with the beat, has a studio sound, sits on top of the music, and has background singers${chorusSections().length && vocal.where !== "song" ? " in the choruses" : ""}.${said.length ? ` ${said.join(" ")}` : ""} One Undo takes it all back.`
  return { text }
}

function playFromVocal(layer, at) {
  if (at != null) return play(Math.max(0, at - 1))
  const first = layer.phrases?.[0]?.start ?? layer.range?.start ?? 0
  play(Math.max(0, first - 1))
}

// ---------------------------------------------------------------------------
// Said in Magic

async function vocalRequest(text) {
  // “Less background vocals” is about a part's amount, not your voice.
  if (/\b(less|more|fewer|too much|turn (up|down)|louder|quieter)\b/.test(text)) return null
  if (!/(vocal|voice|singing|my sing|singer|harmon|backing|background (singer|vocal|voice))/.test(text)) return null
  const lead = leadVocal()
  const asksSingers = /(background|backing) (singer|vocal|voice)s?|harmon|double (me|my|the)|octave|choir of me|sing(ers)? with me/.test(text)
  const asksTime = /(timing|on (the )?beat|in time|line (it )?up|fit|sync|late|early|behind|ahead)/.test(text)
  const asksRoom = /(blend|sit|mix|hear (my|the) (voice|vocal)|on top|over the (music|band)|buried|drown|cut through|room for)/.test(text)
  const asksShine = /(enhance|shine|studio|better|professional|polish|clean|clear|improve|pro\b|radio)/.test(text)
  if (!asksSingers && !asksTime && !asksRoom && !asksShine) return null
  // No vocal of yours yet: “add background vocals” still adds a choir.
  if (!lead) return null
  if (asksSingers) {
    const kinds = new Set()
    if (/double/.test(text)) kinds.add("double")
    if (/harmon|third/.test(text)) kinds.add("third")
    if (/octave (below|lower|down|under)|low (octave|voice)|lower octave|deep/.test(text)) kinds.add("low")
    if (/octave (above|higher|up|over)|high (octave|voice)|higher octave/.test(text)) kinds.add("high")
    if (/\boctaves?\b/.test(text) && !kinds.has("low") && !kinds.has("high")) {
      kinds.add("low")
      kinds.add("high")
    }
    const where = /whole song|everywhere|all the way|the whole/.test(text) ? "song" : vocal.where
    return addSingers(lead, kinds.size ? kinds : vocal.singers, where)
  }
  if (asksTime) return fitVocal(lead, /tight|exact|perfect|snap/.test(text) ? "tight" : "gentle")
  if (asksRoom && !asksShine) return makeRoom(lead)
  const shine = lead.shine ? null : await shineVocal(lead)
  const room = await makeRoom(lead)
  return { text: `${shine ? `${shine.text.replace(/ Undo takes it off\.$/, "")} ` : ""}${room.text}` }
}

// ---------------------------------------------------------------------------
// The panel

function vocalCard() {
  const lead = leadVocal()
  if (!lead) return ""
  return `<button class="song-card vocal-card" data-vocal-open="${lead.id}">${ms("record_voice_over")}<span><b>Make my vocal shine</b><small>On the beat, a studio sound, room in the music, and background singers from your voice.</small></span>${ms("arrow_forward")}</button>`
}

function vocalPanel(head) {
  const lead = leadVocal()
  if (!lead) {
    return `${head("Your vocal")}
      <p class="hint">Record yourself singing, then come back here to line it up with the beat, give it a studio sound, and add background singers.</p>
      ${filledButton(`${ms("mic")}Record my vocal`, `data-action="panel" data-panel="record"`)}`
  }
  const busy = vocal.working || state.transforming ? "disabled" : ""
  const takes = vocalTakes()
  const singers = singersOf(lead)
  const hasChorus = chorusSections().length > 0
  const where = vocal.where || (hasChorus ? "chorus" : "song")
  const done = (on) => (on ? `<span class="done-tag">${ms("check")}Done</span>` : "")
  return `${head("Your vocal")}
    ${takes.length > 1 ? `<div class="choices" role="group" aria-label="Which vocal">${takes.map((item) => filterChip(esc(item.name), `data-vocal-pick="${item.id}" ${busy}`, item.id === lead.id)).join("")}</div>` : ""}
    ${filledButton(`${ms("auto_awesome")}${vocal.working ? esc(vocal.working) : "Do it all"}`, `data-vocal-do="all" ${busy}`)}
    <p class="hint">Lines it up with the beat, gives it a studio sound, makes room in the music, and adds background singers. One Undo takes it all back.</p>
    <p class="hint vocal-note" id="vocal-note" role="status">${esc(vocal.said)}</p>

    <section class="vocal-step">
      <h3 class="magic-h">1. On the beat ${done(lead.tight)}</h3>
      <p class="hint">Moves your whole take to sit with the band, then brings late or early words toward the beat.</p>
      <div class="choices">
        ${filterChip("Gentle, keeps my feel", `data-vocal-fit="gentle" ${busy}`, vocal.fit === "gentle")}
        ${filterChip("Tight", `data-vocal-fit="tight" ${busy}`, vocal.fit === "tight")}
      </div>
      ${outlinedButton(`${ms("timer")}Fit my vocal to the beat`, `data-vocal-do="fit" ${busy}`)}
    </section>

    <section class="vocal-step">
      <h3 class="magic-h">2. Studio sound ${done(lead.shine)}</h3>
      <p class="hint">Hiss and rumble out, clearer words, softer S sounds, and an even level so every word is heard.</p>
      ${outlinedButton(`${ms("wand_stars")}Give it a studio sound`, `data-vocal-do="shine" ${busy || (lead.shine ? "disabled" : "")}`)}
    </section>

    <section class="vocal-step">
      <h3 class="magic-h">3. Sit on top of the music ${done(lead.lead)}</h3>
      <p class="hint">While you sing, the music steps back a little and leaves space where your words are. Your voice is set about as loud as the band.</p>
      ${lead.lead ? outlinedButton(`${ms("close")}Stop making room`, `data-vocal-do="noroom" ${busy}`) : outlinedButton(`${ms("spatial_audio")}Make room for my voice`, `data-vocal-do="room" ${busy}`)}
    </section>

    <section class="vocal-step">
      <h3 class="magic-h">4. Background singers ${done(singers.length)}</h3>
      <p class="hint">Made from your own voice, a little quieter and spread left and right.</p>
      <div class="choices" role="group" aria-label="Singers">
        ${SINGERS.map(([id, label]) => filterChip(label, `data-vocal-singer="${id}" ${busy}`, vocal.singers.has(id))).join("")}
      </div>
      ${hasChorus ? `<div class="choices" role="group" aria-label="Where they sing">
        ${filterChip("In the choruses", `data-vocal-where="chorus" ${busy}`, where === "chorus")}
        ${filterChip("The whole song", `data-vocal-where="song" ${busy}`, where === "song")}
      </div>` : ""}
      ${outlinedButton(`${ms("record_voice_over")}${singers.length ? "Make them again" : "Add background singers"}`, `data-vocal-do="singers" ${busy}`)}
      ${singers.length ? outlinedButton(`${ms("delete")}Take them out`, `data-vocal-do="nosingers" ${busy}`) : ""}
    </section>`
}

function openVocal(id) {
  if (id) {
    vocal.layerId = id
    state.selected = id
  }
  setPanel("vocal")
  renderTracks()
}

async function runVocal(action) {
  const lead = leadVocal()
  if (!lead) return
  if (!vocal.where) vocal.where = chorusSections().length ? "chorus" : "song"
  let reply
  if (action === "all") reply = await vocalAll(lead)
  else if (action === "fit") reply = await fitVocal(lead, vocal.fit)
  else if (action === "shine") reply = await shineVocal(lead)
  else if (action === "room") reply = await makeRoom(lead)
  else if (action === "noroom") reply = noRoom(lead)
  else if (action === "singers") reply = await addSingers(lead, vocal.singers, vocal.where)
  else if (action === "nosingers") reply = removeSingers(lead)
  if (reply?.text) {
    vocalSay(reply.text)
    $("save-status").textContent = reply.text
  }
  renderInspector()
}

document.body.addEventListener("click", (event) => {
  const node = event.target.closest?.("[data-vocal-open],[data-vocal-pick],[data-vocal-do],[data-vocal-fit],[data-vocal-singer],[data-vocal-where]")
  if (!node || node.disabled) return
  const d = node.dataset
  if (d.vocalOpen != null) return openVocal(d.vocalOpen)
  if (d.vocalPick) {
    vocal.layerId = d.vocalPick
    state.selected = d.vocalPick
    renderTracks()
  }
  if (d.vocalFit) vocal.fit = d.vocalFit
  if (d.vocalSinger) {
    if (vocal.singers.has(d.vocalSinger)) vocal.singers.delete(d.vocalSinger)
    else vocal.singers.add(d.vocalSinger)
  }
  if (d.vocalWhere) vocal.where = d.vocalWhere
  if (d.vocalDo) {
    void runVocal(d.vocalDo)
    return
  }
  renderInspector()
})
