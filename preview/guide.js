// Songbird's guide: a card above the bottom bar that always says what to
// do next, in plain words, with a few one-tap ideas picked for your song.
// Record → Magic → Add more → Make it sound great → Save. You can tap any
// step, skip ahead, or hide the tips.

const GUIDE_STEPS = [
  { id: "record", short: "Record", icon: "mic" },
  { id: "magic", short: "Magic", icon: "wand_stars" },
  { id: "add", short: "Add", icon: "library_add" },
  { id: "polish", short: "Polish", icon: "tune" },
  { id: "save", short: "Save", icon: "download" },
]

const guide = {
  working: "",
  reply: "",
  replyWarn: false,
  pick: null, // a step the person chose, instead of the one Songbird suggests
  mixed: false,
  saved: false,
  closeAfterTake: 0,
}

function guideHidden() {
  try { return localStorage.getItem("songbird-guide-hidden") === "1" } catch { return false }
}

function setGuideHidden(hidden) {
  try { localStorage.setItem("songbird-guide-hidden", hidden ? "1" : "0") } catch { /* not saved, still works */ }
}

function songFacts() {
  const withSound = state.layers.filter((layer) => buffers.get(layer.id + ":audio"))
  const kinds = new Set(withSound.map((layer) => (typeof kindOf === "function" ? kindOf(layer) : "")))
  const recordings = withSound.filter((layer) => (typeof isRecording === "function" ? isRecording(layer) : true))
  const parts = withSound.filter((layer) => layer.generated || layer.make || layer.packageId)
  return {
    count: withSound.length,
    recordings: recordings.length,
    parts: parts.length,
    tight: withSound.some((layer) => layer.tight),
    hasMelody: [...kinds].some((kind) => kind && kind !== "drums"),
    hasDrums: kinds.has("drums"),
    hasBass: kinds.has("bass"),
    hasChords: kinds.has("keys") || kinds.has("guitar") || kinds.has("strings") || kinds.has("synths"),
    hasHorns: kinds.has("horns"),
    hasVoices: kinds.has("voices"),
    onlyDrums: kinds.size === 1 && kinds.has("drums"),
  }
}

// The step Songbird thinks comes next.
function suggestedStep(facts) {
  if (!facts.count) return "record"
  if (!facts.parts && !facts.tight) return "magic"
  if (facts.count < 3) return "add"
  if (!guide.mixed) return "polish"
  return "save"
}

function currentStep() {
  const facts = songFacts()
  const suggested = suggestedStep(facts)
  return { facts, suggested, step: guide.pick || suggested }
}

// Ideas that fit what's in the song right now.
function ideasFor(step, facts) {
  const ideas = []
  const say = (label, icon, request) => ideas.push({ label, icon, request })
  const go = (label, icon, action) => ideas.push({ label, icon, action })
  if (step === "record") {
    go("Record", "mic", "record")
    go("Play the keys or drums", "piano", "play")
    go("Pick a starter sound", "music_note", "starter")
    return ideas
  }
  if (step === "magic") {
    if (facts.onlyDrums) {
      say("Make it a drum kit", "graphic_eq", "turn my claps into drums")
      go("Hum a tune on top", "mic", "record")
    } else {
      say("Turn it into piano", "piano", "turn my humming into piano")
      say("Add a beat", "graphic_eq", "add drums")
      say("Add piano chords", "piano", "add piano chords")
    }
    say("Fix my timing & notes", "check", "make it tight")
    go("More sounds", "library_music", "browse")
    return ideas
  }
  if (step === "add" || step === "polish") {
    // Once there's a groove, Songbird can finish the song.
    if (facts.count >= 1 && !state.sections?.some((section) => /^arr-/.test(section.id))) ideas.push({ label: "Make it a full song", icon: "auto_awesome", action: "arrange" })
  }
  if (step === "add") {
    if (!facts.hasDrums) say("Add a beat", "graphic_eq", "add drums")
    if (facts.hasMelody && !facts.hasBass) say("Add a bass line", "speaker", "add a bass line")
    if (facts.hasMelody && !facts.hasChords) say("Add guitar", "music_note", "add guitar chords")
    if (facts.hasMelody && !facts.hasVoices) say("Add a choir", "record_voice_over", "add harmony vocals")
    if (facts.hasMelody && !facts.hasHorns) say("Add horns", "campaign", "add a horn section")
    if (facts.hasMelody) say("Add strings", "airwave", "add strings")
    if (!facts.hasMelody) go("Hum a tune on top", "mic", "record")
    const picks = ideas.slice(0, 4)
    picks.push({ label: "More sounds", icon: "library_music", action: "browse" })
    picks.push({ label: "Record another sound", icon: "mic", action: "record" })
    return picks
  }
  if (step === "polish") {
    go("Balance it for me", "tune", "balance")
    if (!facts.tight) say("Fix my timing & notes", "check", "make it tight")
    if (state.layers.some((layer) => isRecording(layer))) say("Remove hiss", "noise_control_off", "remove hiss")
    if (!state.fadeOut) say("Fade out at the end", "volume_down", "fade out at the end")
    say("Add more echo", "spatial_audio", "more echo")
    say("More room sound", "speaker", "more reverb")
    return ideas
  }
  go("Save my song", "download", "save")
  go("Give it a name", "edit", "name")
  go("Keep adding", "library_add", "add")
  return ideas
}

function guideText(step, facts) {
  const name = (state.layers.find((layer) => buffers.get(layer.id + ":audio") && (typeof isRecording !== "function" || isRecording(layer)))?.name) || "your sound"
  switch (step) {
    case "record":
      return {
        title: "Make your first sound",
        hint: "Hum, sing, or clap, or play the piano, guitar, or drums right on the screen. We count 1, 2, 3, 4, then you go. It plays back over and over, like a loop pedal.",
      }
    case "magic":
      return {
        title: "Nice! Now add some magic",
        hint: facts.onlyDrums
          ? "Turn your claps into a real drum kit, then hum a tune on top."
          : `Turn ${name} into an instrument, or add a beat under it. Or tap Magic and say what you want.`,
      }
    case "add":
      return {
        title: "Add another sound",
        hint: "Stack sounds like a band. Record a new part, or let Magic play one for you.",
      }
    case "polish":
      return {
        title: "Make it sound great",
        hint: "One tap balances everything so every sound can be heard. You can still change any sound in Sounds.",
      }
    default:
      return {
        title: guide.saved ? "Saved! Want to keep going?" : "Your song is ready",
        hint: guide.saved ? "Your song is on your phone. You can keep adding, and save again any time." : "Give it a name, then save it to your phone to play and share.",
      }
  }
}

function renderGuide() {
  const box = $("guide")
  if (!box) return
  const onStudio = document.body.dataset.screen === "studio"
  if (!onStudio) {
    box.hidden = true
    return
  }
  box.hidden = false
  const { facts, suggested, step } = currentStep()
  const at = GUIDE_STEPS.findIndex((item) => item.id === step)
  const busy = state.recording || state.counting || state.transforming
  if (guideHidden()) {
    box.className = "guide small"
    box.innerHTML = `<button class="guide-peek" data-guide="show"><span class="ms" aria-hidden="true">lightbulb</span>Next: ${esc(guideText(suggested, facts).title)}<span class="ms" aria-hidden="true">expand_less</span></button>`
    return
  }
  const { title, hint } = guideText(step, facts)
  const note = guide.working
    ? `<p class="guide-note working"><span class="ms" aria-hidden="true">wand_stars</span>${esc(guide.working)}… working on it</p>`
    : guide.reply
      ? `<p class="guide-note ${guide.replyWarn ? "warn" : ""}"><span class="ms" aria-hidden="true">${guide.replyWarn ? "lightbulb" : "check"}</span>${esc(guide.reply)}</p>`
      : ""
  const ideas = ideasFor(step, facts)
  box.className = "guide"
  box.innerHTML = `
    <div class="guide-steps" role="tablist" aria-label="Song steps">
      ${GUIDE_STEPS.map((item, index) => `<button class="guide-step ${index === at ? "on" : ""} ${index < GUIDE_STEPS.findIndex((s) => s.id === suggested) ? "done" : ""}" data-guide-step="${item.id}" role="tab" aria-selected="${index === at}">
        <span class="dot">${index < GUIDE_STEPS.findIndex((s) => s.id === suggested) ? '<span class="ms" aria-hidden="true">check</span>' : index + 1}</span><span class="label">${item.short}</span></button>`).join("")}
      <button class="guide-hide" data-guide="hide" aria-label="Hide tips" title="Hide tips"><span class="ms" aria-hidden="true">expand_more</span></button>
    </div>
    <p class="guide-title">${esc(title)}</p>
    ${note}
    <p class="guide-hint">${esc(hint)}</p>
    <div class="guide-ideas">${ideas.map((idea, index) => `<button class="btn ${index === 0 ? "btn-primary" : "btn-secondary"}" ${busy ? "disabled" : ""} ${idea.request ? `data-guide-say="${esc(idea.request)}"` : `data-guide-do="${idea.action}"`}><span class="ms" aria-hidden="true">${idea.icon}</span>${esc(idea.label)}</button>`).join("")}</div>`
}

async function guideDo(action) {
  if (action === "record") {
    state.recordMode = "mic"
    setPanel("record")
    return
  }
  if (action === "play") {
    state.recordMode = "play"
    setPanel("record")
    warmPad()
    return
  }
  if (action === "starter") {
    state.recordMode = "vibe"
    setPanel("record")
    return
  }
  if (action === "balance") {
    applyMix("clear")
    guide.mixed = true
    guide.pick = null
    guide.reply = "Balanced. Every sound has its own place now. Undo puts it back."
    guide.replyWarn = false
    $("save-status").textContent = guide.reply
    renderGuide()
    return
  }
  if (action === "save") {
    await downloadMix()
    guide.saved = true
    guide.reply = "Saved to your phone."
    guide.replyWarn = false
    renderGuide()
    return
  }
  if (action === "name") {
    const title = $("song-title")
    title?.focus()
    title?.select?.()
    return
  }
  if (action === "arrange") {
    openArrange()
    return
  }
  if (action === "browse") {
    openBrowser()
    return
  }
  if (action === "add") {
    guide.pick = "add"
    renderGuide()
  }
}

document.body.addEventListener("click", (event) => {
  const node = event.target.closest?.("[data-guide],[data-guide-step],[data-guide-say],[data-guide-do]")
  if (!node || node.disabled) return
  const d = node.dataset
  if (d.guide === "hide") {
    setGuideHidden(true)
    renderGuide()
  }
  if (d.guide === "show") {
    setGuideHidden(false)
    renderGuide()
  }
  if (d.guideStep) {
    guide.pick = d.guideStep === currentStep().suggested ? null : d.guideStep
    renderGuide()
  }
  if (d.guideSay) {
    guide.pick = null
    // Magic does it right here, and the guide says what changed.
    guide.working = node.textContent.trim()
    guide.reply = ""
    renderGuide()
    void runAndShow(d.guideSay).then(() => {
      const last = state.magicChat[state.magicChat.length - 1]
      guide.working = ""
      guide.reply = last ? last.did : ""
      guide.replyWarn = !!last?.warn
      renderGuide()
    })
  }
  if (d.guideDo) void guideDo(d.guideDo)
})

// Keep the guide in step with the song.
const guideRenderTracks = renderTracks
renderTracks = function () {
  guideRenderTracks()
  renderGuide()
}
const guideApplyMix = applyMix
applyMix = function (id) {
  guideApplyMix(id)
  guide.mixed = true
  renderGuide()
}
const guideOpenSong = openSong
openSong = function (id) {
  guide.pick = null
  guide.mixed = false
  guide.saved = false
  guideOpenSong(id)
  renderGuide()
}
const guideSetScreen = setScreen
setScreen = function (screen) {
  guideSetScreen(screen)
  renderGuide()
}

// After a loop is kept, close the record sheet so the next step shows.
const guideKeepLoop = keepLoopTake
keepLoopTake = async function () {
  const before = state.layers.length
  await guideKeepLoop()
  if (state.layers.length > before) guide.reply = ""
  if (state.layers.length > before && !guideHidden()) {
    window.clearTimeout(guide.closeAfterTake)
    guide.closeAfterTake = window.setTimeout(() => {
      if (state.panel === "record" && !state.recording && !state.counting && document.body.classList.contains("sheet-open") && !window.matchMedia("(min-width: 1100px)").matches) closePanel()
      renderGuide()
    }, 1800)
  }
  renderGuide()
}

renderGuide()
