// Check your notes: before a recording becomes an instrument, Songbird shows
// the notes and the key it heard. You can pick the right key, move every
// note higher or lower, fix one note by tapping a key, turn a note into a
// chord, or take one out. Then the instrument plays exactly those notes.

const check = {
  mode: "source", // "source": a recording. "played": a part you played on the keys.
  id: null,
  choice: null,
  layerId: null,
  loading: false,
  empty: false,
  melody: [],
  key: { root: 0, minor: false },
  heardKey: null,
  pass: 0,
  total: 0,
  loop: false,
  beat: 0.65,
  phase: 0,
  sel: -1,
  octave: 60,
  withVoice: true,
  hearing: false,
  working: false,
  backTo: "transform",
  start: "",
  rough: false,
  hintsOpen: true,
}
let checkSources = []

function noteName(midi) {
  return KEY_LABEL[((Math.round(midi) % 12) + 12) % 12]
}

function keyName(key) {
  return `${KEY_LABEL[((key.root % 12) + 12) % 12]} ${key.minor ? "minor" : "major"}`
}

function chordName(midi, key) {
  const tones = SongbirdMusic.chordTones(midi, key, midi)
  const third = (tones[1] - tones[0] + 12) % 12
  const fifth = (tones[2] - tones[0] + 12) % 12
  return noteName(midi) + (third === 3 ? (fifth === 6 ? "dim" : "m") : "")
}

// Layers that have notes you can look at.
function hasNotes(layer) {
  if (!layer) return false
  if (playedPart(layer)?.melody) return true
  if (layer.family === "drums" || kindOf(layer) === "drums") return false
  if (layer.notes) return true
  if (isRecording(layer) && buffers.get(layer.id + ":audio")) return true
  return !!(layer.make && layer.make.sourceId && state.layers.some((item) => item.id === layer.make.sourceId))
}

function resetCheck(fields) {
  Object.assign(check, { choice: null, layerId: null, loading: false, empty: false, rough: false, melody: [], sel: -1, hearing: false, working: false }, fields)
}

function centerOctave() {
  if (!check.melody.length) return
  const mids = check.melody.map((note) => note.midi).sort((a, b) => a - b)
  const middle = mids[Math.floor(mids.length / 2)]
  check.octave = Math.max(36, Math.min(84, Math.floor((middle - 2) / 12) * 12))
}

function copyNotes(list) {
  return (list || []).map((note) => ({ ...note, tones: note.tones ? [...note.tones] : undefined }))
}

// Opens the check for a recording. Returns true once the panel is showing.
async function openNoteCheck(source, pending = {}) {
  const audio = sourceAudio(source)
  if (!audio) return false
  stopHearing()
  resetCheck({ mode: "source", id: source.id, choice: pending.choice || null, layerId: pending.layerId || null, backTo: state.panel === "sounds" ? "sounds" : "transform" })
  if (source.notes) {
    Object.assign(check, {
      melody: copyNotes(source.notes.melody),
      key: { ...source.notes.key },
      heardKey: { ...(source.notes.heardKey || source.notes.key) },
      pass: source.notes.pass,
      total: source.notes.total,
      loop: !!source.notes.loop,
      beat: source.notes.beat,
      phase: source.notes.phase || 0,
    })
    tagHints()
    check.start = JSON.stringify(check.melody)
    centerOctave()
    setPanel("notes")
    return true
  }
  check.loading = true
  setPanel("notes")
  try {
    const read = await engine.call("readNotes", samplesOf(audio), audio.sampleRate, { bpm: state.bpm || 92, loopSamples: audio.loopSamples || 0 })
    if (check.id !== source.id) return true
    Object.assign(check, {
      loading: false,
      empty: !read.melody.length,
      rough: !!read.rough,
      melody: read.melody.map((note) => ({ time: note.time, dur: note.dur, midi: note.midi, heard: note.heard })),
      key: { ...read.key },
      heardKey: { ...read.key },
      pass: read.pass,
      total: read.total,
      loop: !!read.loop,
      beat: read.beat,
      phase: read.phase || 0,
    })
    tagHints()
    check.start = JSON.stringify(check.melody)
    centerOctave()
  } catch {
    check.loading = false
    check.empty = true
  }
  if (state.panel === "notes") renderInspector()
  return true
}

// Opens the notes of any layer: a recording, a part made from one, or a
// part you played.
async function openNotesFor(layerId) {
  const layer = state.layers.find((item) => item.id === layerId)
  if (!layer) return
  const played = playedPart(layer)
  if (played?.melody) {
    stopHearing()
    resetCheck({ mode: "played", id: layer.id, backTo: state.panel === "notes" ? check.backTo : state.panel || "mix" })
    Object.assign(check, {
      melody: copyNotes(played.melody),
      key: { ...(played.key || { root: 0, minor: false }) },
      heardKey: { ...(played.key || { root: 0, minor: false }) },
      pass: played.pass,
      total: played.total,
      loop: !!played.loop,
      beat: played.beat || 60 / (state.bpm || 92),
      phase: played.phase || 0,
      withVoice: false,
    })
    tagHints()
    check.start = JSON.stringify(check.melody)
    centerOctave()
    setPanel("notes")
    return
  }
  const source = isRecording(layer) ? layer : state.layers.find((item) => item.id === layer.make?.sourceId)
  if (!source) return
  const back = state.panel
  await openNoteCheck(source, {})
  check.backTo = back === "notes" ? "transform" : back || "mix"
}

// ---------------------------------------------------------------------------
// Editing

function selectedNote() {
  return check.melody[check.sel] || null
}

function setKey(key) {
  check.key = { root: ((key.root % 12) + 12) % 12, minor: !!key.minor }
  // Notes you haven't fixed by hand are fitted again from what you sang.
  if (check.mode === "source") {
    check.melody = check.melody.map((note) => (note.heard == null || note.set ? note : { ...note, midi: SongbirdMusic.inKey(note.heard, check.key) }))
  }
}

function moveAll(steps) {
  check.melody = check.melody.map((note) => ({ ...note, midi: note.midi + steps, heard: note.heard == null ? note.heard : note.heard + steps }))
  check.key = { ...check.key, root: (check.key.root + steps + 12) % 12 }
  if (check.heardKey) check.heardKey = { ...check.heardKey, root: (check.heardKey.root + steps + 12) % 12 }
  check.octave = Math.max(36, Math.min(84, check.octave + (Math.abs(steps) === 12 ? steps : 0)))
}

function setNote(index, midi) {
  const note = check.melody[index]
  if (!note) return
  check.melody[index] = { ...note, midi, set: true }
}

function changed() {
  return JSON.stringify(check.melody) !== check.start
}

// ---------------------------------------------------------------------------
// What might be off: Songbird's guesses, each shown as what it is and
// what it could be, so you pick.

// Guesses are found once, when the notes are read, and stay with their
// note, so you can flip between the two choices.
function tagHints() {
  const notes = check.melody
  notes.forEach((note, index) => {
    delete note.hint
    if (note.chord || note.tones) return
    const prev = notes[index - 1]
    const next = notes[index + 1]
    const around = [prev, next].filter((item) => item && !(item.chord || item.tones)).map((item) => item.midi)
    if (around.length) {
      const near = around.reduce((a, b) => a + b, 0) / around.length
      const gap = note.midi - near
      if (Math.abs(gap) >= 9 && around.every((midi) => Math.abs(note.midi - midi) >= 7)) {
        note.hint = { kind: "octave", from: note.midi, alt: note.midi + (gap > 0 ? -12 : 12), up: gap > 0 }
        return
      }
    }
    if (note.dur < 0.16 && prev && next && note.midi !== prev.midi && note.midi !== next.midi) note.hint = { kind: "short" }
  })
}

function noteHints() {
  const hints = []
  check.melody.forEach((note, index) => {
    if (note.chord || note.tones) return
    // You sang a note outside the key: it plays the key's note next to it.
    if (check.mode === "source" && note.heard != null && !note.hint) {
      const fits = SongbirdMusic.inKey(note.heard, check.key)
      if (fits !== note.heard && Math.abs(fits - note.heard) < 3) {
        hints.push({
          index, kind: "key",
          why: `You sang ${noteName(note.heard)}. ${noteName(fits)} fits ${keyName(check.key)}.`,
          options: [{ midi: note.heard, label: `As sung: ${noteName(note.heard)}` }, { midi: fits, label: `Fits the key: ${noteName(fits)}`, suggested: true }],
        })
        return
      }
    }
    if (note.hint?.kind === "octave") {
      const { from, alt, up } = note.hint
      hints.push({
        index, kind: "octave",
        why: `It jumps ${up ? "up" : "down"} a long way from the notes around it. It may be the same note, ${up ? "lower" : "higher"}.`,
        options: [{ midi: from, label: `As heard: ${noteName(from)}${octaveOf(from)}` }, { midi: alt, label: `${up ? "Lower" : "Higher"}: ${noteName(alt)}${octaveOf(alt)}`, suggested: true }],
      })
    }
    if (note.hint?.kind === "short") {
      hints.push({
        index, kind: "short",
        why: "It's very short, between two other notes. It may be your voice sliding, not a note.",
        options: [{ midi: note.midi, label: `Keep ${noteName(note.midi)}` }, { remove: true, label: "Take it out", suggested: true }],
      })
    }
  })
  return hints
}

function octaveOf(midi) {
  return Math.floor(midi / 12) - 1
}

// Two keys on a small keyboard: what it is now, and the other choice.
function hintKeys(now, other) {
  const lo = Math.min(now, other ?? now)
  const hi = Math.max(now, other ?? now)
  const WHITE = [0, 2, 4, 5, 7, 9, 11]
  let from = lo - 2
  while (!WHITE.includes(((from % 12) + 12) % 12)) from--
  let whites = 0
  for (let midi = from; midi <= hi + 2; midi++) if (WHITE.includes(((midi % 12) + 12) % 12)) whites++
  return keyboardMarkup(from, Math.max(6, whites), "data-hint-key", { key: check.key, marks: { [now]: "is", ...(other != null && other !== now ? { [other]: "could" } : {}) } })
}

function hintsMarkup(busy) {
  const hints = noteHints()
  if (!hints.length) return check.melody.length ? `<p class="hint hint-clear">${ms("check_circle")}Nothing looks off to me. Tap any note to change it.</p>` : ""
  const rows = hints.map((hint) => {
    const note = check.melody[hint.index]
    const others = hint.options.filter((option) => option.midi !== note.midi && !option.remove)
    const other = others.find((option) => option.suggested) || others[0] || null
    return `<li class="hint-row ${hint.index === check.sel ? "on" : ""}">
      <button class="hint-head" data-check-note="${hint.index}">
        <b>Note ${hint.index + 1}</b><span>${esc(hint.why)}</span>
      </button>
      ${hintKeys(note.midi, other ? other.midi : null)}
      <div class="hint-legend"><span class="dot is"></span>Now: ${esc(noteName(note.midi))}${other ? `<span class="dot could"></span>Could be: ${esc(noteName(other.midi))}` : ""}</div>
      <div class="choices">${hint.options.map((option) => {
        const on = option.remove ? false : option.midi === note.midi && (hint.kind !== "short")
        return `<button class="chip ${on ? "on" : ""}" data-hint-pick="${hint.index}" ${option.remove ? `data-hint-remove="1"` : `data-hint-midi="${option.midi}"`} aria-pressed="${on}" ${busy}>${esc(option.label)}${option.suggested ? " · suggested" : ""}</button>`
      }).join("")}</div>
    </li>`
  }).join("")
  const open = hints.filter((hint) => hint.options.some((option) => option.suggested && (option.remove || option.midi !== check.melody[hint.index].midi)))
  return `<section class="note-hints">
    <div class="hints-top">
      <h3 class="magic-h">${ms("lightbulb")}${hints.length === 1 ? "1 note might be off" : `${hints.length} notes might be off`}</h3>
      ${open.length ? `<button class="btn btn-secondary" data-check="hints-all" ${busy}>Use all suggestions</button>` : ""}
    </div>
    <p class="hint">Each shows the note now, and what it could be. Tap the one you mean. Marked notes in the picture above have a dot.</p>
    <ol class="hint-list">${rows}</ol>
  </section>`
}

// ---------------------------------------------------------------------------
// Hearing it

let hearSources = []

function stopHearing() {
  for (const source of hearSources) {
    try { source.stop() } catch { /* done */ }
  }
  hearSources = []
  if (check.hearing) {
    check.hearing = false
    if (state.panel === "notes") renderInspector()
  }
}

async function hearNotes() {
  if (check.hearing) {
    stopHearing()
    return
  }
  if (playing) stopPlayback()
  check.hearing = true
  renderInspector()
  try {
    const instrument = check.choice && check.choice.family !== "drums" ? check.choice.instrument : check.mode === "played" ? state.layers.find((item) => item.id === check.id)?.make?.instrument || "grand-piano" : "grand-piano"
    const info = instrumentInfo(instrument)
    const plan = SongbirdMusic.planFromNotes(check.melody, {
      key: check.key,
      pass: check.pass,
      total: check.pass,
      loop: false,
      beat: check.beat,
      phase: check.phase,
      figure: "solo",
      touch: info?.strum ? "strum" : "played",
      low: info?.low,
      high: info?.high,
    })
    if (plan.error) throw new Error(plan.error)
    const body = await SongbirdSampler.render(plan, { instrument, seconds: check.pass, decodeWith: ac() })
    if (!check.hearing) return
    const ctx = ac()
    const when = ctx.currentTime + 0.08
    const notesSource = ctx.createBufferSource()
    notesSource.buffer = audioBuffer(body, SongbirdSampler.RATE)
    const notesGain = ctx.createGain()
    notesGain.gain.value = 0.8
    notesSource.connect(notesGain)
    notesGain.connect(ctx.destination)
    notesSource.start(when)
    hearSources = [notesSource]
    const source = check.mode === "source" ? state.layers.find((item) => item.id === check.id) : null
    const voice = source ? sourceAudio(source) : null
    if (voice && check.withVoice) {
      const take = ctx.createBufferSource()
      take.buffer = voice
      const gain = ctx.createGain()
      gain.gain.value = 0.55
      take.connect(gain)
      gain.connect(ctx.destination)
      take.start(when, 0, check.pass)
      hearSources.push(take)
    }
    notesSource.onended = () => {
      if (hearSources[0] === notesSource) stopHearing()
    }
  } catch {
    check.hearing = false
    $("save-status").textContent = "That didn't play. Check the connection and try again."
    renderInspector()
  }
}

function checkPreview(midi) {
  void SongbirdSampler.playNote(ac(), ac().destination, "grand-piano", midi, 0.8).then((voice) => {
    if (voice) window.setTimeout(() => voice.stop(), 450)
  }).catch(() => {})
}

// ---------------------------------------------------------------------------
// Done

async function confirmNotes() {
  if (check.working) return
  stopHearing()
  check.working = true
  renderInspector()
  const melody = check.melody.map(({ time, dur, midi, heard, chord, tones, set }) => {
    const note = { time, dur, midi }
    if (heard != null) note.heard = heard
    if (chord) note.chord = true
    if (tones) note.tones = tones
    if (set) note.set = true
    return note
  })
  const key = { root: check.key.root, minor: check.key.minor }
  let text = ""
  let warn = false
  try {
    if (check.mode === "played") {
      const layer = state.layers.find((item) => item.id === check.id)
      if (layer) {
        const reply = await makePart({ ...layer.make, melody, key }, { layer, checked: true })
        text = reply.text
        warn = !!reply.warn
        if (!warn) text = `Your notes are in ${layer.name}. Undo takes it back.`
      }
    } else {
      const source = state.layers.find((item) => item.id === check.id)
      if (!source) return
      snapshot()
      source.notes = { melody, key, heardKey: check.heardKey, pass: check.pass, total: check.total, loop: check.loop, beat: check.beat, phase: check.phase }
      rememberSong()
      if (check.choice) {
        const target = state.layers.find((item) => item.id === check.layerId) || null
        const reply = await makePart(check.choice, { layer: target, source, checked: true })
        text = reply.text
        warn = !!reply.warn
      } else {
        const followers = state.layers.filter((layer) => layer.make && layer.make.sourceId === source.id && layer.family !== "drums")
        for (const layer of followers) {
          const reply = await makePart(layer.make, { layer, source, checked: true })
          if (reply.warn) {
            text = reply.text
            warn = true
          }
        }
        if (!warn) {
          text = followers.length
            ? `Updated ${followers.map((layer) => layer.name).join(" and ")} with your notes.`
            : `Notes saved for ${source.name}. Any instrument you make from it will play these notes.`
        }
      }
    }
  } catch {
    text = "That didn't work. Nothing changed."
    warn = true
  } finally {
    check.working = false
  }
  state.magicChat.push({ you: "My notes look good", did: text, warn })
  $("save-status").textContent = text
  setPanel(check.backTo === "notes" ? "transform" : check.backTo || "transform")
  renderTracks()
}

// ---------------------------------------------------------------------------
// What you see

function keyboardMarkup(from, whites, attr, options = {}) {
  const WHITE = [0, 2, 4, 5, 7, 9, 11]
  const keys = []
  let w = 0
  for (let midi = from; w < whites; midi++) {
    const pc = ((midi % 12) + 12) % 12
    const white = WHITE.includes(pc)
    const inKey = options.key ? SongbirdMusic.inKey(midi, options.key) === midi : false
    const mark = options.marks?.[midi]
    const cls = [white ? "white" : "black", inKey ? "in-key" : "", options.active?.has(midi) ? "on" : "", mark ? `mark-${mark}` : ""].join(" ")
    const label = white || mark ? `<span>${noteName(midi)}${(pc === 0 && options.octaves) || mark ? `<sub>${Math.floor(midi / 12) - 1}</sub>` : ""}</span>` : ""
    const style = white ? "" : ` style="left:${((w / whites) * 100).toFixed(3)}%"`
    keys.push(`<button class="key ${cls}" ${attr}="${midi}" aria-label="${noteName(midi)}"${style}>${label}</button>`)
    if (white) w++
  }
  return `<div class="keys" style="--whites:${whites}">${keys.join("")}</div>`
}

function rollMarkup() {
  const notes = check.melody
  const maybe = new Set(noteHints().map((hint) => hint.index))
  const mids = notes.flatMap((note) => [note.midi, note.chord || note.tones ? note.midi + 7 : note.midi])
  let lo = Math.min(...mids) - 2
  let hi = Math.max(...mids) + 2
  if (hi - lo < 12) {
    const pad = Math.ceil((12 - (hi - lo)) / 2)
    lo -= pad
    hi += pad
  }
  const rows = hi - lo + 1
  const pass = Math.max(0.5, check.pass)
  const beats = Math.round(pass / check.beat)
  const lines = Array.from({ length: Math.max(0, beats - 1) }, (_, i) => {
    const t = check.phase + (i + 1) * check.beat
    return t > 0 && t < pass ? `<i class="${(i + 1) % 4 === 0 ? "bar" : ""}" style="left:${((t / pass) * 100).toFixed(2)}%"></i>` : ""
  }).join("")
  const blocks = notes.map((note, i) => {
    const left = (note.time / pass) * 100
    const width = Math.max(1.2, (Math.min(note.dur, pass - note.time) / pass) * 100)
    const bottom = ((note.midi - lo) / rows) * 100
    const chord = note.chord || note.tones
    const label = chord ? chordName(note.midi, check.key) : noteName(note.midi)
    return `<button class="roll-note ${i === check.sel ? "on" : ""} ${chord ? "chord" : ""} ${note.set ? "fixed" : ""} ${maybe.has(i) ? "maybe" : ""}" data-check-note="${i}" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%;bottom:${bottom.toFixed(2)}%;height:${(100 / rows).toFixed(2)}%" aria-label="Note ${i + 1}, ${label}${chord ? " chord" : ""}">${label}</button>`
  }).join("")
  return `<div class="roll-scroll"><div class="roll" style="min-width:max(100%, ${notes.length * 30}px)"><div class="roll-beats">${lines}</div>${blocks}</div></div>`
}

function noteCheckPanel(head) {
  const source = state.layers.find((item) => item.id === check.id)
  if (!source) return `${head("Check your notes")}<p class="empty">That sound isn't in the song anymore.</p>`
  const busy = check.working ? "disabled" : ""
  if (check.loading) {
    return `${head("Check your notes")}
      <div class="check-loading">${ms("graphic_eq")}<p>Listening for the notes in ${esc(source.name)}…</p></div>`
  }
  if (check.empty) {
    return `${head("Check your notes")}
      <p class="hint">I couldn't hear clear notes in ${esc(source.name)}. Humming each note a bit longer and clearer helps.</p>
      <div class="row">
        ${filledButton(`${ms("piano")}Play it on the keys instead`, `data-check="play-instead"`)}
        ${outlinedButton(`${ms("mic")}Record again`, `data-check="record-again"`)}
      </div>`
  }
  const note = selectedNote()
  const making = check.choice ? partName(check.choice) : ""
  const active = new Set(note ? [note.midi] : [])
  const chordOn = note && (note.chord || note.tones)
  return `${head("Check your notes")}
    <p class="hint">${check.mode === "played"
      ? `These are the notes you played in <b>${esc(source.name)}</b>. Tap a note to fix it.`
      : `Here are the notes I heard in <b>${esc(source.name)}</b>${making ? `, before I make ${esc(making)}` : ""}. Tap a note to fix it. When it sounds right, tap <b>Looks good</b>.`}</p>
    ${check.rough ? `<p class="hint warn-text">${ms("hearing")}It was hard to hear clear notes, so these are my best guesses. Check them, and fix any that are wrong.</p>` : ""}
    <div class="check-key">
      <div>
        <p class="ask">Key</p>
        <div class="key-pick">
          ${iconButton("chevron_left", `data-check="key-down" aria-label="Previous key" ${busy}`)}
          <b class="key-now">${esc(keyName(check.key))}</b>
          ${iconButton("chevron_right", `data-check="key-up" aria-label="Next key" ${busy}`)}
          ${filterChip(check.key.minor ? "Make it major" : "Make it minor", `data-check="key-mode" ${busy}`, false)}
        </div>
        <p class="hint">${check.heardKey && (check.heardKey.root !== check.key.root || check.heardKey.minor !== check.key.minor) ? `I heard ${esc(keyName(check.heardKey))}. ` : ""}Not your key? Use the arrows. The notes follow.</p>
      </div>
      <div>
        <p class="ask">Move every note</p>
        <div class="row tight">
          ${outlinedButton(`${ms("arrow_downward")}Lower`, `data-check="all-down" ${busy}`)}
          ${outlinedButton(`${ms("arrow_upward")}Higher`, `data-check="all-up" ${busy}`)}
        </div>
      </div>
    </div>
    ${rollMarkup()}
    ${hintsMarkup(busy)}
    <div class="note-tools ${note ? "" : "idle"}">
      ${note
        ? `<p class="note-now"><b>${esc(chordOn ? `${chordName(note.midi, check.key)} chord` : noteName(note.midi))}</b> · note ${check.sel + 1} of ${check.melody.length}</p>
          <div class="row tight">
            ${iconButton("arrow_downward", `data-check="note-down" aria-label="Lower this note" title="Lower" ${busy}`)}
            ${iconButton("arrow_upward", `data-check="note-up" aria-label="Raise this note" title="Higher" ${busy}`)}
            ${filterChip(chordOn ? "Chord" : "Make it a chord", `data-check="note-chord" aria-pressed="${chordOn ? "true" : "false"}" ${busy}`, !!chordOn)}
            ${iconButton("delete", `data-check="note-delete" aria-label="Take this note out" title="Take out" ${busy}`)}
          </div>
          <p class="hint">Or tap a key below to make it that note.</p>`
        : `<p class="hint">Tap a note above to change it. Tap the keys to hear them.</p>`}
    </div>
    <div class="check-keys">
      ${iconButton("chevron_left", `data-check="oct-down" aria-label="Lower keys" ${busy}`)}
      ${keyboardMarkup(check.octave, 10, "data-check-key", { key: check.key, active, octaves: true })}
      ${iconButton("chevron_right", `data-check="oct-up" aria-label="Higher keys" ${busy}`)}
    </div>
    <div class="choices">
      ${filterChip("Every note a chord", `data-check="all-chords" ${busy}`, check.melody.length > 0 && check.melody.every((item) => item.chord || item.tones))}
      ${check.mode === "source" ? filterChip("With my voice", `data-check="with-voice" ${busy}`, check.withVoice) : ""}
    </div>
    <div class="browse-bar">
      <div class="browse-actions">
        ${outlinedButton(check.hearing ? `${ms("stop")}Stop` : `${ms("play_arrow")}Hear the notes`, `data-check="hear" ${busy}`)}
        ${filledButton(check.working ? "Working…" : `${ms("check")}Looks good`, `data-check="done" ${busy} ${check.melody.length ? "" : "disabled"}`)}
      </div>
      ${changed() ? `<button class="text-btn" data-check="reset" ${busy}>${ms("restart_alt")}Start over</button>` : ""}
    </div>`
}

// ---------------------------------------------------------------------------
// Taps

document.body.addEventListener("click", (event) => {
  const node = event.target.closest?.("[data-check],[data-check-note],[data-notes-open],[data-hint-pick]")
  if (!node || node.disabled) return
  const d = node.dataset
  if (d.notesOpen) {
    void openNotesFor(d.notesOpen)
    return
  }
  if (d.hintPick != null) {
    const index = Number(d.hintPick)
    if (d.hintRemove) {
      check.melody.splice(index, 1)
      check.sel = -1
    } else {
      setNote(index, Number(d.hintMidi))
      check.sel = index
      checkPreview(Number(d.hintMidi))
    }
    if (check.hearing) stopHearing()
    renderInspector()
    return
  }
  if (d.checkNote != null) {
    const index = Number(d.checkNote)
    check.sel = check.sel === index ? -1 : index
    const note = selectedNote()
    if (note) {
      if (note.midi < check.octave || note.midi > check.octave + 16) check.octave = Math.max(36, Math.min(84, Math.floor((note.midi - 2) / 12) * 12))
      checkPreview(note.midi)
    }
    renderInspector()
    return
  }
  const what = d.check
  const note = selectedNote()
  if (what === "key-up" || what === "key-down") setKey({ ...check.key, root: check.key.root + (what === "key-up" ? 1 : -1) })
  if (what === "key-mode") setKey({ ...check.key, minor: !check.key.minor })
  if (what === "all-up") moveAll(1)
  if (what === "all-down") moveAll(-1)
  if (what === "oct-up") check.octave = Math.min(84, check.octave + 12)
  if (what === "oct-down") check.octave = Math.max(24, check.octave - 12)
  if ((what === "note-up" || what === "note-down") && note) {
    setNote(check.sel, note.midi + (what === "note-up" ? 1 : -1))
    checkPreview(selectedNote().midi)
  }
  if (what === "note-chord" && note) {
    const on = note.chord || note.tones
    const next = { ...note }
    delete next.tones
    if (on) delete next.chord
    else next.chord = true
    check.melody[check.sel] = next
  }
  if (what === "note-delete" && note) {
    check.melody.splice(check.sel, 1)
    check.sel = -1
  }
  if (what === "all-chords") {
    const all = check.melody.every((item) => item.chord || item.tones)
    check.melody = check.melody.map((item) => {
      const next = { ...item }
      if (all) {
        delete next.chord
        delete next.tones
      } else if (!next.tones) next.chord = true
      return next
    })
  }
  if (what === "with-voice") check.withVoice = !check.withVoice
  if (what === "hints-all") {
    const hints = noteHints()
    const drop = []
    for (const hint of hints) {
      const pick = hint.options.find((option) => option.suggested)
      if (!pick) continue
      if (pick.remove) drop.push(hint.index)
      else setNote(hint.index, pick.midi)
    }
    for (const index of drop.sort((a, b) => b - a)) check.melody.splice(index, 1)
    check.sel = -1
  }
  if (what === "reset") {
    check.melody = JSON.parse(check.start)
    if (check.heardKey) check.key = { ...check.heardKey }
    check.sel = -1
  }
  if (what === "hear") {
    void hearNotes()
    return
  }
  if (what === "done") {
    void confirmNotes()
    return
  }
  if (what === "play-instead") {
    state.recordMode = "play"
    pad.kind = "piano"
    setPanel("record")
    warmPad()
    return
  }
  if (what === "record-again") {
    state.recordMode = "mic"
    setPanel("record")
    return
  }
  if (check.hearing && what !== "with-voice") stopHearing()
  renderInspector()
})

// Keys in the note check: set the selected note, or just hear the key.
document.body.addEventListener("pointerdown", (event) => {
  const node = event.target.closest?.("[data-check-key]")
  if (!node || node.disabled) return
  event.preventDefault()
  const midi = Number(node.dataset.checkKey)
  checkPreview(midi)
  if (selectedNote()) {
    setNote(check.sel, midi)
    renderInspector()
  } else {
    node.classList.add("on")
    window.setTimeout(() => node.classList.remove("on"), 220)
  }
})

// The small keyboards next to a guess: tap to hear a key.
document.body.addEventListener("pointerdown", (event) => {
  const node = event.target.closest?.("[data-hint-key]")
  if (!node) return
  event.preventDefault()
  checkPreview(Number(node.dataset.hintKey))
})
