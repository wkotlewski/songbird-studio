# Implementation Phases, Backlog and Acceptance Criteria

## Phase 0 — Repository reconnaissance / design system
Inspect existing repo and do not replace working architecture without permission. Establish lint, formatting, tests, CI, environment template, feature flags. Implement dark theme tokens, accessible controls, two-route shell, responsive mobile/tablet/desktop layouts using provided images as visual references. No mock AI success claims.
**Accept:** two destinations, responsive timeline shell, navigation, visible save status, screenshot comparisons at 390px/820px/1440px.

## Phase 1 — Recording, looping and timeline
Microphone permission; AudioWorklet dry recording; device meter; stop/retake; metronome monitor-only, count-in, BPM; loop boundaries; add 2+ synchronized layers; play/pause/seek; horizontal timeline pan + zoom; track gain/pan/mute/solo; original assets persisted.
**Accept:** clap then hum over drum loop, 3-minute playback without drift; metronome not in dry capture under headphones; speaker bleed flagged, not claimed impossible; no loss on refresh.

## Phase 2 — Projects, undo/redo, history
Postgres project/session/layer/asset schema; autosave, session reopen, project rename, duplicate, archive; command history, undo/redo for every non-destructive edit; versions, retry states and backup.
**Accept:** after 10 edits, undo 5 and redo 5 restores expected mix; close/reopen resumes layers; failed save visibly reported; original still available after delete/restore.

## Phase 3 — First transformations
Clap -> MIDI drum events + kit samples; monophonic hum -> MIDI -> piano/bass; separate dry vs variant; A/B preview, apply/revert; optional quantize strength; confidence warnings.
**Accept:** 10 varied real-world recordings tested; note/rhythm preservation measured; preview and original playback; no false 'studio quality' label.

## Phase 4 — Magic Producer + Magic Log
Detection of clicks/pops, noise floor, clipping, metronome bleed, low level, timing drift, pitch variation; typed suggestions with time range/confidence; Magic Marker region, Magic Eraser transient preview, user acceptance; persistent event log and undo.
**Accept:** every applied fix creates explainable event + reversible operation; low-confidence advice asks user; intentional claps not removed without approval; failures don't corrupt audio; before/after at matched loudness.

## Phase 5 — Mix/master/export
Gain/pan, simple reverb, compressor/EQ presets, stereo WAV export, peak/loudness analysis; render queue with progress; optionally MP3 if licensing/build permits.
**Accept:** rendered output matches project timing and pan, no unannounced clipping, can export and replay; history and raw sources intact.

## Phase 6 — Live transformation (beta)
On-device pitch/onset tracker, sample-based instrument monitoring, Record First / Play Live, original/transformed/both, route latency test, dry recording + event timestamps, fallback on unsupported devices.
**Accept:** latency benchmark on target phones/tablets/desktop with wired vs Bluetooth routes; no claim of guaranteed low latency; no interruption during playback; disable gracefully if device insufficient.

## Phase 7 — Family sharing and video
Guardian roles, private/family links, revocation, share permissions, photo montage/visualizer from licensed user media, performance video import; advanced AI video and public community behind feature flags.
**Accept:** unauthorized users cannot access raw audio; family links revoke; minor account cannot publicly publish; output syncs to final audio.

## Phase 8 — Monetization and growth
Only after real unit-cost data: packages/credits, payments, transparent export entitlements, refunds/retries, analytics, retention tests, rights workflows, moderation.

## Test corpus
Build consented examples: quiet elderly humming, child's claps, beatbox with plosives, intentionally off-grid performance, speaker metronome bleed, headphone metronome, background TV, breath noise, pops, group singing, archival hymn, silent mic, clipped mic, variable device sample rates. Keep test audio private; do not ship real family recordings in public repo.

## Definition of done per phase
Working demo, automated tests, device/browser test matrix, docs updated, source/licensing review, privacy review, error/empty/loading states, performance numbers, and user-facing truthful status. Never implement future phase as a fake clickable stub unless clearly labeled 'Coming later'.
