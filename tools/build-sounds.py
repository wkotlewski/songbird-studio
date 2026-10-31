"""Build Songbird's instrument samples from the FluidR3 GM soundfont.

FluidR3 GM is by Frank Wen and released under the MIT license.
Needs fluidsynth, ffmpeg, and FluidR3_GM.sf2 (Ubuntu: fluid-soundfont-gm).
Writes site/sounds/<instrument>/<midi>.mp3 and site/sounds/index.json.

    python3 tools/build-sounds.py
"""
import json, os, struct, subprocess, sys, tempfile, wave
import array

SF2 = os.environ.get("SF2", "/usr/share/sounds/sf2/FluidR3_GM.sf2")
OUT = os.path.join(os.path.dirname(__file__), "..", "site", "sounds")
RATE = 44100

# id, GM program, lowest, highest, step, hold seconds, family
MELODIC = [
    ("grand-piano", 0, 33, 96, 3, 3.2, "keys"),
    ("electric-piano", 4, 36, 90, 3, 3.0, "keys"),
    ("organ", 16, 36, 90, 4, 2.6, "keys"),
    ("church-organ", 19, 36, 84, 4, 3.0, "keys"),
    ("harpsichord", 6, 36, 88, 4, 2.4, "keys"),
    ("nylon-guitar", 24, 40, 84, 3, 2.8, "guitar"),
    ("steel-guitar", 25, 40, 84, 3, 2.8, "guitar"),
    ("jazz-guitar", 26, 40, 84, 3, 2.6, "guitar"),
    ("clean-guitar", 27, 40, 84, 3, 2.6, "guitar"),
    ("rock-guitar", 29, 40, 84, 3, 2.4, "guitar"),
    ("banjo", 105, 48, 84, 4, 2.0, "guitar"),
    ("bass", 33, 28, 60, 3, 2.4, "bass"),
    ("upright-bass", 32, 28, 60, 3, 2.4, "bass"),
    ("synth-bass", 38, 28, 60, 3, 2.0, "bass"),
    ("violin", 40, 55, 96, 3, 3.0, "strings"),
    ("cello", 42, 36, 76, 3, 3.0, "strings"),
    ("strings", 48, 36, 96, 3, 3.2, "strings"),
    ("pizzicato", 45, 36, 88, 4, 1.4, "strings"),
    ("harp", 46, 36, 96, 4, 2.8, "strings"),
    ("trumpet", 56, 52, 84, 3, 2.4, "horns"),
    ("trombone", 57, 40, 72, 3, 2.4, "horns"),
    ("french-horn", 60, 41, 77, 3, 2.6, "horns"),
    ("brass-section", 61, 40, 84, 3, 2.4, "horns"),
    ("alto-sax", 65, 49, 81, 3, 2.4, "horns"),
    ("tenor-sax", 66, 44, 76, 3, 2.4, "horns"),
    ("flute", 73, 60, 96, 3, 2.6, "woodwinds"),
    ("clarinet", 71, 50, 88, 3, 2.6, "woodwinds"),
    ("oboe", 68, 58, 88, 4, 2.4, "woodwinds"),
    ("choir-aahs", 52, 43, 84, 3, 3.2, "voices"),
    ("voice-oohs", 53, 43, 84, 3, 3.2, "voices"),
    ("marimba", 12, 45, 96, 4, 1.6, "mallets"),
    ("vibraphone", 11, 48, 90, 4, 2.6, "mallets"),
    ("music-box", 10, 60, 96, 4, 2.0, "mallets"),
    ("bells", 14, 55, 84, 4, 3.0, "mallets"),
    ("steel-drums", 114, 52, 84, 4, 1.8, "world"),
    ("kalimba", 108, 52, 88, 4, 1.8, "world"),
    ("sitar", 104, 45, 81, 4, 2.6, "world"),
    ("koto", 107, 48, 84, 4, 2.2, "world"),
    ("warm-pad", 89, 36, 84, 4, 3.4, "synths"),
    ("synth-lead", 81, 48, 90, 3, 2.4, "synths"),
]

KITS = [("standard", 0), ("room", 8), ("power", 16), ("electronic", 24), ("808", 25), ("jazz", 32), ("brush", 40)]
DRUM_NOTES = {
    "kick": 36, "snare": 38, "rim": 37, "clap": 39, "hat": 42, "pedal-hat": 44, "open-hat": 46,
    "low-tom": 45, "mid-tom": 47, "high-tom": 50, "crash": 49, "ride": 51,
    "tambourine": 54, "cowbell": 56, "high-bongo": 60, "low-bongo": 61, "conga": 63,
    "low-conga": 64, "shaker": 70, "claves": 75, "woodblock": 76,
}


def vlq(n):
    out = [n & 0x7F]
    n >>= 7
    while n:
        out.append((n & 0x7F) | 0x80)
        n >>= 7
    return bytes(reversed(out))


def write_midi(path, notes, program, channel, bank, hold, gap, vel=100):
    tps = 960  # 120 bpm at 480 ticks per beat
    events = []
    if channel == 9:
        events.append((0, bytes([0xB9, 0, 0])))
    events.append((0, bytes([0xC0 | channel, program])))
    for i, note in enumerate(notes):
        on = int((0.5 + i * gap) * tps)
        events.append((on, bytes([0x90 | channel, note, vel])))
        events.append((int((0.5 + i * gap + hold) * tps), bytes([0x80 | channel, note, 0])))
    events.sort(key=lambda e: e[0])
    data = b"\x00\xff\x51\x03" + (500000).to_bytes(3, "big")
    last = 0
    for tick, msg in events:
        data += vlq(tick - last) + msg
        last = tick
    data += vlq(2 * tps) + b"\xff\x2f\x00"
    with open(path, "wb") as f:
        f.write(b"MThd" + struct.pack(">IHHH", 6, 0, 1, 480) + b"MTrk" + struct.pack(">I", len(data)) + data)


def render(notes, program, channel, hold, gap, tmp):
    mid = os.path.join(tmp, "x.mid")
    wav = os.path.join(tmp, "x.wav")
    write_midi(mid, notes, program, channel, 0, hold, gap)
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.6", "-r", str(RATE), "-F", wav, SF2, mid], check=True)
    with wave.open(wav) as w:
        frames = w.readframes(w.getnframes())
        ch = w.getnchannels()
    pcm = array.array("h", frames)
    mono = [(pcm[i] + pcm[i + 1]) / 65536 for i in range(0, len(pcm), ch)] if ch == 2 else [x / 32768 for x in pcm]
    return mono


def save(samples, path, tmp, gain):
    pcm = array.array("h", [int(max(-1, min(1, x * gain)) * 32767) for x in samples])
    raw = os.path.join(tmp, "n.wav")
    with wave.open(raw, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm.tobytes())
    os.makedirs(os.path.dirname(path), exist_ok=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", raw, "-c:a", "libmp3lame", "-b:a", "96k", path], check=True)
    return gain


def slice_note(mono, index, gap, hold):
    start = int((0.5 + index * gap) * RATE)
    end = min(len(mono), start + int((hold + 0.9) * RATE))
    note = mono[start:end]
    # Trim the quiet tail, then fade the last 40 ms.
    last = len(note) - 1
    while last > RATE * 0.3 and abs(note[last]) < 0.0008:
        last -= 1
    note = note[: last + 1]
    fade = min(len(note), int(RATE * 0.04))
    for i in range(fade):
        note[len(note) - 1 - i] *= i / fade
    return note


def main():
    index = {"source": "FluidR3 GM by Frank Wen, MIT license", "rate": RATE, "instruments": {}, "kits": {}}
    with tempfile.TemporaryDirectory() as tmp:
        for name, program, low, high, step, hold, family in MELODIC:
            notes = list(range(low, high + 1, step))
            gap = hold + 1.6
            mono = render(notes, program, 0, hold, gap, tmp)
            # One level for the whole instrument, so its natural balance
            # between low and high notes stays.
            gain = min(6.0, 0.7 / max(1e-6, max(abs(x) for x in mono)))
            for i, note in enumerate(notes):
                save(slice_note(mono, i, gap, hold), os.path.join(OUT, name, f"{note}.mp3"), tmp, gain)
            index["instruments"][name] = {"program": program, "family": family, "notes": notes, "hold": hold}
            print(name, len(notes), file=sys.stderr)
        for kit, program in KITS:
            names = list(DRUM_NOTES)
            notes = [DRUM_NOTES[n] for n in names]
            mono = render(notes, program, 9, 1.0, 2.2, tmp)
            gain = min(6.0, 0.8 / max(1e-6, max(abs(x) for x in mono)))
            for i, name in enumerate(names):
                save(slice_note(mono, i, 2.2, 1.0), os.path.join(OUT, "kits", kit, f"{name}.mp3"), tmp, gain)
            index["kits"][kit] = names
            print("kit", kit, file=sys.stderr)
    with open(os.path.join(OUT, "index.json"), "w") as f:
        json.dump(index, f, indent=1)


if __name__ == "__main__":
    main()
