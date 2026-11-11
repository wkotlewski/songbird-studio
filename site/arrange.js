// Make it a full song. Once there's a groove, pick what the song is for and a
// few words for how it should feel (or just say it). Songbird fills in what's
// missing (drums, bass, chords, background vocals, a solo, strings), lays the
// song out in sections, brings parts in and out, adds drum fills into the big
// moments, and fades it in and out. One Undo takes it all back.

const SONG_PLANS = [
  {
    // After the arrangements on Olivia Dean's The Art of Loving: piano alone
    // first, strings and low end slip in, the band arrives by the
    // pre-chorus, a full chorus with picked guitar and horns set back, verse
    // two pulls back, a hush to piano and voice, then the biggest chorus.
    id: "soul",
    name: "Build like a soul song",
    icon: "favorite",
    line: "Piano first, strings slip in, the band arrives for the chorus, a hush, then the biggest chorus.",
    sections: [["Intro", 4], ["Verse", 8], ["Pre-chorus", 4], ["Chorus", 8], ["Verse 2", 8], ["Chorus", 8], ["Hush", 2], ["Last chorus", 8], ["Outro", 4]],
  },
  {
    id: "song",
    name: "A song to sing over",
    icon: "mic",
    line: "Verse, chorus, verse, chorus, bridge, last chorus. Room for your voice.",
    sections: [["Intro", 4], ["Verse", 8], ["Chorus", 8], ["Verse", 8], ["Chorus", 8], ["Bridge", 8], ["Chorus", 8], ["Outro", 4]],
  },
  {
    id: "jam",
    name: "A groove to jam over",
    icon: "repeat",
    line: "Steady all the way, with a solo in the middle.",
    sections: [["Intro", 4], ["Groove", 8], ["Groove", 8], ["Solo", 8], ["Groove", 8], ["Outro", 4]],
  },
  {
    id: "climax",
    name: "Build to a big finish",
    icon: "trending_up",
    line: "Starts small, adds a part at a time, peaks near the end.",
    sections: [["Start", 8], ["Build", 8], ["Build", 8], ["Climax", 8], ["Release", 4]],
  },
  {
    id: "background",
    name: "Background music",
    icon: "spa",
    line: "Gentle and even, with soft fades. Good under a video or while you work.",
    sections: [["Intro", 4], ["Main", 16], ["Main", 16], ["Outro", 4]],
  },
]

// How words feel, as instruments.
const VIBES = [
  { id: "chill", name: "Chill", words: /chill|calm|mellow|relax|laid ?back|lofi|lo-fi/, chords: "electric-piano", solo: "flute", kit: "brush", bass: "bass" },
  { id: "upbeat", name: "Upbeat", words: /upbeat|energetic|bright|fun|bouncy|pop/, chords: "steel-guitar", solo: "trumpet", kit: "standard", bass: "bass" },
  { id: "dreamy", name: "Dreamy", words: /dream|float|spacey|ethereal|ambient/, chords: "warm-pad", solo: "vibraphone", kit: "electronic", bass: "synth-bass" },
  { id: "warm", name: "Warm soul", words: /warm|motown|classic soul|neo.?soul|olivia|timeless|retro soul/, chords: "grand-piano", solo: "clean-guitar", kit: "room", bass: "bass" },
  { id: "soulful", name: "Soulful", words: /soul|gospel|r&b|rnb|church/, chords: "organ", solo: "tenor-sax", kit: "room", bass: "bass" },
  { id: "funky", name: "Funky", words: /funk|groovy|disco/, chords: "clean-guitar", solo: "alto-sax", kit: "standard", bass: "bass" },
  { id: "rock", name: "Rock", words: /rock|loud|heavy|punk|grunge/, chords: "rock-guitar", solo: "rock-guitar", kit: "power", bass: "bass" },
  { id: "epic", name: "Epic", words: /epic|cinematic|movie|big|huge|anthem/, chords: "strings", solo: "french-horn", kit: "power", bass: "bass" },
  { id: "party", name: "Party", words: /party|dance|club|edm|hype/, chords: "warm-pad", solo: "synth-lead", kit: "808", bass: "synth-bass" },
  { id: "jazzy", name: "Jazzy", words: /jazz|swing|smooth|lounge/, chords: "electric-piano", solo: "tenor-sax", kit: "jazz", bass: "upright-bass" },
  { id: "gentle", name: "Gentle", words: /gentle|soft|quiet|lullaby|sweet|acoustic|folk/, chords: "nylon-guitar", solo: "flute", kit: "brush", bass: "upright-bass" },
  { id: "sad", name: "Sad", words: /sad|blue|melanchol|heartbreak|emotional|moody/, chords: "grand-piano", solo: "cello", kit: "brush", bass: "bass" },
  { id: "dark", name: "Dark", words: /dark|spooky|mysterious|tense|eerie/, chords: "warm-pad", solo: "cello", kit: "electronic", bass: "synth-bass" },
]

const PLAIN = { chords: "grand-piano", solo: "clean-guitar", kit: "standard", bass: "bass" }

// What Songbird can add, and where each one plays.
const ADDS = [
  { id: "drums", name: "Drums" },
  { id: "bass", name: "Bass" },
  { id: "chords", name: "Chords" },
  { id: "vocals", name: "Background vocals" },
  { id: "solo", name: "A solo" },
  { id: "strings", name: "Strings" },
  { id: "horns", name: "Horns" },
  { id: "guitar", name: "Guitar picking" },
  { id: "fills", name: "Fills into big parts" },
]

// A plan can have its own rules for who plays where.
const PLAN_RULES = {
  soul: {
    drums: { Intro: false, Verse: false, "Pre-chorus": true, Chorus: true, "Verse 2": "half", Hush: false, "Last chorus": true, Outro: false },
    bass: { Intro: false, Verse: "half", "Pre-chorus": true, Chorus: true, "Verse 2": true, Hush: false, "Last chorus": true, Outro: false },
    strings: { Intro: false, Verse: true, "Pre-chorus": true, Chorus: true, "Verse 2": false, Hush: false, "Last chorus": true, Outro: true },
    vocals: { Chorus: true, "Last chorus": true },
    horns: { Chorus: true, "Last chorus": true },
    guitar: { Chorus: true, "Verse 2": true, "Last chorus": true },
    solo: { "Verse 2": "half" },
  },
}

// Where a part sits in the mix: horns a step back, strings and voices with
// a little room around them, as on a classic soul record.
const MIX_PLACE = {
  horns: { gain: 0.6, space: 0.35 },
  strings: { gain: 0.72, space: 0.3 },
  vocals: { gain: 0.7, space: 0.32 },
  guitar: { gain: 0.6, space: 0.15, pan: -0.45 },
}

// true: plays the whole section. "half": comes in halfway. false: rests.
const PLAYS_IN = {
  drums: { Intro: false, Verse: true, Chorus: true, Bridge: "half", Outro: false, Groove: true, Solo: true, Start: false, Build: true, Climax: true, Release: false, Main: true },
  bass: { Intro: false, Start: false, Release: "half" },
  vocals: { Chorus: true, Climax: true, Groove: false, Solo: false, Build: false, Main: false, Verse: false, Bridge: false, Intro: false, Outro: false, Start: false, Release: false },
  solo: { Bridge: true, Solo: true, Climax: true },
  strings: { Chorus: true, Bridge: true, Climax: true, Build: "half", Main: true, Release: true },
  horns: { Chorus: true, Climax: true, Groove: "half" },
}

const arrange = {
  plan: "song",
  vibes: [],
  adds: null, // null: Songbird's picks. Otherwise the set you chose.
  short: false,
  said: "",
  heard: "",
  working: "",
}

function vibeOf() {
  const first = VIBES.find((vibe) => vibe.id === arrange.vibes[0])
  return { ...PLAIN, ...(first || {}) }
}

function songPlan() {
  return SONG_PLANS.find((plan) => plan.id === arrange.plan) || SONG_PLANS[0]
}

// What Songbird would add, from what's already in the song.
function suggestedAdds() {
  const facts = songFacts()
  const picks = new Set()
  if (!facts.hasDrums && arrange.plan !== "background") picks.add("drums")
  if (!facts.hasBass) picks.add("bass")
  if (!facts.hasChords) picks.add("chords")
  if (arrange.plan === "soul") {
    for (const id of ["strings", "vocals", "horns", "guitar"]) picks.add(id)
  }
  if (arrange.plan === "song" || arrange.vibes.includes("soulful")) picks.add("vocals")
  if (arrange.plan === "jam" || arrange.plan === "song") picks.add("solo")
  if (arrange.plan === "climax" || arrange.vibes.some((id) => ["epic", "sad", "dreamy"].includes(id))) picks.add("strings")
  if (arrange.vibes.some((id) => ["funky", "soulful"].includes(id))) picks.add("horns")
  if ((facts.hasDrums || picks.has("drums")) && arrange.plan !== "background") picks.add("fills")
  return picks
}

function chosenAdds() {
  return arrange.adds || suggestedAdds()
}

function addLabel(id) {
  const vibe = vibeOf()
  const name = (instrument) => instrumentInfo(instrument)?.name || instrument
  if (id === "drums") return `Drums · ${KITS.find((kit) => kit.id === vibe.kit)?.name || "Studio kit"}`
  if (id === "bass") return `Bass · ${name(vibe.bass)}`
  if (id === "chords") return `Chords · ${name(vibe.chords)}`
  if (id === "vocals") return "Background vocals · Choir"
  if (id === "solo") return `A solo · ${name(vibe.solo)}`
  if (id === "strings") return "Strings · String section"
  if (id === "horns") return "Horns · Horn section"
  if (id === "guitar") return "Guitar picking · Clean electric"
  return "Fills into big parts"
}

// The song's beat and loop.
function loopSeconds() {
  const beat = 60 / Math.max(40, state.bpm || 92)
  return state.loopSec || (state.loopBars || 4) * 4 * beat
}

function sectionTimes() {
  const beat = 60 / Math.max(40, state.bpm || 92)
  const bar = beat * 4
  const loop = loopSeconds()
  let at = 0
  return songPlan().sections.map(([name, bars], index) => {
    const want = (arrange.short ? Math.max(4, bars / 2) : bars) * bar
    const length = Math.max(1, Math.round(want / loop)) * loop
    const section = { id: `arr-${index}`, name, start: at, end: at + length }
    at += length
    return section
  })
}

// ---------------------------------------------------------------------------
// Reading what you said

function readSongWish(text) {
  const said = ` ${String(text || "").toLowerCase()} `
  const notes = []
  // “Background vocals” is a part, not background music.
  const plain = said.replace(/(background|backing|backup) (vocals|voices|singers|singing|oohs)/g, "choir")
  if (/soul song|like a soul|olivia dean|art of loving|motown|build like|slow build|piano first/.test(plain)) arrange.plan = "soul"
  else if (/verse|chorus|bridge|sing over|sing to|record (my )?vocals|vocals to|lyrics|song structure/.test(plain)) arrange.plan = "song"
  else if (/climax|big finish|build( up)?|crescendo|peak/.test(plain)) arrange.plan = "climax"
  else if (/jam|groove|steady|loop|vamp/.test(plain)) arrange.plan = "jam"
  else if (/background|study|focus|under a video|while i work/.test(plain)) arrange.plan = "background"
  const vibes = VIBES.filter((vibe) => vibe.words.test(said)).map((vibe) => vibe.id)
  if (vibes.length) arrange.vibes = vibes.slice(0, 3)
  const adds = new Set(suggestedAdds())
  const want = (id, pattern) => {
    if (new RegExp(`(no|without|skip|don'?t want|leave out) (the |any )?(${pattern})`).test(said)) adds.delete(id)
    else if (new RegExp(pattern).test(said)) adds.add(id)
  }
  want("drums", "drums?|beat|kit")
  want("bass", "bass|baseline|base line")
  want("chords", "chords|piano|keys|guitar chords|rhythm guitar")
  want("vocals", "background vocals|backing vocals|backup vocals|choir|oohs|harmon")
  want("solo", "solo|lead")
  want("strings", "strings|violin|orchestra")
  want("horns", "horns?|brass|trumpets?")
  want("fills", "fills?|transitions?")
  want("guitar", "guitar picking|picked guitar|fingerpick|electric guitar")
  arrange.adds = adds
  // A named solo instrument: “a guitar solo”, “sax solo”.
  const soloWord = said.match(/(guitar|sax|saxophone|trumpet|flute|violin|piano|synth|organ|cello) solo|solo (on|with) (the )?(guitar|sax|saxophone|trumpet|flute|violin|piano|synth|organ|cello)/)
  arrange.soloPick = soloWord ? { guitar: "clean-guitar", sax: "tenor-sax", saxophone: "tenor-sax", trumpet: "trumpet", flute: "flute", violin: "violin", piano: "grand-piano", synth: "synth-lead", organ: "organ", cello: "cello" }[soloWord[1] || soloWord[4]] : null
  if (/short|quick|minute/.test(said)) arrange.short = true
  if (/long|full length|full song/.test(said)) arrange.short = false
  const plan = songPlan()
  notes.push(plan.name)
  if (arrange.vibes.length) notes.push(arrange.vibes.map((id) => VIBES.find((vibe) => vibe.id === id).name.toLowerCase()).join(", "))
  arrange.heard = `Got it: ${notes.join(", ")}. Here's my plan. Change anything below, then tap Build my song.`
}

// ---------------------------------------------------------------------------
// What you see

function arrangeMarkup(head) {
  const facts = songFacts()
  const busy = arrange.working ? "disabled" : ""
  if (!facts.count) {
    return `${head("Make it a full song")}
      <p class="empty">Record a loop or play a groove first. Then I can turn it into a whole song.</p>
      ${filledButton(`${ms("mic")}Record`, `data-guide-do="record"`)}`
  }
  const plan = songPlan()
  const adds = chosenAdds()
  const sections = sectionTimes()
  const total = sections[sections.length - 1].end
  const order = sections.map((section) => section.name)
  const fadeIn = arrange.plan === "background" || arrange.vibes.some((id) => ["chill", "dreamy", "gentle"].includes(id)) ? 3 : 0
  const fadeOut = arrange.plan === "jam" || arrange.vibes.includes("party") ? 4 : 8
  return `${head("Make it a full song")}
    <p class="hint">Tell me what the song is for and how it should feel. I'll add what's missing, lay it out, and bring parts in and out.</p>
    <label class="field">Or just say it
      <textarea id="song-wish" rows="2" placeholder="Steady, with background vocals and a guitar solo" ${busy}>${esc(arrange.said)}</textarea>
    </label>
    ${outlinedButton(`${ms("wand_stars")}Use what I said`, `data-arrange="read" ${busy}`)}
    ${arrange.heard ? `<p class="hint">${esc(arrange.heard)}</p>` : ""}
    <p class="ask">What's it for?</p>
    <div class="plan-cards">${SONG_PLANS.map((item) => `<button class="plan-card ${item.id === plan.id ? "on" : ""}" data-arrange-plan="${item.id}" aria-pressed="${item.id === plan.id}" ${busy}>${ms(item.icon)}<b>${esc(item.name)}</b><small>${esc(item.line)}</small></button>`).join("")}</div>
    <p class="ask">How should it feel? <small class="hint">Pick up to three</small></p>
    <div class="choices">${VIBES.map((vibe) => filterChip(vibe.name, `data-arrange-vibe="${vibe.id}" ${busy}`, arrange.vibes.includes(vibe.id))).join("")}</div>
    <p class="ask">I'll add</p>
    <div class="choices">${ADDS.map((item) => filterChip(esc(item.id === "solo" && arrange.soloPick ? `A solo · ${instrumentInfo(arrange.soloPick)?.name}` : addLabel(item.id)), `data-arrange-add="${item.id}" ${busy}`, adds.has(item.id))).join("")}</div>
    <p class="hint">${facts.hasDrums ? "" : "No drums yet. "}${facts.hasBass ? "" : "No bass yet. "}${facts.hasChords ? "" : "No chords yet. "}${facts.hasDrums && facts.hasBass && facts.hasChords ? "You have drums, bass, and chords already. " : ""}I picked what fits. Tap to change.</p>
    <p class="ask">The plan</p>
    <ol class="song-map">${sections.map((section) => `<li><b>${esc(section.name)}</b><span>${formatClock(section.start)}</span><small>${esc(sectionWho(section, adds, sections))}</small></li>`).join("")}</ol>
    <p class="hint">${formatClock(total)} long · ${order.join(", ")}. ${fadeIn ? `Fades in over ${fadeIn} seconds and out` : "Fades out"} over the last ${fadeOut} seconds.</p>
    <div class="choices">${filterChip("Shorter", `data-arrange="short" ${busy}`, arrange.short)}</div>
    <div class="browse-bar"><div class="browse-actions">
      ${filledButton(arrange.working ? esc(arrange.working) : `${ms("auto_awesome")}Build my song`, `data-arrange="build" ${busy}`)}
    </div><p class="hint">Undo takes the whole thing back in one tap.</p></div>`
}

// Who plays in a section, from the same rules the build uses.
function sectionWho(section, adds, sections) {
  const facts = songFacts()
  const who = ["your sounds"]
  if (adds.has("chords")) who.push("chords")
  const names = { vocals: "background vocals", solo: "the solo", drums: "drums", bass: "bass", strings: "strings", horns: "horns", guitar: "guitar picking" }
  for (const role of ["drums", "bass", "strings", "guitar", "vocals", "solo", "horns"]) {
    const has = role === "drums" ? adds.has("drums") || facts.hasDrums : role === "bass" ? adds.has("bass") || facts.hasBass : adds.has(role)
    if (!has) continue
    const gaps = gapsFor(role, sections)
    const covered = gaps.filter((gap) => gap.start < section.end - 0.01 && gap.end > section.start + 0.01)
    if (!covered.length) who.push(names[role])
    else if (covered.every((gap) => gap.end < section.end - 0.01)) who.push(`${names[role]} come in`)
  }
  return who.join(", ")
}

// ---------------------------------------------------------------------------
// Building it

function roleOf(layer) {
  if (layer.arrangeRole) return layer.arrangeRole
  const kind = kindOf(layer)
  if (kind === "drums") return "drums"
  if (kind === "bass") return "bass"
  return "yours"
}

// Notes for a solo when there's no tune to follow: the chords, broken up
// into a line of eighth notes.
function soloFromChords(notes) {
  const out = []
  const step = notes.beat / 2
  const shape = [0, 1, 2, 3, 2, 1, 2, 0]
  for (const chord of notes.melody) {
    const tones = SongbirdMusic.chordTones(chord.midi + 12, notes.key, 60)
    tones.push(tones[0] + 12)
    let i = 0
    for (let t = chord.time; t < chord.time + chord.dur - 0.01; t += step) {
      out.push({ time: t, dur: step * 0.9, midi: tones[shape[i % shape.length]] })
      i++
    }
  }
  return { ...notes, melody: out }
}

function gapsFor(role, sections) {
  const rules = PLAN_RULES[arrange.plan]?.[role] || PLAYS_IN[role]
  if (!rules) return []
  const gaps = []
  for (const section of sections) {
    let rule = rules[section.name]
    if (rule === undefined) rule = role === "bass" || role === "drums"
    if (role === "solo" && rule && arrange.plan === "song" && section.name !== "Bridge") rule = false
    if (role === "strings" && section.name === "Chorus" && arrange.plan === "song") {
      // Strings save themselves for the last chorus.
      const last = sections.filter((item) => item.name === "Chorus").pop()
      if (section !== last) rule = false
    }
    if (rule === true) continue
    if (rule === "half") gaps.push({ start: section.start, end: section.start + (section.end - section.start) / 2 })
    else gaps.push({ start: section.start, end: section.end })
  }
  return mergeGaps(gaps.length >= sections.length ? fallbackGaps(role, sections) : gaps)
}

// A part you asked for always gets somewhere to play, even when the song's
// layout has no natural spot for it: a solo takes the middle, background
// vocals and the rest join everything but the intro and outro, the second
// time round.
function fallbackGaps(role, sections) {
  const inner = sections.filter((section) => !/Intro|Outro|Start|Release/.test(section.name))
  let play
  if (role === "solo") play = [inner[Math.floor(inner.length / 2)] || sections[Math.floor(sections.length / 2)]]
  else play = inner.length > 1 ? inner.slice(1) : inner
  const on = new Set(play.filter(Boolean))
  return sections.filter((section) => !on.has(section)).map((section) => ({ start: section.start, end: section.end }))
}

function fillHits(sections) {
  const beat = 60 / Math.max(40, state.bpm || 92)
  const hits = []
  const big = new Set(["Chorus", "Last chorus", "Pre-chorus", "Climax", "Bridge", "Solo", "Build", "Groove", "Main", "Verse"])
  sections.forEach((section, index) => {
    if (!index || !big.has(section.name)) return
    const at = section.start
    // A snare roll over the last beat, getting louder, then a crash.
    const lift = ["Chorus", "Last chorus", "Climax", "Solo"].includes(section.name)
    const steps = lift ? 8 : 4
    for (let i = 0; i < steps; i++) {
      const t = at - (steps - i) * (lift ? beat / 4 : beat / 4)
      if (t > 0) hits.push({ kind: i % 4 === 3 && lift ? "high-tom" : "snare", time: t, vel: 0.45 + (0.45 * i) / steps })
    }
    hits.push({ kind: "crash", time: at, vel: 0.9 })
    hits.push({ kind: "kick", time: at, vel: 0.95 })
  })
  return hits.sort((a, b) => a.time - b.time)
}

async function buildSong() {
  if (arrange.working) return
  const facts = songFacts()
  if (!facts.count) return
  const vibe = vibeOf()
  const adds = chosenAdds()
  const sections = sectionTimes()
  const total = sections[sections.length - 1].end
  if (playing) stopPlayback()
  const mark = undoStack.length
  snapshot(state.layers.map((layer) => layer.id))
  const before = new Set(state.layers.map((layer) => layer.id))
  const wasSelected = state.selected
  const added = []
  const missed = []
  const step = (text) => {
    arrange.working = text
    $("save-status").textContent = text
    renderInspector()
  }
  try {
    const tune = melodyLayer()
    const tuneIsYours = tune && isRecording(tune)
    const make = async (role, choice, options = {}) => {
      const reply = await makePart(choice, { checked: true, ...options })
      if (reply.warn) {
        missed.push(role)
        return null
      }
      const layer = state.layers.find((item) => item.id === state.selected && !before.has(item.id))
      if (layer) {
        layer.arrangeRole = role
        if (options.name) {
          layer.name = options.name
          layer.sound = options.name
        }
        before.add(layer.id)
        added.push(layer.name)
      }
      return layer
    }
    const wanted = ADDS.filter((item) => adds.has(item.id) && item.id !== "fills")
    let count = 0
    for (const item of wanted) {
      count++
      step(`Adding ${item.name.toLowerCase()} (${count} of ${wanted.length})…`)
      if (item.id === "drums" && !facts.hasDrums) await make("drums", { family: "drums", drums: "kit", kit: vibe.kit, era: state.era || "today" })
      if (item.id === "bass" && !facts.hasBass) await make("bass", { family: "bass", instrument: vibe.bass, play: "bass", rhythm: "played", era: state.era || "today" })
      if (item.id === "chords") {
        const info = instrumentInfo(vibe.chords)
        await make("chords", { family: info.family, instrument: vibe.chords, play: info.plays.includes("chords") ? "chords" : info.plays[0], rhythm: info.strum ? "strum" : "played", era: state.era || "today" })
      }
      if (item.id === "vocals") await make("vocals", { family: "voices", instrument: "choir-aahs", play: "section", rhythm: "played", era: state.era || "today" })
      if (item.id === "strings") await make("strings", { family: "strings", instrument: "strings", play: "section", rhythm: "played", era: state.era || "today" })
      if (item.id === "horns") await make("horns", { family: "horns", instrument: "brass-section", play: "section", rhythm: "played", era: state.era || "today" })
      if (item.id === "guitar") await make("guitar", { family: "guitar", instrument: "clean-guitar", play: "chords", rhythm: "strum", era: state.era || "today" }, { name: "Guitar picking" })
      if (item.id === "solo") {
        const id = arrange.soloPick || vibe.solo
        const info = instrumentInfo(id)
        const choice = { family: info.family, instrument: id, play: "solo", rhythm: "played", era: state.era || "today" }
        if (tuneIsYours) await make("solo", choice, { source: tune })
        else {
          // No tune of yours: the solo plays a line over the chords.
          const from = state.layers.map((layer) => playedPart(layer)).find((part) => part?.melody?.some((note) => note.chord))
          const base = from ? { melody: from.melody, key: from.key, pass: from.pass, total: from.total, loop: from.loop, beat: from.beat || 60 / (state.bpm || 92), phase: from.phase || 0 } : backingNotes()
          await make("solo", { ...choice, ...soloFromChords(base) })
        }
      }
    }
    // The song's length and sections. Every layer loops or stops to fit.
    step("Laying out the song…")
    const scope = state.lengthScope
    state.lengthScope = "song"
    applyPlan(total, null, "")
    state.lengthScope = scope
    state.shape = null
    state.sections = sections.map((section) => ({ id: section.id, name: section.name, start: section.start / total, end: section.end / total }))
    for (const layer of state.layers) {
      layer.sections = null
      layer.shape = null
      const role = roleOf(layer)
      if (role === "yours" || role === "chords") continue
      // Your own drums stay in the intro when nothing else could carry it.
      if (role === "drums" && !layer.arrangeRole && !facts.hasMelody && !adds.has("chords")) continue
      layer.gaps = gapsFor(role, sections)
      const place = layer.arrangeRole && MIX_PLACE[role]
      if (place) {
        layer.gain = place.gain
        layer.space = Math.max(layer.space || 0, place.space)
        if (place.pan != null) layer.pan = place.pan
      }
    }
    if (adds.has("fills") && (facts.hasDrums || adds.has("drums"))) {
      step("Adding fills into the big parts…")
      const hits = fillHits(sections)
      if (hits.length) await make("fills", { family: "drums", drums: "kit", kit: vibe.kit, hits, pass: total, total, loop: false, beat: 60 / (state.bpm || 92), phase: 0 }, { name: "Fills" })
    }
    state.fadeIn = arrange.plan === "background" || arrange.vibes.some((id) => ["chill", "dreamy", "gentle"].includes(id)) ? 3 : 0
    state.fadeOut = arrange.plan === "jam" || arrange.vibes.includes("party") ? 4 : 8
    // One Undo for the whole build. Your selection stays where it was.
    undoStack.splice(mark + 1)
    if (state.layers.some((layer) => layer.id === wasSelected)) state.selected = wasSelected
    rememberSong()
    renderRuler()
    renderTracks()
    const text = `Your song is ready: ${sections.map((section) => section.name).join(", ")}, ${formatClock(total)}.${added.length ? ` I added ${added.join(", ")}.` : ""}${missed.length ? ` I couldn't add ${missed.join(" or ")} this time.` : ""} Undo takes it all back.`
    state.magicChat.push({ you: "Make it a full song", did: text, warn: !!missed.length })
    arrange.working = ""
    $("save-status").textContent = text
    arrange.heard = text
    renderInspector()
    play(0)
  } catch (error) {
    console.error("Couldn't build the song:", error)
    arrange.working = ""
    undoStack.splice(mark + 1)
    $("save-status").textContent = "That didn't work. Tap Undo to go back to how it was."
    renderInspector()
  }
}

function openArrange(text) {
  if (text) {
    arrange.said = text
    readSongWish(text)
  }
  setPanel("arrange")
}

// ---------------------------------------------------------------------------
// Taps

document.body.addEventListener("click", (event) => {
  const node = event.target.closest?.("[data-arrange],[data-arrange-plan],[data-arrange-vibe],[data-arrange-add],[data-arrange-open]")
  if (!node || node.disabled) return
  const d = node.dataset
  if (d.arrangeOpen != null) {
    openArrange()
    return
  }
  if (d.arrangePlan) {
    arrange.plan = d.arrangePlan
    if (!arrange.touched) arrange.adds = null
  }
  if (d.arrangeVibe) {
    const has = arrange.vibes.includes(d.arrangeVibe)
    arrange.vibes = has ? arrange.vibes.filter((id) => id !== d.arrangeVibe) : [...arrange.vibes, d.arrangeVibe].slice(-3)
    if (!arrange.touched) arrange.adds = null
  }
  if (d.arrangeAdd) {
    const adds = new Set(chosenAdds())
    if (adds.has(d.arrangeAdd)) adds.delete(d.arrangeAdd)
    else adds.add(d.arrangeAdd)
    arrange.adds = adds
    arrange.touched = true
  }
  if (d.arrange === "short") arrange.short = !arrange.short
  if (d.arrange === "read") {
    arrange.said = $("song-wish")?.value || ""
    if (!arrange.said.trim()) {
      arrange.heard = "Say how you want it, like “steady with background vocals and a guitar solo”."
    } else {
      arrange.touched = false
      readSongWish(arrange.said)
    }
  }
  if (d.arrange === "build") {
    void buildSong()
    return
  }
  renderInspector()
})

document.addEventListener("input", (event) => {
  if (event.target?.id === "song-wish") arrange.said = event.target.value
})
