# Technical Architecture and Audio Processing Contracts

## Proposed monorepo
```
apps/web/                 # Next.js TS, Studio and My Music only
services/audio-api/       # FastAPI: analysis and render orchestration
services/audio-worker/    # Python: DSP, Basic Pitch, MIDI, FFmpeg
packages/ui/              # accessible components and tokens
packages/audio-client/    # Web Audio, AudioWorklet, Tone.js transport
packages/shared/          # shared TS schemas and generated API types
infra/                    # compose, migrations, storage setup
```

## Major components
- **CaptureEngine**: permission, device selection, dry input, audio meter, monitor routing, raw chunks, clock timestamps.
- **TransportEngine**: tempo, time signature, count-in, metronome, bars, loop range, timeline and quantization.
- **LayerEngine**: original immutable asset, variants, MIDI/events, clips, loop config, gain, pan, mute/solo, effects, source lineage.
- **LiveTransformEngine**: low-latency on-device onset/pitch -> sampler; device capability check and fallback.
- **AnalysisService**: detect signal issues and music features with confidence and time spans.
- **MagicProducerService**: deterministic rules + optional LLM for wording, produces typed recommendations; user must accept edits.
- **ProcessingService**: non-destructive region effects and offline transform, render and A/B assets.
- **SessionHistoryService**: commands, autosave, undo/redo, version snapshots, reopen sessions.
- **ExportService**: offline mixdown, loudness checks, WAV/MP3, later stems and video.
- **RightsService**: privacy, invitations, permission grants, provenance and takedown.

## Critical audio routing
```
Microphone -> DryCapture -> Immutable original audio asset
           -> Analysis features -> Magic recommendations
           -> (optional) Live tracker -> Sampler -> Monitor bus -> output
Metronome -> Monitor bus only (never inserted into dry capture)
Saved original + accepted operations + track settings -> Offline mix/master -> Export
```
Record device/browser clock mapping and known playback latency; calibrate and correct capture alignment. Speaker bleed cannot be guaranteed removable. Encourage wired headphones for low latency; Bluetooth usually adds noticeable delay.

## State and history
Use command-based reversible operations: `AddLayer`, `TrimClip`, `SetLoop`, `ApplyVariant`, `SetGain`, `SetPan`, `Mute`, `Solo`, `ApplyMagicFix`, `Rename`, `DeleteLayer` (soft-delete), `RestoreVersion`. Commands carry before/after and asset references. Undo/redo must persist across active session where practical; after reopening, version history remains navigable even if exact undo stack is compacted. Autosave debounced metadata + immediate durable upload of recorded audio chunks; show unsaved/error state.

## Audio quality and synchronization
- Use AudioWorklet for capture/processing where supported; don't depend on JS main-thread timers for sample-accurate timing.
- Pick canonical project sample rate (e.g., 48 kHz), resample assets and record exact offset/latency. Render stereo floats internally, dither when converting to PCM where needed.
- Detect clipping, silent input, low SNR, and inconsistent tempo. Offer retake when restoration is not credible.
- Store tempo map, bar grid, loop boundaries and per-clip offsets. No cumulative drift over repeated loop playback.
- Meter and clamp peaks, avoid destructive auto-normalization, A/B compare at matched loudness.
- For generated instrument tracks preserve note timing/pitch as far as the chosen engine allows, and surface uncertainty.

## Background jobs
`queued -> analyzing -> processing -> preview_ready -> accepted/rejected -> exporting -> completed/failed`. Expose progress and cancel/retry. Render jobs are idempotent; do not duplicate paid usage on retry. Capture error and model versions.

## Security and operations
Private storage by default, signed URLs, least-privilege roles, encrypted transport/storage, rate limiting, file type and size checks, audio/video malware scanning, deletion workflows, backups, audit trails, parental controls, consent tracking. No public searchable minor accounts.
