// Songbird take capture: the microphone exactly as it arrives, lossless,
// with no codec in between. The page turns the samples into a WAV file.
class SongbirdCapture extends AudioWorkletProcessor {
  constructor() {
    super()
    this.on = true
    this.started = false
    this.chunk = new Float32Array(16384)
    this.count = 0
    this.port.onmessage = (event) => {
      if (event.data !== "stop") return
      this.flush()
      this.on = false
      this.port.postMessage({ done: true })
    }
  }

  flush() {
    if (!this.count) return
    const out = this.chunk.slice(0, this.count)
    this.port.postMessage({ samples: out }, [out.buffer])
    this.count = 0
  }

  process(inputs) {
    if (!this.on) return false
    const input = inputs[0]
    if (input && input.length) {
      if (!this.started) {
        this.started = true
        this.port.postMessage({ start: currentTime })
      }
      const left = input[0]
      const right = input[1]
      for (let i = 0; i < left.length; i++) {
        this.chunk[this.count++] = right ? (left[i] + right[i]) * 0.5 : left[i]
        if (this.count === this.chunk.length) this.flush()
      }
    }
    return true
  }
}

registerProcessor("songbird-capture", SongbirdCapture)
