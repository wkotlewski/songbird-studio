// Song files. A whole song (every layer, its sound, the mix, the sections,
// the speed and key) packed into one .songbird file. Send it by text, email,
// AirDrop, or a drive; whoever opens it in Songbird gets the song in their
// My Music, ready to play and keep building on. Nothing goes through a server.
//
// Layout: "SONGBIRD" (8 bytes), version (1 byte), flags (1 byte: 1 = gzip),
// then the body (gzipped when the flag says so): a 4-byte little-endian JSON
// length, the JSON, then each layer's sound as 16-bit samples, back to back.
// Each layer's samples are stored as the change from the last sample, high
// bytes first then low bytes, which squeezes to about a fifth the size.

const SONG_FILE_MAGIC = "SONGBIRD"
const SONG_FILE_VERSION = 1
const SONG_FILE_EXT = ".songbird"
const SONG_FILE_TYPE = "application/x-songbird"

const songFile = { busy: false, note: "", ready: null, readyFor: null }

const SONG_FIELDS = ["title", "author", "lengthSec", "shape", "intent", "bpm", "genre", "subgenre", "blend", "tempoSource", "tempoLocked", "sections", "loopSec", "transpose", "fadeIn", "fadeOut", "era", "songKey"]

function songFileName(title) {
  const clean = String(title || "Untitled song").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60)
  return (clean || "Untitled song") + SONG_FILE_EXT
}

function readStoredAudio(songId, layerIds) {
  if (typeof indexedDB === "undefined") return Promise.resolve(new Map())
  return audioDb().then((db) => Promise.all(layerIds.map((layerId) => new Promise((resolve) => {
    const req = db.transaction("audio", "readonly").objectStore("audio").get(`${songId}:${layerId}:audio`)
    req.onsuccess = () => resolve([layerId, req.result || null])
    req.onerror = () => resolve([layerId, null])
  })))).then((pairs) => new Map(pairs.filter(([, record]) => record?.samples?.length))).catch(() => new Map())
}

function writeStoredAudio(songId, records) {
  if (typeof indexedDB === "undefined" || !records.length) return Promise.resolve(false)
  return audioDb().then((db) => new Promise((resolve) => {
    const tx = db.transaction("audio", "readwrite")
    const store = tx.objectStore("audio")
    for (const { layerId, record } of records) store.put(record, `${songId}:${layerId}:audio`)
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => resolve(false)
  })).catch(() => false)
}

function toPcm16(samples) {
  const out = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]))
    out[i] = v < 0 ? Math.round(v * 32768) : Math.round(v * 32767)
  }
  return out
}

function fromPcm16(pcm, length) {
  const out = new Float32Array(length)
  const n = pcm.length
  if (!n) return out
  // A looped layer may be stored as one pass; lay it end to end again.
  for (let i = 0; i < length; i++) {
    const v = pcm[i % n]
    out[i] = v < 0 ? v / 32768 : v / 32767
  }
  return out
}

function planes(pcm) {
  const n = pcm.length
  const out = new Uint8Array(n * 2)
  let prev = 0
  for (let i = 0; i < n; i++) {
    const d = (pcm[i] - prev) & 0xffff
    prev = pcm[i]
    out[i] = d >> 8
    out[n + i] = d & 255
  }
  return out
}

function unplanes(bytes, n) {
  const pcm = new Int16Array(n)
  let prev = 0
  for (let i = 0; i < n; i++) {
    prev = (prev + ((bytes[i] << 8) | bytes[n + i])) << 16 >> 16
    pcm[i] = prev
  }
  return pcm
}

// If the sound is one pass repeated exactly, keep only that pass.
function onePass(pcm, loopSamples) {
  if (!(loopSamples > 0) || loopSamples >= pcm.length) return pcm
  for (let i = loopSamples; i < pcm.length; i++) if (pcm[i] !== pcm[i - loopSamples]) return pcm
  return pcm.slice(0, loopSamples)
}

async function squeeze(bytes, mode) {
  if (typeof CompressionStream === "undefined" && mode === "compress") return null
  if (typeof DecompressionStream === "undefined" && mode === "expand") throw new Error("This browser can't open song files yet. Update it and try again.")
  const stream = new Blob([bytes]).stream().pipeThrough(mode === "compress" ? new CompressionStream("gzip") : new DecompressionStream("gzip"))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function packSong(song) {
  const layers = (song.layers || []).map((layer) => ({ ...layer }))
  const stored = await readStoredAudio(song.id, layers.map((layer) => layer.id))
  const blobs = []
  let offset = 0
  for (const layer of layers) {
    const record = stored.get(layer.id)
    if (!record) continue
    const samples = record.samples instanceof Float32Array ? record.samples : Float32Array.from(record.samples)
    const pcm = onePass(toPcm16(samples), record.loopSamples || 0)
    const bytes = planes(pcm)
    layer.fileAudio = { sampleRate: record.sampleRate || 44100, length: samples.length, loopSamples: record.loopSamples || 0, offset, count: pcm.length }
    blobs.push(bytes)
    offset += bytes.length
  }
  const meta = { app: "Songbird", version: SONG_FILE_VERSION, made: new Date().toISOString(), song: {}, layers }
  for (const key of SONG_FIELDS) if (song[key] !== undefined) meta.song[key] = song[key]
  const json = new TextEncoder().encode(JSON.stringify(meta))
  const body = new Uint8Array(4 + json.length + offset)
  new DataView(body.buffer).setUint32(0, json.length, true)
  body.set(json, 4)
  let at = 4 + json.length
  for (const bytes of blobs) {
    body.set(bytes, at)
    at += bytes.length
  }
  const packed = await squeeze(body, "compress").catch(() => null)
  const head = new Uint8Array(10)
  head.set(new TextEncoder().encode(SONG_FILE_MAGIC), 0)
  head[8] = SONG_FILE_VERSION
  head[9] = packed ? 1 : 0
  return new Blob([head, packed || body], { type: SONG_FILE_TYPE })
}

async function unpackSong(buffer) {
  const bytes = new Uint8Array(buffer)
  if (bytes.length < 14 || new TextDecoder().decode(bytes.slice(0, 8)) !== SONG_FILE_MAGIC) throw new Error("That isn't a Songbird song file.")
  if (bytes[8] > SONG_FILE_VERSION) throw new Error("This song was made with a newer Songbird. Reload the page and try again.")
  const body = bytes[9] & 1 ? await squeeze(bytes.subarray(10), "expand") : bytes.subarray(10)
  const view = new DataView(body.buffer, body.byteOffset, body.byteLength)
  const jsonLength = view.getUint32(0, true)
  if (jsonLength + 4 > body.length) throw new Error("That song file is incomplete. Ask for it again.")
  const meta = JSON.parse(new TextDecoder().decode(body.subarray(4, 4 + jsonLength)))
  if (!meta || !Array.isArray(meta.layers)) throw new Error("That isn't a Songbird song file.")
  const pcmStart = 4 + jsonLength
  const sounds = []
  for (const layer of meta.layers) {
    const info = layer.fileAudio
    delete layer.fileAudio
    if (!info || !(info.count > 0)) continue
    const start = pcmStart + info.offset
    if (start + info.count * 2 > body.length) continue
    const pcm = unplanes(body.subarray(start, start + info.count * 2), info.count)
    sounds.push({ layerId: layer.id, record: { sampleRate: info.sampleRate || 44100, samples: fromPcm16(pcm, info.length || info.count), loopSamples: info.loopSamples || 0 } })
  }
  return { meta, sounds }
}

function freshTitle(title) {
  const base = String(title || "Untitled song")
  const taken = new Set(state.songs.map((song) => song.title))
  if (!taken.has(base)) return base
  for (let n = 2; n < 100; n++) if (!taken.has(`${base} (${n})`)) return `${base} (${n})`
  return base
}

async function openSongFile(file) {
  if (!file) return
  if (songFile.busy) return
  songFile.busy = true
  const say = (text) => {
    const status = $("save-status")
    if (status) status.textContent = text
    const lib = $("library-note")
    if (lib) {
      lib.textContent = text
      lib.hidden = !text
    }
  }
  say(`Opening ${file.name || "the song"}…`)
  try {
    const { meta, sounds } = await unpackSong(await file.arrayBuffer())
    // Fresh layer ids, so opening the same file twice makes two separate songs.
    const ids = new Map(meta.layers.map((layer) => [layer.id, uid()]))
    for (const layer of meta.layers) {
      layer.id = ids.get(layer.id)
      if (layer.sourceId && ids.has(layer.sourceId)) layer.sourceId = ids.get(layer.sourceId)
      if (layer.make?.sourceId && ids.has(layer.make.sourceId)) layer.make = { ...layer.make, sourceId: ids.get(layer.make.sourceId) }
    }
    for (const sound of sounds) sound.layerId = ids.get(sound.layerId)
    const song = { id: uid(), privacy: "Shared", demo: false, sharedWith: [], layers: meta.layers, received: true }
    for (const key of SONG_FIELDS) if (meta.song?.[key] !== undefined) song[key] = meta.song[key]
    song.title = freshTitle(song.title)
    song.audioKept = sounds.length > 0
    if (song.author) song.credit = `Author: ${song.author}. Shared song file.`
    await writeStoredAudio(song.id, sounds)
    state.songs.unshift(song)
    if (!saveSongs()) say("This device is out of room for songs. Delete one and try again.")
    renderSongs()
    openSong(song.id)
    const parts = song.layers.length
    for (let i = 0; i < 100 && state.openingSound && state.song?.id === song.id; i++) await new Promise((done) => setTimeout(done, 100))
    say(`${song.title} is in your songs${song.author ? `, from ${song.author}` : ""}. ${parts} ${parts === 1 ? "layer" : "layers"}. Press play.`)
    setTimeout(() => {
      const lib = $("library-note")
      if (lib) lib.hidden = true
    }, 6000)
  } catch (err) {
    say(err?.message && /Songbird|song file|browser/.test(err.message) ? err.message : "That song file didn't open. Ask for it again.")
  } finally {
    songFile.busy = false
  }
}

function pickSongFile() {
  let input = $("song-file-input")
  if (!input) {
    input = document.createElement("input")
    input.type = "file"
    input.id = "song-file-input"
    input.hidden = true
    // iPhone greys out file types it doesn't know, so only desktops filter.
    if (!appleMobile) input.accept = `${SONG_FILE_EXT},${SONG_FILE_TYPE}`
    input.addEventListener("change", () => {
      const file = input.files?.[0]
      input.value = ""
      if (file) void openSongFile(file)
    })
    document.body.appendChild(input)
  }
  input.click()
}

function saveBlobAs(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}

function shareNote(text) {
  songFile.note = text
  for (const node of document.querySelectorAll(".song-file-note")) {
    node.textContent = text
    node.hidden = !text
  }
}

async function sendFile(file) {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name.replace(SONG_FILE_EXT, ""), text: "A song from Songbird. Open it in Songbird to play it and add to it." })
      shareNote("Sent. They open it in Songbird with Open a song file.")
      return true
    } catch (err) {
      if (err?.name === "AbortError") {
        shareNote("")
        return true
      }
      if (err?.name === "NotAllowedError") return false
    }
  }
  saveBlobAs(file, file.name)
  shareNote(`Saved ${file.name}. Send it to anyone; they open it in Songbird with Open a song file.`)
  return true
}

async function shareSongFile(id) {
  // A file that's already packed: this tap is the one that sends it.
  if (songFile.ready && songFile.readyFor === id) {
    const file = songFile.ready
    songFile.ready = null
    songFile.readyFor = null
    renderSongFileButtons()
    await sendFile(file)
    return
  }
  if (songFile.busy) return
  const songId = id || state.song?.id
  if (state.song && state.song.id === songId) {
    rememberSong()
    await persistSongAudio()
  }
  const song = state.songs.find((item) => item.id === songId)
  if (!song || song.demo) {
    shareNote("Examples can't be sent as files. Make your own song and send that.")
    return
  }
  if (!song.layers?.length) {
    shareNote("Add a layer first, then send the song.")
    return
  }
  songFile.busy = true
  shareNote("Packing the song…")
  const started = performance.now()
  try {
    const blob = await packSong(song)
    const file = new File([blob], songFileName(song.title), { type: SONG_FILE_TYPE })
    // Phones only open the share sheet straight from a tap. If packing took
    // a while, ask for one more tap.
    if (performance.now() - started > 900 && navigator.canShare?.({ files: [file] })) {
      songFile.ready = file
      songFile.readyFor = songId
      shareNote(`Ready (${sizeLabel(file.size)}). Tap Send it now.`)
      renderSongFileButtons()
      return
    }
    const sent = await sendFile(file)
    if (!sent) {
      songFile.ready = file
      songFile.readyFor = songId
      shareNote(`Ready (${sizeLabel(file.size)}). Tap Send it now.`)
      renderSongFileButtons()
    }
  } catch {
    shareNote("The song didn't pack. Try again.")
  } finally {
    songFile.busy = false
  }
}

function sizeLabel(bytes) {
  return bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`
}

function songFileButton(id) {
  const ready = songFile.ready && songFile.readyFor === id
  return `<button class="btn ${ready ? "btn-primary" : "btn-secondary"} song-file-send" data-action="send-song-file" data-id="${id}"><span class="ms" aria-hidden="true">${ready ? "share" : "ios_share"}</span>${ready ? "Send it now" : "Send the song file"}</button>`
}

function renderSongFileButtons() {
  for (const node of document.querySelectorAll(".song-file-send")) node.outerHTML = songFileButton(node.dataset.id)
}

function songFileBox(id) {
  return `<div class="song-file-box">
    ${songFileButton(id)}
    <p class="hint">Sends every layer as one file by text, email, or AirDrop. They open it in Songbird and get their own copy: what they change stays on their device, and your song stays as it is.</p>
    <p class="hint song-file-note" ${songFile.note ? "" : "hidden"}>${esc(songFile.note)}</p>
  </div>`
}

document.body.addEventListener("click", (event) => {
  const node = event.target.closest?.("[data-action]")
  if (!node) return
  if (node.dataset.action === "send-song-file") {
    event.preventDefault()
    void shareSongFile(node.dataset.id)
  }
  if (node.dataset.action === "open-song-file") {
    event.preventDefault()
    pickSongFile()
  }
})

// Drop a song file anywhere on the page.
document.addEventListener("dragover", (event) => {
  if ([...(event.dataTransfer?.types || [])].includes("Files")) {
    event.preventDefault()
    document.body.classList.add("file-over")
  }
})
document.addEventListener("dragleave", (event) => {
  if (!event.relatedTarget) document.body.classList.remove("file-over")
})
document.addEventListener("drop", (event) => {
  const file = [...(event.dataTransfer?.files || [])].find((item) => /\.songbird$/i.test(item.name))
  document.body.classList.remove("file-over")
  if (!file) return
  event.preventDefault()
  void openSongFile(file)
})

// Installed on a computer, Songbird opens .songbird files from the desktop.
if ("launchQueue" in window) {
  window.launchQueue.setConsumer(async (params) => {
    for (const handle of params?.files || []) {
      const file = await handle.getFile().catch(() => null)
      if (file) await openSongFile(file)
    }
  })
}
