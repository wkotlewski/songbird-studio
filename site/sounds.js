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
  browse.bigOnly = false
  delete pick.idea
  delete pick.style
  // A different beat each time you open it, unless you have one recorded.
  const yours = state.layers.some((layer) => isRecording(layer) && buffers.get(layer.id + ":audio"))
  const beats = Object.keys(GROOVES).filter((id) => id !== pick.groove)
  pick.groove = yours ? null : beats[Math.floor(Math.random() * beats.length)]
  delete pick.ownBeat
  browse.grid = null
  pick.ownTune = null
  pick.ownTuneOn = false
  setPanel("sounds")
  // Start at step 1, with room to see the choices.
  const sheet = $("inspector")
  if (sheet) sheet.scrollTop = 0
}

function browseChoice() {
  const choice = { ...pick, era: browse.era }
  delete choice.idea
  delete choice.ownTune
  delete choice.ownTuneFor
  delete choice.ownTuneEdited
  delete choice.ownTuneOn
  if (pick.family !== "drums" && pick.ownTuneOn && pick.ownTune?.some((midi) => midi != null)) Object.assign(choice, tuneNotes(), { ownTune: true })
  // Playing along with the song's chords, not a layer.
  else if (pick.family !== "drums" && browse.follow === "song") Object.assign(choice, backingNotes(), { backing: true })
  return choice
}

// Your own tune: two bars, a note on each beat, picked from the notes of
// the song's key. A note lasts until the next one. Every pitched sound
// can play it: as a tune, as chords under it, or as a bass line.
const TUNE_STEPS = 8

function tuneKey() {
  const backing = songBacking()
  return { root: ((state.songKey ?? backing.root) % 12 + 12) % 12, minor: !!moodOf(backing).minor }
}

function tuneBase() {
  const info = instrumentInfo(pick.instrument)
  const middle = info?.low != null && info?.high != null ? (info.low + info.high) / 2 : 64
  const key = tuneKey()
  let base = 48 + key.root
  while (base + 6 < middle - 3) base += 12
  while (base + 6 > middle + 6) base -= 12
  return base
}

function tuneRows() {
  const key = tuneKey()
  const base = tuneBase()
  return Array.from({ length: 8 }, (_, i) => SongbirdMusic.scaleStep(base, 7 - i, key))
}

function ownTune() {
  if (!pick.ownTune || pick.ownTuneFor !== `${pick.instrument}|${tuneKey().root}`) {
    // Starts from the song's chords: each one's low note, a bar each.
    const key = tuneKey()
    const base = tuneBase()
    const mood = moodOf()
    pick.ownTune = Array(TUNE_STEPS).fill(null)
    pick.ownTune[0] = SongbirdMusic.scaleStep(base, mood.steps[0] || 0, key)
    pick.ownTune[4] = SongbirdMusic.scaleStep(base, mood.steps[1] || 0, key)
    pick.ownTuneFor = `${pick.instrument}|${key.root}`
    pick.ownTuneEdited = false
  }
  return pick.ownTune
}

function tuneNotes() {
  const steps = ownTune()
  const beat = 60 / Math.max(40, state.bpm || 92)
  const pass = beat * TUNE_STEPS
  const melody = []
  steps.forEach((midi, i) => {
    if (midi == null) return
    let next = i + 1
    while (next < steps.length && steps[next] == null) next++
    melody.push({ time: i * beat, dur: (next - i) * beat * 0.95, midi })
  })
  const total = Math.max(state.lengthSec || pass, pass)
  return { melody, key: tuneKey(), pass, total, loop: total > pass + 0.01, beat, phase: 0 }
}

function tuneMaker(busy) {
  const rows = tuneRows()
  const steps = ownTune()
  const count = ["1", "2", "3", "4", "1", "2", "3", "4"]
  return `<p class="hint">Tap a square to play that note on that beat; tap it again to take it out. A note lasts until the next one. It loops through the song.</p>
    <div class="beat-grid tune-grid" role="grid" aria-label="Your tune">
      <span></span>${count.map((c, i) => `<span class="beat-count">${i === 4 ? `<b>${c}</b>` : c}</span>`).join("")}
      ${rows.map((midi) => `<span class="beat-row-name">${esc(noteName(midi))}${midi % 12 === tuneKey().root ? " ·" : ""}</span>${steps.map((on, step) => `<button class="beat-cell ${on === midi ? "on" : ""} ${step % 4 ? "" : "down"}" data-tune-cell="${midi}:${step}" aria-pressed="${on === midi}" aria-label="${esc(noteName(midi))} on beat ${count[step]}" ${busy}></button>`).join("")}`).join("")}
    </div>
    <div class="choices">${filterChip(`${ms("play_arrow")}Hear it`, `data-tune-hear ${busy}`)}${pick.ownTuneEdited ? filterChip(`${ms("restart_alt")}Start again`, `data-tune-reset ${busy}`) : ""}${pick.ownTuneOn ? filterChip(`${ms("close")}Don't use my tune`, `data-tune-off ${busy}`) : ""}</div>`
}

// Ideas for each kind of sound: Songbird writes the part from your song
// (its tune, or chords in its key), so you don't have to play anything.
const SOUND_IDEAS = {
  strings: [
    { id: "pad", name: "Long held chords", line: "Soft and wide, under the whole song.", play: "chords", rhythm: "played", style: "held" },
    { id: "swell", name: "Swells in the big parts", line: "Held chords that come in for the choruses.", play: "chords", rhythm: "played", style: "held", bigOnly: true },
    { id: "pulse", name: "Short notes on the beat", line: "Busy and driving, like a film score.", play: "chords", rhythm: "beat", style: "beat" },
    { id: "tune", name: "Strings play your tune", line: "Your melody, on strings.", play: "solo", rhythm: "played", needsTune: true },
  ],
  keys: [
    { id: "soft", name: "Soft chords", line: "One chord at a time, under everything.", play: "chords", rhythm: "played", style: "block" },
    { id: "beat", name: "Chords on every beat", line: "Steady, like a pop piano.", play: "chords", rhythm: "beat", style: "beat" },
    { id: "big", name: "Chords in the big parts", line: "Comes in for the choruses.", play: "chords", rhythm: "played", style: "block", bigOnly: true },
    { id: "tune", name: "Plays your tune", line: "Your melody, on keys.", play: "solo", rhythm: "played", needsTune: true },
  ],
  guitar: [
    { id: "strum", name: "Strummed chords", line: "A relaxed strum through the song.", play: "chords", rhythm: "strum", style: "strum" },
    { id: "beat", name: "Picked on the beat", line: "Clean and steady.", play: "chords", rhythm: "beat", style: "beat" },
    { id: "tune", name: "A lead line", line: "Your melody, on guitar.", play: "solo", rhythm: "played", needsTune: true },
  ],
  bass: [
    { id: "root", name: "Root notes", line: "The low note of each chord.", play: "bass", rhythm: "played" },
    { id: "beat", name: "On every beat", line: "Pushes the song along.", play: "bass", rhythm: "beat" },
  ],
  horns: [
    { id: "stab", name: "Punchy hits", line: "Short, bright chords, like a funk band.", play: "chords", rhythm: "played", style: "stab" },
    { id: "big", name: "Hits in the big parts", line: "Saves them for the choruses.", play: "chords", rhythm: "played", style: "stab", bigOnly: true },
    { id: "pad", name: "Long warm notes", line: "Held chords, soft and round.", play: "chords", rhythm: "played", style: "held" },
  ],
  voices: [
    { id: "oohs", name: "Oohs under the song", line: "Soft voices holding the chords.", play: "chords", rhythm: "played", style: "held" },
    { id: "big", name: "A choir in the big parts", line: "Voices that lift the choruses.", play: "chords", rhythm: "played", style: "held", bigOnly: true },
    { id: "tune", name: "Sing your tune in harmony", line: "Your melody plus two more parts.", play: "section", rhythm: "played", needsTune: true },
  ],
  synths: [
    { id: "pad", name: "A warm pad", line: "A soft bed of sound under the song.", play: "chords", rhythm: "played", style: "held" },
    { id: "pulse", name: "Pulses on the beat", line: "Electronic and driving.", play: "chords", rhythm: "beat", style: "beat" },
    { id: "tune", name: "Plays your tune", line: "Your melody, on a synth.", play: "solo", rhythm: "played", needsTune: true },
  ],
  woodwinds: [
    { id: "pad", name: "Soft held chords", line: "Gentle and airy.", play: "chords", rhythm: "played", style: "held" },
    { id: "tune", name: "Plays your tune", line: "Your melody, on woodwinds.", play: "solo", rhythm: "played", needsTune: true },
  ],
}

function hasTune() {
  return state.layers.some((layer) => buffers.get(layer.id + ":audio") && kindOf(layer) !== "drums" && (isRecording(layer) || layer.played?.melody?.length || playedPart(layer)?.melody))
}

// What an idea will be built from, in a few words.
function ideaBasis() {
  const follow = state.layers.find((layer) => layer.id === browse.follow)
  if (follow && !follow.make?.backing && (isRecording(follow) ? hasTune() : true)) return `Fits ${follow.name}`
  return `${moodOf().name} chords: ${chordNames()}`
}

// Written from the song's chords (no tune to follow): pick them here.
function usesSongChords() {
  const follow = state.layers.find((layer) => layer.id === browse.follow)
  return !follow || !hasTune() || !!follow.make?.backing
}

// How it plays: ideas first (Songbird writes the part from your song),
// with the detailed settings tucked under them.
function howStep(n, busy, plays, info) {
  const family = INSTRUMENTS.filter((item) => item.family === pick.family)
  const ideas = (SOUND_IDEAS[pick.family] || SOUND_IDEAS.keys).filter((idea) => (!idea.needsTune || hasTune()) && family.some((item) => item.plays.includes(idea.play)))
  const settings = `${plays.length > 1 ? `<div class="tile-grid">${plays.map((id) => tile(PLAY_WORDS[id][0], PLAY_WORDS[id][1], `data-pick-play="${id}" ${busy}`, !pick.idea && pick.play === id)).join("")}</div>` : `<p class="hint">${esc(PLAY_WORDS[plays[0]]?.[0] || "Plays your tune")}.</p>`}
      ${pick.play !== "bass" ? `<p class="ask">Rhythm</p><div class="choices">${RHYTHMS.filter(([id]) => id !== "strum" || (info?.strum && pick.play === "chords")).map(([id]) => filterChip(RHYTHM_WORDS[id], `data-pick-rhythm="${id}" ${busy}`, !pick.idea && pick.rhythm === id)).join("")}</div>` : ""}`
  if (!ideas.length) return `<section class="browse-step"><h3><span class="num">${n}</span>How should it play?</h3>${settings}
    <details class="how-more" ${pick.ownTuneOn ? "open" : ""}><summary>${ms("piano")}Make your own tune</summary>${tuneMaker(busy)}</details></section>`
  return `<section class="browse-step"><h3><span class="num">${n}</span>How should it play?</h3>
    <p class="hint">Pick an idea and Songbird writes the part from your song. ${esc(ideaBasis())}. Tap one to hear it.</p>
    <div class="tile-grid">${ideas.map((idea) => tile(idea.name, idea.line, `data-sound-idea="${idea.id}" ${busy}`, pick.idea === idea.id, idea.bigOnly ? "auto_awesome" : null)).join("")}</div>
    ${usesSongChords() ? `<details class="how-more" open><summary>${ms("piano")}Change the chords</summary>${chordChooser(busy)}</details>` : ""}
    <details class="how-more" ${pick.ownTuneOn ? "open" : ""}>
      <summary>${ms("piano")}Make your own tune</summary>
      ${tuneMaker(busy)}
    </details>
    <details class="how-more" ${pick.manual && !pick.idea ? "open" : ""}>
      <summary>${ms("tune")}Set it yourself</summary>
      ${settings}
    </details>
  </section>`
}

// Drums: follow a beat you made, or one of Songbird's beats.
function beatStep(n, busy) {
  const yours = state.layers.some((layer) => isRecording(layer) && buffers.get(layer.id + ":audio"))
  return `<section class="browse-step"><h3><span class="num">${n}</span>Which beat?</h3>
    <p class="hint">Tap one to hear it with your song.</p>
    <div class="tile-grid">${yours ? tile("Follow my beat", "Drums that follow the rhythm of what you recorded.", `data-pick-groove="" ${busy}`, !pick.groove && !pick.ownBeat) : ""}${Object.entries(GROOVES).map(([id, groove]) => tile(groove.name, groove.line, `data-pick-groove="${id}" ${busy}`, pick.groove === id && !pick.ownBeat)).join("")}</div>
    <details class="how-more" ${pick.ownBeat ? "open" : ""}>
      <summary>${ms("grid_on")}Make your own beat</summary>
      ${beatMaker(busy)}
    </details>
  </section>`
}

// One sound (a conga, a shaker…): you set where it plays.
function singleStep(n, busy) {
  if (!pick.single) return ""
  return `<section class="browse-step"><h3><span class="num">${n}</span>Where it plays</h3>
    ${beatMaker(busy)}
  </section>`
}

// Your own beat: one bar of eighth notes, a row for each drum. It starts
// from the beat you picked, so you can change just a little.
const KIT_ROWS = [["kick", "Kick"], ["snare", "Snare"], ["clap", "Clap"], ["hat", "Hi-hat"], ["open-hat", "Open hat"]]
const BEAT_STEPS = 8

// The rows: a kit's drums, or one sound (hand drums get their high and low).
function beatRows() {
  if (pick.drums !== "single") return KIT_ROWS
  const name = SINGLES.find((one) => one.id === pick.single)?.name || "Hit"
  if (pick.single === "conga") return [["conga", "High"], ["low-conga", "Low"]]
  if (pick.single === "high-bongo") return [["high-bongo", "High"], ["low-bongo", "Low"]]
  return [[pick.single || "clap", name]]
}

function beatGrid() {
  const BEAT_ROWS = beatRows()
  if (!browse.grid || browse.gridFor !== BEAT_ROWS.map(([kind]) => kind).join()) {
    browse.gridFor = BEAT_ROWS.map(([kind]) => kind).join()
    // A one-sound part starts on every beat; a kit starts from the picked beat.
    const bar = pick.ownBeat || (pick.drums === "single" ? [0, 1, 2, 3].map((b) => [b, BEAT_ROWS[0][0], 0.8]) : (GROOVES[pick.groove] || GROOVES.pop).bar)
    browse.grid = Object.fromEntries(BEAT_ROWS.map(([kind]) => [kind, Array(BEAT_STEPS).fill(false)]))
    for (const [at, kind, vel] of bar) {
      const row = kind === "ride" || kind === "shaker" || kind === "pedal-hat" ? "hat" : kind === "rim" ? "snare" : kind
      const step = Math.round(at * 2)
      if (browse.grid[row] && vel > 0.2 && step < BEAT_STEPS) browse.grid[row][step] = true
    }
  }
  return browse.grid
}

function gridBar() {
  const grid = beatGrid()
  const bar = []
  for (const [kind] of beatRows()) grid[kind].forEach((on, step) => {
    if (on) bar.push([step / 2, kind, kind === "kick" ? 0.95 : kind === "snare" || kind === "clap" ? 0.85 : step % 2 ? 0.32 : 0.48])
  })
  return bar
}

function beatMaker(busy) {
  const grid = beatGrid()
  const count = ["1", "&", "2", "&", "3", "&", "4", "&"]
  return `<p class="hint">Tap a square to add or take out a drum. Each tap plays it. Listen first plays the whole beat with your song.</p>
    <div class="beat-grid" role="grid" aria-label="Your beat">
      <span></span>${count.map((c) => `<span class="beat-count">${c}</span>`).join("")}
      ${beatRows().map(([kind, name]) => `<span class="beat-row-name">${name}</span>${grid[kind].map((on, step) => `<button class="beat-cell ${on ? "on" : ""} ${step % 2 ? "" : "down"}" data-beat-cell="${kind}:${step}" aria-pressed="${on}" aria-label="${name} on ${count[step]}" ${busy}></button>`).join("")}`).join("")}
    </div>
    ${pick.ownBeat ? `<div class="choices">${filterChip(`${ms("restart_alt")}Start again${pick.drums === "single" ? "" : ` from ${esc(GROOVES[pick.groove]?.name || "the beat")}`}`, `data-beat-reset ${busy}`)}</div>` : ""}`
}

function pickIdea(id) {
  const idea = (SOUND_IDEAS[pick.family] || SOUND_IDEAS.keys).find((item) => item.id === id)
  if (!idea) return
  // An instrument of this kind that can play it (a string section for
  // chords, say), keeping the one you picked when it can.
  if (!instrumentInfo(pick.instrument)?.plays.includes(idea.play)) {
    const fit = INSTRUMENTS.find((item) => item.family === pick.family && item.plays.includes(idea.play))
    if (fit) pick.instrument = fit.id
  }
  pick.play = idea.play
  pick.rhythm = idea.rhythm
  if (idea.style) pick.style = idea.style
  else delete pick.style
  pick.idea = idea.id
  browse.bigOnly = !!idea.bigOnly
}

// Ideas for the big parts only: the new layer sits out the rest.
function keepToBigParts(layer) {
  if (!layer || typeof songWideSections !== "function") return false
  const sections = songWideSections()
  const big = sections.filter((section) => BIG.test(section.name) || CHORUS.test(section.name))
  if (!big.length || big.length === sections.length) return false
  const gaps = sections.filter((section) => !big.includes(section)).map((section) => sectionSpan(section)).map((box) => ({ start: box.start, end: box.end }))
  layer.gaps = mergeGaps([...(layer.gaps || []), ...gaps])
  return true
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
  if (choice.family === "drums" && choice.drums === "kit") bits.push(choice.ownBeat ? "your own beat" : choice.groove ? GROOVES[choice.groove]?.name.toLowerCase() : "follows your beat")
  const idea = pick.idea && (SOUND_IDEAS[pick.family] || SOUND_IDEAS.keys).find((item) => item.id === pick.idea)
  if (choice.family !== "drums") bits.push(choice.ownTune ? `your own tune, ${PLAY_WORDS[choice.play]?.[0].toLowerCase()}` : idea ? idea.name.toLowerCase() : PLAY_WORDS[choice.play]?.[0].toLowerCase())
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
  // No tune to play yet: start on the first idea, so Add it just works.
  if (!changing && pick.family !== "drums" && !pick.idea && !pick.ownTuneOn && ["solo", "section"].includes(pick.play) && !hasTune()) {
    const first = (SOUND_IDEAS[pick.family] || SOUND_IDEAS.keys).find((idea) => !idea.needsTune && INSTRUMENTS.some((item) => item.family === pick.family && item.plays.includes(idea.play)))
    if (first) pickIdea(first.id)
  }
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
  const how = pick.family === "drums" ? (pick.drums === "kit" ? beatStep(++n, busy) : singleStep(++n, busy)) : howStep(++n, busy, plays, info)
  const when = step(++n, "From what time?", `<div class="era-row">${ERAS.map(([id]) => tile(ERA_WORDS[id][0], ERA_WORDS[id][1], `data-browse-era="${id}" ${busy}`, browse.era === id)).join("")}</div>`)
  const follow = pick.family !== "drums" && followable.length >= 1
    ? step(++n, "Play along with", `<p class="hint">It follows the notes of the one you pick: a recording, or a sound made here. Tap one to hear it.</p><div class="choices">${followable.map((layer) => filterChip(`${ms(isRecording(layer) ? "mic" : "wand_stars")}${esc(layer.name)}`, `data-browse-follow="${layer.id}" ${busy}`, browse.follow === layer.id)).join("")}${filterChip(`${ms("piano")}The song's chords`, `data-browse-follow="song" ${busy}`, browse.follow === "song")}</div>`)
    : ""
  // Chords and bass can be written in the song's key; only a tune needs one.
  const noTune = pick.family !== "drums" && ["solo", "section"].includes(pick.play) && !hasTune() && !pick.ownTuneOn
  return `${head(changing ? `Change ${esc(target.name)}` : "Add a sound")}
    <p class="hint">${changing ? "Pick a new instrument, a new way to play, or a different time. Your other sounds stay the same." : "Pick any sound, try it with your song, then add it. Every note lands on the beat and in tune."}</p>
    ${kinds}${which}${how}${when}${follow}
    <div class="browse-bar">
      <p class="browse-summary">${ms(changing ? "swap_horiz" : "music_note")}${esc(choiceSummary(choice))}</p>
      ${noTune ? `<p class="hint warn-text">There's no tune yet for it to play. Pick one of the ideas above, or make your own tune.</p>` : ""}
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
    browse.keyNote = ""
    let made = await buildPart(choice, source)
    if (made.error === "no-notes" && canUseKeyChords(choice)) {
      made = await buildPart({ ...choice, ...backingNotes(), backing: true }, null)
      browse.keyNote = `${source?.name || "That sound"} has no clear tune, so this plays chords in the song's key. `
    }
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
    browse.note = `${browse.keyNote || ""}That's ${choiceSummary(choice)} with your song. Like it? Tap ${browse.mode === "change" ? "Change it" : "Add it"}.`
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
  if (!reply.warn && !reply.check && browse.bigOnly && browse.mode !== "change") {
    const layer = state.layers.find((item) => item.id === state.selected)
    if (keepToBigParts(layer)) {
      rememberSong()
      renderTracks()
      reply.text = `${reply.text} It plays in the big parts only; use Plays in on the layer to add it anywhere else.`
    }
  }
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
  const tune = event.target.closest?.("[data-tune-cell],[data-tune-hear],[data-tune-reset],[data-tune-off]")
  if (tune && !tune.disabled) {
    const d = tune.dataset
    if (d.tuneCell) {
      const [midi, step] = d.tuneCell.split(":").map(Number)
      const steps = ownTune()
      steps[step] = steps[step] === midi ? null : midi
      pick.ownTuneEdited = true
      pick.ownTuneOn = true
      browse.note = ""
      if (steps[step] != null) void SongbirdSampler.playNote(ac(), ac().destination, pick.instrument, midi, 0.8).then((voice) => voice && setTimeout(() => voice.stop?.(), 600)).catch(() => {})
    }
    if (d.tuneHear != null) {
      const { melody } = tuneNotes()
      const ctx = ac()
      for (const note of melody) void SongbirdSampler.playNote(ctx, ctx.destination, pick.instrument, note.midi, 0.8, ctx.currentTime + note.time).then((voice) => voice && setTimeout(() => voice.stop?.(), (note.time + note.dur) * 1000)).catch(() => {})
    }
    if (d.tuneReset != null) {
      pick.ownTune = null
      pick.ownTuneOn = true
    }
    if (d.tuneOff != null) {
      pick.ownTune = null
      pick.ownTuneOn = false
    }
    renderInspector()
    return
  }
  const cell = event.target.closest?.("[data-beat-cell]")
  if (cell && !cell.disabled) {
    const [kind, step] = cell.dataset.beatCell.split(":")
    const grid = beatGrid()
    grid[kind][Number(step)] = !grid[kind][Number(step)]
    pick.ownBeat = gridBar()
    browse.note = ""
    if (grid[kind][Number(step)]) void SongbirdSampler.playHit(ac(), ac().destination, pick.kit || "standard", kind, 0.9).catch(() => {})
    renderInspector()
    return
  }
  if (event.target.closest?.("[data-beat-reset]")) {
    delete pick.ownBeat
    browse.grid = null
    renderInspector()
    return
  }
  const beat = event.target.closest?.("[data-pick-groove]")
  if (beat && !beat.disabled) {
    pick.groove = beat.dataset.pickGroove || null
    delete pick.ownBeat
    browse.grid = null
    renderInspector()
    void listenFirst()
    return
  }
  const idea = event.target.closest?.("[data-sound-idea]")
  if (idea && !idea.disabled) {
    pickIdea(idea.dataset.soundIdea)
    renderInspector()
    void listenFirst()
    return
  }
  const node = event.target.closest?.("[data-browse],[data-browse-era],[data-browse-follow],[data-browse-open]")
  if (!node || node.disabled) return
  const d = node.dataset
  if (d.browseOpen != null) {
    openBrowser(d.browseOpen || null)
    return
  }
  if (d.browseEra) browse.era = d.browseEra
  if (d.browseFollow) {
    // Hear it with the one it follows right away.
    browse.follow = d.browseFollow
    renderInspector()
    void listenFirst()
    return
  }
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
  if (state.panel === "sounds" && event.target.closest?.("[data-pick-drums],[data-pick-single]")) {
    delete pick.ownBeat
    browse.grid = null
  }
  if (state.panel === "sounds" && event.target.closest?.("[data-pick-family],[data-pick-instrument],[data-pick-play],[data-pick-rhythm],[data-pick-drums],[data-pick-kit],[data-pick-single]")) {
    browse.note = ""
    stopPreview()
  }
}, true)
