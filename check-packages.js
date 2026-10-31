const fs = require("fs")
const vm = require("vm")
const path = require("path")

const root = path.join(__dirname, "site")
const context = { console, Math, Float32Array, Array, Object, String, Number, Boolean }
context.globalThis = context
vm.createContext(context)
vm.runInContext(fs.readFileSync(path.join(root, "music.js"), "utf8"), context)
vm.runInContext(fs.readFileSync(path.join(root, "packages.js"), "utf8"), context)

const { SongbirdPackages: P, SongbirdMusic: M } = context
const required = ["id", "version", "name", "description", "subgenres", "traditions", "tempo", "meter", "rhythmVocabulary", "groove", "scales", "chords", "progressions", "melody", "bass", "palette", "vocals", "structures", "hooks", "density", "mixing", "mastering", "compatibility", "hybridWith", "sources", "rules", "tests", "recipe"]
const ids = P.genres.map((genre) => genre.id)
const expected = ["pop", "rnb", "gospel", "worship", "hiphop", "country", "rock", "electronic", "jazz", "classical", "cinematic", "afrobeats", "afrobeat", "latin", "lofi", "ambient", "blues", "funk", "reggae", "folk", "acoustic", "soul", "children", "experimental", "hybrid"]
const failures = []
const check = (name, ok) => { if (!ok) failures.push(name) }

check("25 genres", ids.length === 25 && expected.every((id) => ids.includes(id)))
for (const genre of P.genres) {
  for (const field of required) check(`${genre.id} has ${field}`, genre[field] != null && genre[field] !== "")
  check(`${genre.id} has a recipe`, genre.recipe && Array.isArray(genre.recipe.steps))
  check(`${genre.id} rules name a source and confidence`, genre.rules.every((rule) => rule.source && rule.confidence && rule.tests.length))
  const steps = genre.id === "hybrid" ? P.readySteps("hybrid", "rnb", "gospel") : P.readySteps(genre.id, genre.subgenres[0].id)
  check(`${genre.id} ready steps use engine sounds`, steps.length > 0 && steps.every((step) => P.engineSounds.includes(step.sound)))
  check(`${genre.id} planned text is not a step`, steps.every((step) => step.status === "ready"))
}

const rnb = P.readySteps("rnb", "contemporary-rnb")
check("rnb is chords bass drums", rnb.map((step) => step.sound).join(",") === "Rhodes,Bass,Drums" && rnb[2].pattern === "boom")
check("quiet storm drops drums", !P.readySteps("rnb", "quiet-storm").some((step) => step.sound === "Drums"))
check("bossa does not use son clave", !P.readySteps("latin", "bossa-nova").some((step) => step.sound === "Drums"))
check("salsa uses son clave", P.readySteps("latin", "salsa").some((step) => step.pattern === "sonclave"))
check("afrobeats is not afrobeat", P.get("afrobeats").id !== P.get("afrobeat").id && P.readySteps("afrobeats", "contemporary-afrobeats")[0].sound !== P.readySteps("afrobeat", "afrobeat")[0].sound)
const clean = P.magic.find((item) => item.id === "magic-clean")
check("magic clean noise and clarity are ready", ["noise", "clarity"].every((id) => clean.operations.find((item) => item.id === id).status === "ready"))
check("magic clean breaths stay planned", clean.operations.find((item) => item.id === "breath").status === "planned")
check("children uses the same engine", P.readySteps("children", "educational").every((step) => P.engineSounds.includes(step.sound)))

const sr = M.sampleRate
const hum = new Float32Array(sr * 4)
for (let i = 0; i < hum.length; i++) {
  const t = i / sr
  const midi = t < 1 ? 60 : t < 2 ? 64 : t < 3 ? 67 : 72
  hum[i] = Math.sin(2 * Math.PI * (440 * 2 ** ((midi - 69) / 12)) * t) * 0.4
}
const rendered = rnb.map((step) => M.transformAudio(hum, step.sound, {
  bpm: 84,
  sampleRate: sr,
  era: step.era,
  ...(step.figure ? { figure: step.figure, touch: step.touch } : {}),
  ...(step.pattern ? { pattern: P.pattern(step.pattern) } : {}),
}))
check("rnb workflow renders three layers", rendered.every((item) => item && item.samples && item.samples.length > sr))
const boom = P.pattern("boom")
const hits = M.patternHits(84, 4, boom).filter((hit) => hit.time < 60 / 84 * 4 - 0.01)
check("boom cell has kicks and snares", hits.some((hit) => hit.kind === "kick") && hits.some((hit) => hit.kind === "snare"))

// Loop pedal: a phrase looped to fill the song is built once and looped.
const phrase = hum.subarray(0, sr * 2)
const looped = new Float32Array(sr * 30)
for (let i = 0; i < looped.length; i++) looped[i] = phrase[i % phrase.length]
const loopPiano = M.transformAudio(looped, "Piano", { bpm: 84, sampleRate: sr, loopSamples: phrase.length })
check("a looped layer is built one pass at a time", loopPiano && loopPiano.loop && loopPiano.samples.length === looped.length)
check("every pass of a built loop matches", loopPiano && [0, 1000, 40000].every((i) => loopPiano.samples[i] === loopPiano.samples[i + phrase.length * 7]))
const notLooped = hum.slice()
const wholePiano = M.transformAudio(notLooped, "Piano", { bpm: 84, sampleRate: sr, loopSamples: sr })
check("audio that is not a loop renders whole", wholePiano && !wholePiano.loop)
const packaged = M.transformSteps(looped, rnb.map((step) => ({ sound: step.sound, options: { era: step.era, figure: step.figure, touch: step.touch, pattern: step.pattern ? P.pattern(step.pattern) : undefined } })), { bpm: 84, sampleRate: sr, loopSamples: phrase.length })
check("a package builds every ready step", packaged.length === rnb.length && packaged.every((item) => item && item.samples.length >= sr * 29))
const enhanced = M.enhanceAudio(looped, sr, { mode: "clear", loopSamples: phrase.length })
check("enhance keeps a loop a loop", enhanced.length === looped.length && enhanced[500] === enhanced[500 + phrase.length * 3])

// Performance plans: a slightly late, slightly sharp C major hum.
const tuneHum = new Float32Array(Math.round(sr * (60 / 92) * 8))
const tuneNotes = [[60, 0, 1], [62, 1, 1], [64, 2, 1], [67, 3, 1], [64, 4, 2], [62, 6, 1], [60, 7, 1]]
for (const [m, b, d] of tuneNotes) { const t0 = Math.floor((b * (60 / 92) + 0.05) * sr); let ph = 0; for (let i = 0; i < d * (60 / 92) * 0.85 * sr; i++) { ph += 2 * Math.PI * 440 * 2 ** ((m - 69 + 0.25) / 12) / sr; tuneHum[t0 + i] = 0.3 * Math.sin(ph) } }
const planned = M.planPerformance(tuneHum, sr, { bpm: 92, figure: "solo", low: 48, high: 84 })
check("a hum becomes its notes, on the beat, in tune", planned.events.map((e) => e.midi).join(",") === "60,62,64,67,64,62,60" && planned.events.every((e) => Math.abs(e.time / (60 / 92) - Math.round(e.time / (60 / 92))) < 1e-6))
check("the key of a C major tune is C major", planned.key.root === 0 && !planned.key.minor)
check("chords sit under the tune", M.planPerformance(tuneHum, sr, { bpm: 92, figure: "chords", low: 48, high: 84 }).events.length === 21)
const up = M.shiftPitch(tuneHum, sr, 2)
check("transpose keeps the length", Math.abs(up.length / 44100 - tuneHum.length / sr) < 0.01)
const slower = M.timeStretch(looped, sr, 1.25, phrase.length)
check("a slower loop is still a loop", slower.loopSamples === Math.round(phrase.length * 44100 / sr * 1.25) && Math.abs(slower.samples.length - Math.round(looped.length * 44100 / sr * 1.25)) <= 1)

if (failures.length) {
  console.error(failures.join("\n"))
  process.exit(1)
}
console.log(`ok ${expected.length} genres, rnb rendered ${rendered.map((item) => item.samples.length).join(", ")} samples`)
