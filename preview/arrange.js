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
  { id: "color", name: "Color & percussion" },
  { id: "fills", name: "Fills into big parts" },
]

// ---------------------------------------------------------------------------
// Color: the instruments that come in just when they're needed, the way
// congas, a shaker, a harp sweep, or a vibraphone sparkle do on a record.
// Each vibe has its palette. Each color has a part it plays and the
// moments it plays in.

const COLOR_SETS = {
  warm: ["shaker", "congas", "tambourine", "harp", "vibes", "flute"],
  soulful: ["tambourine", "congas", "shaker", "harp", "vibes"],
  chill: ["shaker", "congas", "vibes", "flute"],
  jazzy: ["shaker", "congas", "vibes", "flute"],
  upbeat: ["tambourine", "bongos", "shaker", "bells"],
  party: ["tambourine", "cowbell", "shaker", "bells"],
  funky: ["congas", "cowbell", "tambourine", "shaker"],
  gentle: ["shaker", "harp", "musicbox", "bells"],
  dreamy: ["harp", "bells", "musicbox", "shaker"],
  epic: ["harp", "bells", "pizz", "tambourine"],
  sad: ["harp", "pizz", "bells"],
  dark: ["pizz", "harp", "shaker"],
  rock: ["tambourine", "shaker"],
  plain: ["shaker", "tambourine", "harp", "vibes"],
}

const QUIET = /Intro|Outro|Hush|Start|Release/
const BIG = /^(Chorus|Last chorus|Climax|Solo|Groove|Main)/
const CHORUS = /^(Chorus|Last chorus|Climax)/
const LIFT = /^(Chorus|Last chorus|Climax|Solo)/

// What each color plays, in one bar, and where it comes in.
const COLORS = {
  shaker: { name: "Shaker", kind: "hits", pan: 0.35, gain: 0.42, bar: Array.from({ length: 16 }, (_, i) => [i / 4, "shaker", i % 4 === 0 ? 0.55 : i % 2 === 0 ? 0.4 : 0.27]), plays: (s, i, all) => !QUIET.test(s.name) && i > firstVerse(all) },
  congas: { name: "Congas", kind: "hits", pan: -0.3, gain: 0.55, bar: [[0, "low-conga", 0.45], [1, "conga", 0.65], [2.5, "conga", 0.5], [3, "low-conga", 0.75], [3.5, "low-conga", 0.65]], plays: (s) => BIG.test(s.name) },
  tambourine: { name: "Tambourine", kind: "hits", pan: 0.25, gain: 0.45, bar: [[1, "tambourine", 0.7], [3, "tambourine", 0.75]], plays: (s, i, all) => CHORUS.test(s.name) || (!all.some((x) => CHORUS.test(x.name)) && BIG.test(s.name) && i > firstVerse(all)) },
  bongos: { name: "Bongos", kind: "hits", pan: -0.35, gain: 0.5, bar: Array.from({ length: 8 }, (_, i) => [i / 2, i % 2 ? "low-bongo" : "high-bongo", i % 4 === 0 ? 0.65 : 0.45]), plays: (s) => BIG.test(s.name) },
  cowbell: { name: "Cowbell", kind: "hits", pan: 0.3, gain: 0.35, bar: [[0, "cowbell", 0.6], [1.5, "cowbell", 0.45], [2, "cowbell", 0.55], [3.5, "cowbell", 0.45]], plays: (s) => BIG.test(s.name) },
  harp: { name: "Harp", kind: "harp", instrument: "harp", pan: -0.2, gain: 0.5 },
  vibes: { name: "Vibraphone", kind: "sparkle", instrument: "vibraphone", pan: 0.2, gain: 0.45 },
  bells: { name: "Bells", kind: "sparkle", instrument: "bells", pan: 0.25, gain: 0.35 },
  musicbox: { name: "Music box", kind: "sparkle", instrument: "music-box", pan: 0.15, gain: 0.35, quietOnly: true },
  flute: { name: "Flute line", kind: "line", instrument: "flute", pan: 0.3, gain: 0.45 },
  pizz: { name: "Plucked strings", kind: "pluck", instrument: "pizzicato", pan: -0.25, gain: 0.45 },
}

function firstVerse(sections) {
  const i = sections.findIndex((section) => /Verse|Groove|Build|Main/.test(section.name))
  return i < 0 ? 0 : i
}

// Color is a couple of sounds, picked fresh each build from the feel's
// set (and a few that suit any song), never the same pair as last time.
const COLOR_ANY = ["shaker", "congas", "vibes", "bells", "flute", "pizz", "harp"]

function rollColor(last, using = []) {
  // Not a sound the band already plays.
  const free = (id) => !using.includes(COLORS[id]?.instrument)
  const own = (COLOR_SETS[arrange.vibes[0]] || COLOR_SETS.plain).filter(free)
  const pool = [...new Set([...own, ...own, ...COLOR_ANY])]
  const lastKey = (last || []).slice().sort().join(",")
  for (let tries = 0; tries < 12; tries++) {
    const bag = [...own, ...own, ...COLOR_ANY.filter((id) => !own.includes(id) && free(id))]
    const picked = []
    while (picked.length < 2 && bag.length) {
      const id = bag.splice(Math.floor(Math.random() * bag.length), 1)[0]
      if (!picked.includes(id)) picked.push(id)
    }
    // At most one shaker-like hit sound, so it isn't all percussion.
    const hits = picked.filter((id) => COLORS[id]?.kind === "hits")
    if (hits.length > 1 && tries < 11) continue
    if (picked.slice().sort().join(",") !== lastKey || pool.length <= 2) return picked
  }
  return own.slice(0, 2)
}

function colorPalette() {
  if (!arrange.band || arrange.bandFor !== arrange.vibes.join(",")) rollBand()
  return arrange.band.color?.length ? arrange.band.color : (COLOR_SETS[arrange.vibes[0]] || COLOR_SETS.plain).slice(0, 2)
}

// The song's chords over its whole length, so color parts fit the harmony.
async function songHarmony(total) {
  const beat = 60 / Math.max(40, state.bpm || 92)
  const tune = melodyLayer()
  let notes = null
  const played = tune ? playedPart(tune) : null
  if (played?.melody) notes = played
  else if (tune && isRecording(tune)) {
    if (tune.notes) notes = tune.notes
    else {
      const audio = sourceAudio(tune)
      if (audio) {
        try {
          notes = await engine.call("readNotes", samplesOf(audio), audio.sampleRate, { bpm: state.bpm || 92, loopSamples: audio.loopSamples || 0 })
        } catch { notes = null }
      }
    }
  }
  if (!notes || !notes.melody?.length) {
    const chordPart = state.layers.map((layer) => playedPart(layer)).find((part) => part?.melody?.some((note) => note.chord))
    notes = chordPart || backingNotes()
  }
  const pass = notes.pass || loopSeconds()
  const plan = SongbirdMusic.planFromNotes(notes.melody, { key: notes.key, pass, total: pass, loop: true, beat: notes.beat || beat, phase: notes.phase || 0, figure: "chords", style: "held" })
  const harmony = plan.harmony || []
  const out = []
  for (let at = 0; at < total - 0.01; at += pass) for (const chord of harmony) if (at + chord.time < total) out.push({ ...chord, time: at + chord.time })
  return { chords: out, key: SongbirdMusic.keyFrom(plan.key || notes.key) }
}

function chordAt(harmony, t) {
  let found = harmony.chords[0]
  for (const chord of harmony.chords) if (chord.time <= t + 0.01) found = chord
  return found
}

// Chord tones in a range, low to high.
function tonesIn(chord, low, high) {
  const out = []
  for (let m = low; m <= high; m++) if (chord.tones.includes(((m % 12) + 12) % 12)) out.push(m)
  return out
}

function colorPart(id, sections, harmony, total) {
  const color = COLORS[id]
  const beat = 60 / Math.max(40, state.bpm || 92)
  const bar = beat * 4
  if (color.kind === "hits") {
    const hits = []
    sections.forEach((section, index) => {
      if (!color.plays(section, index, sections)) return
      for (let t = section.start; t < section.end - 0.01; t += bar) {
        for (const [pos, kind, vel] of color.bar) {
          const time = t + pos * beat
          if (time < section.end - 0.01) hits.push({ kind, time, vel: Math.min(1, vel * (0.92 + Math.random() * 0.16)) })
        }
      }
    })
    return hits.length ? { family: "drums", drums: "kit", kit: "standard", hits } : null
  }
  const melody = []
  const lastBig = [...sections].reverse().find((section) => CHORUS.test(section.name)) || [...sections].reverse().find((section) => BIG.test(section.name))
  sections.forEach((section, index) => {
    if (color.kind === "harp") {
      // A sweep up into each big part, and gentle rolled chords in the quiet ones.
      if (LIFT.test(section.name) && section.start > beat) {
        const chord = chordAt(harmony, section.start)
        const run = tonesIn(chord, 55, 86)
        const notes = run.slice(-10)
        notes.forEach((midi, i) => melody.push({ time: section.start - beat + (i * beat) / notes.length, dur: 1.4, midi, vel: 0.45 + (0.35 * i) / notes.length }))
      }
      if (/Intro|Hush/.test(section.name)) {
        for (let t = section.start; t < section.end - 0.01; t += bar) {
          const roll = tonesIn(chordAt(harmony, t), 52, 76).slice(0, 6)
          roll.forEach((midi, i) => melody.push({ time: t + i * beat * 0.25, dur: bar * 0.9, midi, vel: 0.4 }))
        }
      }
    }
    if (color.kind === "sparkle") {
      const here = color.quietOnly ? /Intro|Outro|Hush/.test(section.name) : section === lastBig || /Outro/.test(section.name)
      if (!here) return
      for (let t = section.start; t < section.end - 0.01; t += beat * 2) {
        const top = tonesIn(chordAt(harmony, t), 72, 91)
        const pick = top.slice(-3)
        pick.forEach((midi, i) => melody.push({ time: t + i * beat * 0.5, dur: beat * 0.9, midi, vel: 0.4 + (i === 0 ? 0.1 : 0) }))
      }
    }
    if (color.kind === "line") {
      // A counter line in the second verse and the bridge: long notes on the
      // chord's third, an answer to the tune rather than a copy of it.
      const verses = sections.filter((item) => /Verse/.test(item.name))
      const here = section === verses[1] || /Bridge/.test(section.name) || (!verses[1] && section === verses[0])
      if (!here) return
      for (const chord of harmony.chords) {
        if (chord.time < section.start - 0.01 || chord.time >= section.end - 0.01) continue
        const third = tonesIn(chord, 72, 86).find((m) => (((m - chord.root) % 12) + 12) % 12 === 3 || (((m - chord.root) % 12) + 12) % 12 === 4)
        if (third) melody.push({ time: chord.time + beat * 0.5, dur: Math.max(beat, Math.min(chord.dur, section.end - chord.time) - beat * 0.6), midi: third, vel: 0.5 })
      }
    }
    if (color.kind === "pluck") {
      if (!/Verse 2|Build|Bridge/.test(section.name) && !(section.name === "Verse" && index > firstVerse(sections))) return
      for (let t = section.start; t < section.end - 0.01; t += beat / 2) {
        const tones = tonesIn(chordAt(harmony, t), 55, 74)
        const step = Math.round((t - section.start) / (beat / 2))
        melody.push({ time: t, dur: beat * 0.3, midi: tones[[0, 2, 1, 2][step % 4] % tones.length], vel: step % 2 ? 0.4 : 0.55 })
      }
    }
  })
  const info = instrumentInfo(color.instrument)
  return melody.length ? { family: info?.family || "keys", instrument: color.instrument, play: "solo", rhythm: "played", melody, key: harmony.key } : null
}

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

// Each feel has a few sounds for each job, so building a song doesn't bring
// in the same band every time. A build picks one of each, never the same
// set as this song's last build; Shuffle the sounds picks again.
const BAND_POOLS = {
  plain: { chords: ["grand-piano", "electric-piano", "steel-guitar", "clean-guitar"], solo: ["clean-guitar", "alto-sax", "flute", "vibraphone"], kit: ["standard", "room"], bass: ["bass", "upright-bass"] },
  chill: { chords: ["electric-piano", "nylon-guitar", "vibraphone"], solo: ["flute", "alto-sax", "vibraphone"], kit: ["brush", "jazz", "room"], bass: ["bass", "upright-bass"] },
  upbeat: { chords: ["steel-guitar", "clean-guitar", "grand-piano", "electric-piano"], solo: ["trumpet", "alto-sax", "synth-lead"], kit: ["standard", "power"], bass: ["bass", "synth-bass"] },
  dreamy: { chords: ["warm-pad", "electric-piano", "harp"], solo: ["vibraphone", "flute", "bells"], kit: ["electronic", "brush"], bass: ["synth-bass", "bass"] },
  warm: { chords: ["grand-piano", "electric-piano", "organ"], solo: ["clean-guitar", "tenor-sax", "flute"], kit: ["room", "standard", "jazz"], bass: ["bass", "upright-bass"] },
  soulful: { chords: ["organ", "grand-piano", "electric-piano"], solo: ["tenor-sax", "alto-sax", "trumpet", "clean-guitar"], kit: ["room", "standard"], bass: ["bass"] },
  funky: { chords: ["clean-guitar", "electric-piano", "organ"], solo: ["alto-sax", "trumpet", "synth-lead"], kit: ["standard", "room"], bass: ["bass", "synth-bass"] },
  rock: { chords: ["rock-guitar", "steel-guitar", "organ"], solo: ["rock-guitar", "synth-lead"], kit: ["power", "standard"], bass: ["bass"] },
  epic: { chords: ["strings", "grand-piano", "warm-pad"], solo: ["french-horn", "cello", "trumpet"], kit: ["power", "room"], bass: ["bass", "synth-bass"] },
  party: { chords: ["warm-pad", "electric-piano", "steel-guitar"], solo: ["synth-lead", "trumpet"], kit: ["808", "electronic"], bass: ["synth-bass"] },
  jazzy: { chords: ["electric-piano", "grand-piano", "jazz-guitar"], solo: ["tenor-sax", "trumpet", "vibraphone", "clarinet"], kit: ["jazz", "brush"], bass: ["upright-bass"] },
  gentle: { chords: ["nylon-guitar", "grand-piano", "steel-guitar", "harp"], solo: ["flute", "violin", "clarinet"], kit: ["brush"], bass: ["upright-bass", "bass"] },
  sad: { chords: ["grand-piano", "nylon-guitar", "strings"], solo: ["cello", "violin", "flute"], kit: ["brush", "room"], bass: ["bass", "upright-bass"] },
  dark: { chords: ["warm-pad", "grand-piano", "strings"], solo: ["cello", "synth-lead"], kit: ["electronic", "power"], bass: ["synth-bass"] },
}
const BAND_EXTRAS = { vocals: ["choir-aahs", "voice-oohs"], guitar: ["clean-guitar", "steel-guitar", "nylon-guitar", "jazz-guitar"] }

function rollBand() {
  const pool = BAND_POOLS[arrange.vibes[0]] || BAND_POOLS.plain
  const last = state.song?.lastBand || {}
  const real = (list, role) => list.filter((id) => (role === "kit" ? KITS.some((kit) => kit.id === id) : instrumentInfo(id)))
  const pick = (list, role, avoid = []) => {
    const ok = real(list, role)
    const fresh = ok.filter((id) => id !== last[role] && id !== arrange.band?.[role] && !avoid.includes(id))
    const from = fresh.length ? fresh : ok.filter((id) => !avoid.includes(id)).length ? ok.filter((id) => !avoid.includes(id)) : ok
    return from[Math.floor(Math.random() * from.length)]
  }
  const band = {}
  for (const role of ["chords", "solo", "kit", "bass"]) band[role] = pick(pool[role] || BAND_POOLS.plain[role], role, role === "solo" ? [band.chords] : [])
  band.vocals = pick(BAND_EXTRAS.vocals, "vocals")
  // Guitar picking is a different guitar from the chords.
  band.guitar = pick(BAND_EXTRAS.guitar, "guitar", [band.chords, band.solo])
  band.color = rollColor(last.color || arrange.band?.color, [band.chords, band.solo])
  arrange.band = band
  arrange.bandFor = arrange.vibes.join(",")
  return band
}

function vibeOf() {
  const first = VIBES.find((vibe) => vibe.id === arrange.vibes[0])
  if (!arrange.band || arrange.bandFor !== arrange.vibes.join(",")) rollBand()
  return { ...PLAIN, ...(first || {}), ...arrange.band }
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
  if (arrange.plan !== "background" || arrange.vibes.length) picks.add("color")
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
  if (id === "vocals") return `Background vocals · ${vibe.vocals === "voice-oohs" ? "Oohs" : "Choir"}`
  if (id === "solo") return `A solo · ${name(vibe.solo)}`
  if (id === "strings") return "Strings · String section"
  if (id === "horns") return "Horns · Horn section"
  if (id === "guitar") return `Guitar picking · ${name(vibe.guitar || "clean-guitar")}`
  if (id === "color") return `Color · ${colorPalette().map((key) => COLORS[key].name.toLowerCase()).join(", ")}`
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
    ${reviewMarkup(adds, facts, busy)}
    <p class="ask">The plan</p>
    <ol class="song-map">${sections.map((section) => `<li><b>${esc(section.name)}</b><span>${formatClock(section.start)}</span><small>${esc(sectionWho(section, adds, sections))}</small></li>`).join("")}</ol>
    <p class="hint">${formatClock(total)} long · ${order.join(", ")}. ${fadeIn ? `Fades in over ${fadeIn} seconds and out` : "Fades out"} over the last ${fadeOut} seconds.</p>
    <div class="choices">${filterChip("Shorter", `data-arrange="short" ${busy}`, arrange.short)}</div>
    <div class="browse-bar"><div class="browse-actions">
      ${filledButton(arrange.working ? esc(arrange.working) : `${ms("auto_awesome")}Build my song${reviewRows(adds, facts).length ? ` with these ${reviewRows(adds, facts).length}` : ""}`, `data-arrange="build" ${busy}`)}
    </div><p class="hint">Undo takes the whole thing back in one tap.</p></div>`
}

// What the build will add, one sound per row, before anything is made:
// take any out, try another sound for it, or add more.
const ADD_ICONS = { drums: "graphic_eq", bass: "music_note", chords: "piano", vocals: "record_voice_over", solo: "mic", strings: "music_note", horns: "campaign", guitar: "music_note", color: "auto_awesome", fills: "graphic_eq" }

function roleOptions(role) {
  const pool = BAND_POOLS[arrange.vibes[0]] || BAND_POOLS.plain
  const list = role === "vocals" || role === "guitar" ? BAND_EXTRAS[role] : [...new Set([...(pool[role] || []), ...(BAND_POOLS.plain[role] || [])])]
  return list.filter((id) => (role === "kit" ? KITS.some((kit) => kit.id === id) : instrumentInfo(id)))
}

function reviewRows(adds, facts) {
  const vibe = vibeOf()
  const name = (id) => instrumentInfo(id)?.name || id
  const rows = []
  for (const item of ADDS) {
    if (!adds.has(item.id)) continue
    if (item.id === "drums" && facts.hasDrums) continue
    if (item.id === "bass" && facts.hasBass) continue
    if (item.id === "color") {
      for (const id of colorPalette()) rows.push({ add: "color", color: id, part: "Color", sound: COLORS[id].name, swap: true })
      continue
    }
    const role = { drums: "kit", bass: "bass", chords: "chords", solo: "solo", vocals: "vocals", guitar: "guitar" }[item.id]
    const sound = item.id === "drums" ? KITS.find((kit) => kit.id === vibe.kit)?.name || "Studio kit"
      : item.id === "solo" ? name(arrange.soloPick || vibe.solo)
        : item.id === "vocals" ? (vibe.vocals === "voice-oohs" ? "Oohs" : "Choir")
          : item.id === "strings" ? "String section" : item.id === "horns" ? "Horn section" : item.id === "fills" ? "Drum fills into the big parts"
            : role ? name(vibe[role] || (item.id === "guitar" ? "clean-guitar" : "")) : ""
    rows.push({ add: item.id, role, part: item.name, sound, swap: !!role && roleOptions(role).length > 1 })
  }
  return rows
}

function reviewMarkup(adds, facts, busy) {
  const rows = reviewRows(adds, facts)
  const already = [facts.hasDrums ? "drums" : "", facts.hasBass ? "bass" : "", facts.hasChords ? "chords" : ""].filter(Boolean)
  const more = ADDS.filter((item) => !adds.has(item.id) && !(item.id === "drums" && facts.hasDrums) && !(item.id === "bass" && facts.hasBass))
  const colorsLeft = adds.has("color") ? Object.keys(COLORS).filter((id) => !colorPalette().includes(id)) : []
  return `<section class="build-review">
    <h3 class="magic-h">${ms("checklist")}What I'll add (${rows.length})</h3>
    <p class="hint">Picked for the feel${already.length ? `. You already have ${already.join(", ")}, so I won't add ${already.length === 1 ? "it" : "them"}` : ""}. Take out anything you don't want, or try another sound for it.</p>
    ${rows.length ? `<ul class="review-list">${rows.map((row) => `<li class="review-row">
      ${ms(ADD_ICONS[row.add] || "music_note")}
      <span class="review-copy"><small>${esc(row.part)}</small><b>${esc(row.sound)}</b></span>
      ${row.swap ? `<button class="icon-btn small" data-review-swap="${row.add}" ${row.color ? `data-color="${row.color}"` : ""} aria-label="Try another sound for ${esc(row.part)}" title="Another sound" ${busy}>${ms("autorenew")}</button>` : ""}
      <button class="icon-btn small" data-review-drop="${row.add}" ${row.color ? `data-color="${row.color}"` : ""} aria-label="Don't add ${esc(row.sound)}" title="Take out" ${busy}>${ms("close")}</button>
    </li>`).join("")}</ul>` : `<p class="empty">Nothing to add. Pick something below, or build with just your sounds.</p>`}
    ${more.length || colorsLeft.length ? `<p class="ask">Add more</p>
    <div class="choices">${more.map((item) => `<button class="chip" data-arrange-add="${item.id}" ${busy}>${ms("add")}${esc(item.name)}</button>`).join("")}${colorsLeft.length && colorPalette().length < 4 ? `<button class="chip" data-review-more-color ${busy}>${ms("add")}Another color sound</button>` : ""}</div>` : ""}
    <div class="choices">${filterChip(`${ms("shuffle")}Different sounds for all`, `data-arrange="shuffle" ${busy}`)}</div>
  </section>`
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
  if (adds.has("color")) {
    const index = sections.indexOf(section)
    for (const id of colorPalette()) {
      const color = COLORS[id]
      let on = false
      if (color.plays) on = color.plays(section, index, sections)
      else if (color.kind === "harp") on = /Intro|Hush/.test(section.name) || LIFT.test(section.name)
      else if (color.kind === "sparkle") on = color.quietOnly ? /Intro|Outro|Hush/.test(section.name) : section === ([...sections].reverse().find((item) => CHORUS.test(item.name)) || [...sections].reverse().find((item) => BIG.test(item.name))) || /Outro/.test(section.name)
      else if (color.kind === "line") on = section === sections.filter((item) => /Verse/.test(item.name))[1] || /Bridge/.test(section.name)
      else if (color.kind === "pluck") on = /Verse 2|Build|Bridge/.test(section.name)
      if (on) who.push(color.kind === "harp" && LIFT.test(section.name) ? "a harp sweep in" : color.name.toLowerCase())
    }
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
    const wanted = ADDS.filter((item) => adds.has(item.id) && item.id !== "fills" && item.id !== "color")
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
      if (item.id === "vocals") await make("vocals", { family: "voices", instrument: vibe.vocals || "choir-aahs", play: "section", rhythm: "played", era: state.era || "today" })
      if (item.id === "strings") await make("strings", { family: "strings", instrument: "strings", play: "section", rhythm: "played", era: state.era || "today" })
      if (item.id === "horns") await make("horns", { family: "horns", instrument: "brass-section", play: "section", rhythm: "played", era: state.era || "today" })
      if (item.id === "guitar") {
        const guitar = vibe.guitar || "clean-guitar"
        await make("guitar", { family: "guitar", instrument: guitar, play: "chords", rhythm: instrumentInfo(guitar)?.strum ? "strum" : "played", era: state.era || "today" }, { name: "Guitar picking" })
      }
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
    if (adds.has("color")) {
      const harmony = await songHarmony(total)
      const palette = colorPalette()
      let n = 0
      for (const id of palette) {
        n++
        step(`Adding color: ${COLORS[id].name.toLowerCase()} (${n} of ${palette.length})…`)
        const part = colorPart(id, sections, harmony, total)
        if (!part) continue
        const layer = await make("color", { ...part, era: state.era || "today", pass: total, total, loop: false, beat: 60 / (state.bpm || 92), phase: 0 }, { name: COLORS[id].name })
        if (layer) {
          layer.gain = COLORS[id].gain
          layer.pan = COLORS[id].pan
          layer.space = Math.max(layer.space || 0, 0.25)
        }
      }
    }
    state.fadeIn = arrange.plan === "background" || arrange.vibes.some((id) => ["chill", "dreamy", "gentle"].includes(id)) ? 3 : 0
    state.fadeOut = arrange.plan === "jam" || arrange.vibes.includes("party") ? 4 : 8
    // One Undo for the whole build. Your selection stays where it was.
    undoStack.splice(mark + 1)
    labelTop("Make it a full song")
    // Next build picks a different band.
    if (state.song && arrange.band) state.song.lastBand = { ...arrange.band }
    arrange.band = null
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
    labelTop("Make it a full song")
    $("save-status").textContent = "That didn't work. Tap Undo to go back to how it was."
    renderInspector()
  }
}

function openArrange(text) {
  // Building a song is always about the whole song.
  if (typeof unpickLayer === "function") unpickLayer()
  state.magicScope = "song"
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
  if (d.arrange === "shuffle") {
    rollBand()
    arrange.soloPick = null
  }
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

// The review list: take a sound out, try another, add another color.
document.body.addEventListener("click", (event) => {
  const node = event.target.closest?.("[data-review-swap],[data-review-drop],[data-review-more-color]")
  if (!node || node.disabled) return
  const d = node.dataset
  vibeOf()
  const band = arrange.band
  if (d.reviewDrop) {
    if (d.reviewDrop === "color" && d.color) {
      band.color = (band.color || []).filter((id) => id !== d.color)
      if (band.color.length) {
        renderInspector()
        return
      }
    }
    const adds = new Set(chosenAdds())
    adds.delete(d.reviewDrop)
    arrange.adds = adds
    arrange.touched = true
  }
  if (d.reviewSwap) {
    if (d.reviewSwap === "color" && d.color) {
      const used = new Set(band.color || [])
      const choices = Object.keys(COLORS).filter((id) => !used.has(id))
      if (choices.length) band.color = band.color.map((id) => (id === d.color ? choices[Math.floor(Math.random() * choices.length)] : id))
    } else {
      const role = { drums: "kit", bass: "bass", chords: "chords", solo: "solo", vocals: "vocals", guitar: "guitar" }[d.reviewSwap]
      const list = roleOptions(role)
      const now = role === "solo" ? arrange.soloPick || band.solo : band[role]
      const next = list[(list.indexOf(now) + 1) % list.length]
      band[role] = next
      if (role === "solo") arrange.soloPick = null
      if (typeof checkPreview === "function" && role !== "kit" && instrumentInfo(next)) {
        // A quick taste of the new sound.
        void SongbirdSampler.playNote(ac(), ac().destination, next, 60, 0.6).then((voice) => voice && window.setTimeout(() => voice.stop(), 500)).catch(() => {})
      }
    }
  }
  if (d.reviewMoreColor != null) {
    const used = new Set(band.color || [])
    const choices = Object.keys(COLORS).filter((id) => !used.has(id))
    if (choices.length) band.color = [...(band.color || []), choices[Math.floor(Math.random() * choices.length)]]
    const adds = new Set(chosenAdds())
    adds.add("color")
    arrange.adds = adds
    arrange.touched = true
  }
  renderInspector()
})
