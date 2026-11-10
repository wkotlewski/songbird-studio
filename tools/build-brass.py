"""Build Songbird's real brass from VSCO 2 Community Edition (CC0 1.0).

VSCO 2 CE is by Versilian Studios (Sam Gossner), released into the public
domain under CC0 1.0: https://github.com/sgossner/VSCO-2-CE
Takes the held (sus) and short (stac) notes of trumpet, tenor trombone, tuba,
and French horn, one take per note, and writes site/sounds/<id>/<midi>.mp3
and site/sounds/<id>-stac/<midi>.mp3, then adds them to sounds/index.json.

    python3 tools/build-brass.py /path/to/VSCO-2-CE
"""
import json, os, re, subprocess, sys, collections

VSCO = sys.argv[1] if len(sys.argv) > 1 else "VSCO-2-CE"
OUT = os.path.join(os.path.dirname(__file__), "..", "site", "sounds")
PC = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
# id: (folder, lowest note kept, family)
BRASS = {
    "trumpet": ("Brass/Trumpet", 52, "horns"),
    "trombone": ("Brass/Tenor Trombone", 38, "horns"),
    "tuba": ("Brass/Tuba", 28, "horns"),
    "french-horn": ("Brass/F Horn", 38, "horns"),
}
HOLD = {"sus": 4.0, "stac": 1.2}


def notes_in(folder, art):
    found = collections.defaultdict(list)
    base = os.path.join(VSCO, folder, art)
    for name in sorted(os.listdir(base)) if os.path.isdir(base) else []:
        m = re.search(r"_([A-G]#?)(-?\d)_", name)
        if not m or not name.endswith(".wav"):
            continue
        # VSCO names notes with middle C as C3.
        midi = (int(m.group(2)) + 2) * 12 + PC[m.group(1)]
        v = re.search(r"_v(\d)", name)
        rr = re.search(r"_rr(\d)", name)
        found[midi].append((int(v.group(1)) if v else 1, int(rr.group(1)) if rr else 1, os.path.join(base, name)))
    picked = {}
    for midi, takes in found.items():
        dyn = sorted({t[0] for t in takes})
        # A strong dynamic, not the very loudest: brass sounds most like a
        # band there.
        want = dyn[-2] if len(dyn) >= 3 else dyn[-1]
        picked[midi] = sorted([t for t in takes if t[0] == want], key=lambda t: t[1])[0][2]
    return picked


def convert(src, dst, hold):
    """Trim the silence before the note, keep `hold` seconds with a short
    fade, and bring every note to the same peak, so the attack stays real."""
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "44100", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).copy()
    peak = float(np.abs(x).max()) or 1.0
    start = int(np.argmax(np.abs(x) > peak * 0.02))
    x = x[max(0, start - 64): max(0, start - 64) + int(hold * 44100)]
    fade = int((0.3 if hold > 2 else 0.12) * 44100)
    if len(x) > fade:
        x[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    x *= 0.85 / (float(np.abs(x).max()) or 1.0)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", "44100", "-ac", "1", "-i", "-", "-b:a", "96k", dst], input=x.astype(np.float32).tobytes(), check=True)


def main():
    index_path = os.path.join(OUT, "index.json")
    index = json.load(open(index_path))
    for inst, (folder, lowest, family) in BRASS.items():
        for art, hold in HOLD.items():
            picked = {m: p for m, p in notes_in(folder, art).items() if m >= lowest}
            if not picked:
                continue
            name = inst if art == "sus" else f"{inst}-stac"
            out = os.path.join(OUT, name)
            os.makedirs(out, exist_ok=True)
            for f in os.listdir(out):
                os.remove(os.path.join(out, f))
            for midi, src in sorted(picked.items()):
                convert(src, os.path.join(out, f"{midi}.mp3"), hold)
            index["instruments"][name] = {"family": family, "notes": sorted(picked), "hold": hold, "source": "VSCO 2 CE (CC0)"}
            print(name, len(picked), min(picked), max(picked))
    json.dump(index, open(index_path, "w"), separators=(",", ":"))


main()
