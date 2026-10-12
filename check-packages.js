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
check("magic clean is not ready", P.magic.find((item) => item.id === "magic-clean").operations.every((item) => item.status === "planned"))
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

if (failures.length) {
  console.error(failures.join("\n"))
  process.exit(1)
}
console.log(`ok ${expected.length} genres, rnb rendered ${rendered.map((item) => item.samples.length).join(", ")} samples`)
