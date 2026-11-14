// The sound browser: every instrument, every way to play it, and every era,
// one clear step at a time. Listen first, then add it, or change a sound
// that's already in the song.

const SOUND_BLURBS = {
  "grand-piano": "Big concert piano", "electric-piano": "Soft, warm keys", organ: "Church and gospel organ", "church-organ": "Huge pipe organ",
  harpsichord: "Old royal keyboard", "steel-guitar": "Strummy campfire guitar", "nylon-guitar": "Soft Spanish guitar",
  "clean-guitar": "Bright electric guitar", "jazz-guitar": "Smooth and mellow", "rock-guitar": "Loud and crunchy", banjo: "Twangy and bright",
  bass: "Deep electric bass", "upright-bass": "Tall wooden jazz bass", "synth-bass": "Big electronic bass",
  violin: "Sweet and singing", cello: "Low and warm", strings: "A whole orchestra section", pizzicato: "Plucked strings, bouncy", harp: "Sparkly and dreamy",
  trumpet: "Bright and bold, a real trumpet", trombone: "Low and slidey", "french-horn": "Round and noble", tuba: "Big oom-pah bass, like a marching band", "alto-sax": "Smooth and soulful", "tenor-sax": "Deep and bluesy",
  "brass-section": "Trumpets and trombones together", flute: "Light and airy", clarinet: "Woody and warm", oboe: "Sweet and nasal",
  "choir-aahs": "A big choir singing aah", "voice-oohs": "One voice singing ooh", marimba: "Wooden and bouncy", vibraphone: "Shimmery jazz bells",
  "music-box": "Tiny and twinkly", bells: "Church bells and chimes", "steel-drums": "Island sunshine", kalimba: "Thumb piano, plinky",
  sitar: "Buzzing Indian strings", koto: "Plucked Japanese strings", "warm-pad": "Soft glowing background", "synth-lead": "Bright video-game lead",
}
const KIT_BLURBS = { standard: "Clean and punchy", room: "Big and live", power: "Loud rock drums", jazz: "Light and swingy", brush: "Soft brushes", electronic: "Drum machine", "808": "Hip-hop boom" }
const SINGLE_BLURBS = { kick: "Boom", snare: "Crack", clap: "Hand clap", rim: "Click", tambourine: "Jingly", shaker: "Shh-shh", conga: "Tall hand drum", "high-bongo": "Little hand drums", cowbell: "Tonk", woodblock: "Tock", claves: "Wooden click" }
const PLAY_WORDS = {
  solo: ["Plays your tune", "The same notes you sang"],
  chords: ["Chords under it", "Backs your tune up, like a band"],
  section: ["A group in harmony", "Your tune plus two more parts"],
  bass: ["Low notes on the beat", "Holds the bottom of the song"],
}
const RHYTHM_WORDS = { played: "Like you sang it", beat: "On every beat", strum: "Strummed" }
const ERA_WORDS = {
  today: ["Today", "Clean and crisp"], "2000": ["2000s", "Polished pop"], "1990": ["’90s", "Warm and punchy"],
  "1980": ["’80s", "Bright and shiny"], "1970": ["’70s", "Warm and roomy"], "1960": ["’60s", "Vintage soul"],
  "1950": ["’50s", "Old radio"], "1920": ["1920s", "Old jazz record"], "1900": ["1900s", "Antique parlor"],
}

const browse = { mode: "add", target: null, follow: null, era: "today" }

function recordingsWithSound() {
  return state.layers.filter((layer) => buffers.get(layer.id + ":audio") && isRecording(layer))
}

// Open the browser: to add a new sound, or to change one that's there.
function openBrowser(targetId) {
  const target = targetId ? state.layers.find((layer) => layer.id === targetId) : null
  browse.mode = target ? "change" : "add"
  browse.target = target ? target.id : null
  browse.era = target?.make?.era || state.era || "today"
  if (target?.make) {
    // Start from what it is now.
    Object.assign(pick, { family: target.make.family, instrument: target.make.instrument || pick.instrument, play: target.make.play || pick.play, rhythm: target.make.rhythm || "played", drums: target.make.drums || "kit", kit: target.make.kit || "standard", single: target.make.single || "clap" })
  }
  const lead = target && isRecording(target) ? target : melodyLayer()
  browse.follow = lead ? lead.id : null
  browse.note = ""
  setPanel("sounds")
  // Start at step 1, with room to see the choices.
  const sheet = $("inspector")
  if (sheet) sheet.scrollTop = 0
}

function browseChoice() {
  return { ...pick, era: browse.era }
}

function browseSource(choice) {
  const target = state.layers.find((layer) => layer.id === browse.target)
  if (choice.family === "drums") {
    if (target && kindOf(target) === "drums") return isRecording(target) ? target : state.layers.find((layer) => layer.id === target.make?.sourceId) || null
    return null
  }
  const follow = state.layers.find((layer) => layer.id === browse.follow)
  if (follow) return follow
  if (target && !isRecording(target)) return state.layers.find((layer) => layer.id === target.make?.sourceId) || melodyLayer()
  return target || melodyLayer()
}

function choiceSummary(choice) {
  const bits = [partName(choice)]
  if (choice.family !== "drums") bits.push(PLAY_WORDS[choice.play]?.[0].toLowerCase())
  bits.push(ERA_WORDS[choice.era]?.[0] || "Today")
  const follow = choice.family !== "drums" && state.layers.find((layer) => layer.id === browse.follow)
  if (follow && !isRecording(follow)) bits.push(`follows ${follow.name}`)
  return bits.filter(Boolean).join(" · ")
}

function tile(label, blurb, attrs, on, icon) {
  return `<button class="sound-tile ${on ? "on" : ""}" ${attrs}>${icon ? ms(icon) : ""}<b>${esc(label)}</b>${blurb ? `<span>${esc(blurb)}</span>` : ""}</button>`
}

function soundsPanel(head) {
  const busy = state.transforming || browse.listening ? "disabled" : ""
  const target = state.layers.find((layer) => layer.id === browse.target)
  const changing = browse.mode === "change" && target
  const choice = browseChoice()
  const info = instrumentInfo(pick.instrument)
  const plays = pick.family === "drums" ? [] : info?.plays || []
  const recs = recordingsWithSound()
  // Anything with notes can be followed: your recordings, and parts made here.
  const followable = state.layers.filter((layer) => layer.id !== browse.target && buffers.get(layer.id + ":audio") && kindOf(layer) !== "drums" && (isRecording(layer) || layer.played?.melody?.length || layer.make))
    .sort((a, b) => Number(!isRecording(a)) - Number(!isRecording(b)))
  const step = (n, title, body) => `<section class="browse-step"><h3><span class="num">${n}</span>${title}</h3>${body}</section>`
  let n = 0
  const kinds = step(++n, "What kind of sound?", `<div class="family-grid">${FAMILIES.map((item) => `<button class="family ${item.id === pick.family ? "on" : ""}" data-pick-family="${item.id}" ${busy}>${ms(item.icon)}${esc(item.name)}</button>`).join("")}</div>`)
  const which = pick.family === "drums"
    ? step(++n, "Which drums?", `
      <div class="choices seg-choice">
        ${filterChip("Full drum kit", `data-pick-drums="kit" ${busy}`, pick.drums === "kit")}
        ${filterChip("One sound", `data-pick-drums="single" ${busy}`, pick.drums === "single")}
      </div>
      <p class="hint">${pick.drums === "kit" ? "Plays along with your claps or beatbox. With nothing to follow, it plays a groove that fits your song." : "Every clap or tap you made becomes this one sound."}</p>
      <div class="tile-grid">${pick.drums === "kit"
        ? KITS.map((kit) => tile(kit.name, KIT_BLURBS[kit.id], `data-pick-kit="${kit.id}" ${busy}`, pick.kit === kit.id)).join("")
        : SINGLES.map((one) => tile(one.name, SINGLE_BLURBS[one.id], `data-pick-single="${one.id}" ${busy}`, pick.single === one.id)).join("")}</div>`)
    : step(++n, "Which one?", `<div class="tile-grid">${INSTRUMENTS.filter((item) => item.family === pick.family).map((item) => tile(item.name, SOUND_BLURBS[item.id], `data-pick-instrument="${item.id}" ${busy}`, item.id === pick.instrument)).join("")}</div>`)
  const how = pick.family === "drums" ? "" : step(++n, "How should it play?", `
      ${plays.length > 1 ? `<div class="tile-grid">${plays.map((id) => tile(PLAY_WORDS[id][0], PLAY_WORDS[id][1], `data-pick-play="${id}" ${busy}`, pick.play === id)).join("")}</div>` : `<p class="hint">${esc(PLAY_WORDS[plays[0]]?.[0] || "Plays your tune")}.</p>`}
      ${pick.play !== "bass" ? `<p class="ask">Rhythm</p><div class="choices">${RHYTHMS.filter(([id]) => id !== "strum" || (info?.strum && pick.play === "chords")).map(([id]) => filterChip(RHYTHM_WORDS[id], `data-pick-rhythm="${id}" ${busy}`, pick.rhythm === id)).join("")}</div>` : ""}`)
  const when = step(++n, "From what time?", `<div class="era-row">${ERAS.map(([id]) => tile(ERA_WORDS[id][0], ERA_WORDS[id][1], `data-browse-era="${id}" ${busy}`, browse.era === id)).join("")}</div>`)
  const follow = pick.family !== "drums" && followable.length > 1
    ? step(++n, "Play along with", `<p class="hint">It follows the notes of the one you pick: a recording, or a sound made here.</p><div class="choices">${followable.map((layer) => filterChip(`${ms(isRecording(layer) ? "mic" : "wand_stars")}${esc(layer.name)}`, `data-browse-follow="${layer.id}" ${busy}`, browse.follow === layer.id)).join("")}</div>`)
    : ""
  const noTune = pick.family !== "drums" && !recs.length && !state.layers.some((layer) => playedPart(layer)?.melody)
  return `${head(changing ? `Change ${esc(target.name)}` : "Add a sound")}
    <p class="hint">${changing ? "Pick a new instrument, a new way to play, or a different time. Your other sounds stay the same." : "Pick any sound, try it with your song, then add it. Every note lands on the beat and in tune."}</p>
    ${kinds}${which}${how}${when}${follow}
    <div class="browse-bar">
      <p class="browse-summary">${ms(changing ? "swap_horiz" : "music_note")}${esc(choiceSummary(choice))}</p>
      ${noTune ? `<p class="hint warn-text">Record a hum or a song first, so this sound has a tune to play.</p>` : ""}
      <div class="browse-actions">
        ${outlinedButton(browse.listening ? `${ms("graphic_eq")}Playing…` : `${ms("play_arrow")}Listen first`, `data-browse="listen" ${busy} ${noTune ? "disabled" : ""}`)}
        ${filledButton(state.transforming ? "Working…" : changing ? `${ms("check")}Change it` : `${ms("add")}Add it`, `data-browse="add" ${busy} ${noTune ? "disabled" : ""}`)}
      </div>
      ${browse.note ? `<p class="browse-note ${browse.noteWarn ? "warn" : ""}">${ms(browse.noteWarn ? "lightbulb" : "check")}${esc(browse.note)}</p>` : ""}
    </div>`
}

// Listen first: the song plays with the new sound on top, nothing is added.
async function listenFirst() {
  let choice = withPlayed(browseChoice(), state.layers.find((layer) => layer.id === browse.target))
  const source = browseSource(choice)
  if (browse.follow && source?.id === browse.follow) choice = followChoice(choice, source)
  browse.listening = true
  browse.note = ""
  renderInspector()
  try {
    const made = await buildPart(choice, source)
    if (made.error) {
      browse.note = made.error === "no-notes" ? "I couldn't hear a clear tune to follow. Try humming each note a bit more clearly." : "There's no beat to follow yet."
      browse.noteWarn = true
      return
    }
    const ctx = ac()
    const buffer = audioBuffer(made.samples, made.rate)
    const target = state.layers.find((layer) => layer.id === browse.target)
    // While changing a sound, hear the new one in its place.
    const hideId = browse.mode === "change" && target ? target.id : null
    const wasMuted = hideId ? target.mute : false
    if (hideId) target.mute = true
    play(0)
    if (hideId) target.mute = wasMuted
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.value = FAMILY_GAIN[choice.family] ?? 0.5
    src.connect(gain)
    gain.connect(songBus(ctx))
    src.start(ctx.currentTime + 0.01)
    previewSources.push(src)
    browse.note = `That's ${choiceSummary(choice)} with your song. Like it? Tap ${browse.mode === "change" ? "Change it" : "Add it"}.`
    browse.noteWarn = false
  } catch {
    browse.note = "That didn't play. Check the connection and try again."
    browse.noteWarn = true
  } finally {
    browse.listening = false
    renderInspector()
  }
}

async function addFromBrowser() {
  const choice = browseChoice()
  const target = state.layers.find((layer) => layer.id === browse.target)
  stopPlayback()
  const reply = browse.mode === "change" && target
    ? await makePart(choice, { layer: target, source: browseSource(choice), follow: !!browse.follow && browseSource(choice)?.id === browse.follow })
    : await makePart(choice, choice.family === "drums" ? {} : { source: browseSource(choice), follow: !!browse.follow && browseSource(choice)?.id === browse.follow })
  browse.note = reply.text
  browse.noteWarn = !!reply.warn
  state.magicChat.push({ you: `${browse.mode === "change" ? "Change to" : "Add"} ${choiceSummary(choice)}`, did: reply.text, warn: !!reply.warn })
  if (typeof guide !== "undefined" && !reply.warn) {
    guide.reply = reply.text
    guide.replyWarn = false
  }
  if (!reply.warn && browse.mode === "change") {
    // Now it is what was picked; keep changing it if they like.
    browse.target = state.selected
  }
  renderInspector()
  if (typeof renderGuide === "function") renderGuide()
}

document.body.addEventListener("click", (event) => {
  const node = event.target.closest?.("[data-browse],[data-browse-era],[data-browse-follow],[data-browse-open]")
  if (!node || node.disabled) return
  const d = node.dataset
  if (d.browseOpen != null) {
    openBrowser(d.browseOpen || null)
    return
  }
  if (d.browseEra) browse.era = d.browseEra
  if (d.browseFollow) browse.follow = d.browseFollow
  if (d.browse === "listen") {
    void listenFirst()
    return
  }
  if (d.browse === "add") {
    void addFromBrowser()
    return
  }
  browse.note = ""
  renderInspector()
})

// Picking in the browser clears the last note, so it never describes an old choice.
document.body.addEventListener("click", (event) => {
  if (state.panel === "sounds" && event.target.closest?.("[data-pick-family],[data-pick-instrument],[data-pick-play],[data-pick-rhythm],[data-pick-drums],[data-pick-kit],[data-pick-single]")) {
    browse.note = ""
    stopPreview()
  }
}, true)
