// Songbird sound engine, off the main thread.
// Runs the same music.js and packages.js the page uses, so the studio keeps
// scrolling, animating, and playing while a layer is being built.
importScripts("music.js", "packages.js")

function transferList(value, list = []) {
  if (!value || typeof value !== "object") return list
  if (ArrayBuffer.isView(value) && value.buffer instanceof ArrayBuffer && !list.includes(value.buffer)) {
    list.push(value.buffer)
    return list
  }
  if (Array.isArray(value)) {
    for (const item of value) transferList(item, list)
    return list
  }
  for (const key of Object.keys(value)) transferList(value[key], list)
  return list
}

self.onmessage = (event) => {
  const { id, fn, args } = event.data || {}
  try {
    const run = self.SongbirdMusic && self.SongbirdMusic[fn]
    if (typeof run !== "function") throw new Error(`Unknown engine call ${fn}`)
    const result = run(...(args || []))
    self.postMessage({ id, ok: true, result }, transferList(result))
  } catch (error) {
    self.postMessage({ id, ok: false, error: String(error && error.message ? error.message : error) })
  }
}
