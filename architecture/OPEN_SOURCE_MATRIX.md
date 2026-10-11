# Open-source tools and integration matrix

**Important:** source-code license != model-weight license != soundfont/sample license != generated-output rights. Validate exact versions and redistribution/commercial terms before release; pin dependencies and retain attribution. Tool recommendations are candidates, not claims of guaranteed performance.

| Experience / component | Candidate OSS tool | Integration job | Status / caveat |
|---|---|---|---|
| UI / responsive app | Next.js, React, TypeScript, Tailwind | two-route web/PWA | standard stack |
| UI controls / accessibility | Radix UI or shadcn/ui | sheets, dialogs, sliders, keyboard | validate accessibility |
| Audio capture and monitor | Web Audio API, AudioWorklet, MediaDevices | mic capture, meter, dry audio, routing | browser permission + iOS limitations |
| Transport, metronome, looping | Tone.js | BPM, click, quantized loop timing, sampler | verify mobile audio unlock |
| Waveforms | wavesurfer.js | render waveform, regions, zoom | BSD-3-Clause; don't rely on it as core DSP |
| Onset/tempo/noise features | librosa, scipy, numpy | clap detection, BPM, noise analysis | server-side Python |
| Pitch to MIDI | Spotify Basic Pitch | melody transcription, pitch bends | Apache 2.0; best with isolated input; validate drift |
| MIDI editing | pretty_midi, mido | notes/events and alignment | license check per package |
| Instruments / samples | FluidSynth + licensed SF2/SFZ or custom sample library | piano/bass/drum/guitar sound | **sample licensing is critical** |
| Audio conversion / export | FFmpeg | resampling, rendering, codecs, video assembly | license/build configuration varies |
| Audio restoration | scipy filters + optional RNNoise | noise reduction, clicks, denoise | must benchmark voice preservation |
| Pitch/time DSP | Rubber Band Library or alternatives | time stretch/pitch shift | GPL/commercial licensing can constrain distribution; review before choosing |
| Source separation (optional) | Demucs | separate existing recordings | Meta original archived/unmaintained; evaluate forks |
| Generative music (experimental) | ACE-Step 1.5 | offline style/repaint/arrangement exploration | MIT project repo; separately verify weights, terms, output quality; NOT guaranteed melody-locked |
| Producer language UI | Ollama + commercially licensed open-weight model | plain-language guidance | don't let LLM execute arbitrary DSP commands |
| API / processing | FastAPI, Pydantic | async processing, schema validation | worker queue required for long tasks |
| Database | PostgreSQL | projects, events, versions, permissions | migrations and backups |
| Object storage | S3-compatible/MinIO | raw audio, previews, exports, video | signed URLs, lifecycle, encryption |
| Background jobs | Celery + Redis / RQ | offline render, retries, progress | idempotent jobs |
| Identity | Auth.js or other supported auth | accounts, guardian controls, sessions | privacy/legal review |
| Billing | Stripe (not open source) | payments, package entitlements | defer until verified MVP |
| Video assembly | FFmpeg | photo stories, lyric captions, visualizers | AI video model/provider optional later |

## References and license checkpoints
- https://github.com/spotify/basic-pitch
- https://github.com/spotify/basic-pitch-ts
- https://github.com/ace-step/ACE-Step-1.5
- https://github.com/facebookresearch/demucs (archived)
- https://github.com/katspaugh/wavesurfer.js
- https://tonejs.github.io/
- https://ffmpeg.org/legal.html
- https://github.com/ircam-ismm/rnnoise (verify project choice)
- https://breakfastquay.com/rubberband/ (licensing review)

## Engineering selection rule
Prefer simple deterministic transforms for MVP; evaluate with real target-user audio. Use heavier generative models only where they improve perceptual quality enough to justify compute and loss of control. Keep provider/model adapters behind typed interfaces and feature flags. Store model provenance with each render.
