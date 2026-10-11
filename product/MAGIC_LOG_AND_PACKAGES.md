# Magic Log, Adaptive Producer, Magic Marker/Eraser and Packages

## The signature product: Magic Log
A **persistent, explainable history of what Songbird noticed, suggested, attempted, changed, and how the user responded**. It is not a hidden AI chat log and is distinct from undo/redo history. It is the visible memory of the AI producer and its musical reasoning.

### Magic Log event schema
Each event: `id, project_id, layer_id?, session_id, timestamp, category, source_time_range?, evidence_metrics?, confidence, user_facing_observation, suggested_action, rationale, preview_asset_id?, before_asset_id?, after_asset_id?, action_status (suggested/previewed/applied/dismissed/reverted/failed), processing_version, model_version, reversible_operation_id?, user_decision, warnings`.
Do not expose internal chain-of-thought. Show concise evidence-based explanations: 'I detected sharp clicks near 0:08 and 0:12; they may be metronome bleed. I can try a click removal preview.' Do not assert uncertain inferences as fact.

### Adaptive producer loop
1. Observe waveform, recording metadata, input intent, metronome settings, existing tracks, tempo, prior user preferences.
2. Classify probable content: hum, speech/singing, claps, beatbox, instrument, noise, room tone, pops, bleed, distortion, clipping.
3. Distinguish intentional sounds from unwanted artifacts with contextual rules and confidence thresholds.
4. Prioritize high-value low-risk fixes. Offer no more than one or two at a time; never interrupt live performance.
5. Explain in simple language, show waveform highlight, render preview.
6. Accept, dismiss, adjust, undo, redo. Persist event and exact operation.
7. Validate before/after quality: loudness, peak/clipping, transient damage, pitch/rhythm drift, perceptual/listener review.

### Magic Marker
User highlights a waveform interval or taps an AI-highlighted region. Contextual actions: 'Clean this', 'Fix note', 'Align timing', 'Soften pop', 'Keep as-is', 'Explain'. Non-destructive region operation; mask/selection stored in project. Use visible before/after overlays. On touch: large drag handles, tap to accept suggested regions, no precision-only gesture requirement.

### Magic Eraser
Brush or tap a transient/noise region; app previews localized repair using click removal/interpolation/spectral attenuation as appropriate. Erase is **never destructive**. If content overlaps an intended voice/instrument, warn 'This may also change your singing.' Offer A/B and undo. For mobile use tap-to-fix as default and brush as advanced.

### Metronome intelligence
Preferred: synthesize metronome in **monitor output**, never route it into recorded dry track; support headphones, count-in, and configurable tempo. For speaker bleed, store exact metronome pattern, click sample, timing, gain, audio-route information; align expected click times with detected transients and attempt targeted suppression. Do not promise full removal when clicks overlap vocals. Offer re-record with headphones as fallback. Do not remove intentional claps merely because they align to beats.

### Transformation packages (creative toolkits, not payment tiers)
| Toolkit | Inputs | Outputs | Main controls | Engine / caveat |
|---|---|---|---|---|
| Tune Original | vocal/hum/instrument | cleaned, corrected variant | noise, pitch, timing, preserve expression | DSP + pitch tracking; avoid overcorrection |
| Rhythm Magic | clap/tap/beatbox | drum MIDI / samples | kit, quantize, swing, dynamics | onset detection + classification; preview mistakes |
| Instrument Magic | monophonic hum/sing | piano/bass/guitar/synth | instrument, octave, articulation | pitch-to-MIDI + licensed samples; exact fidelity requires testing |
| Vocal Magic | sung line | tuned vocal / harmony / choir preview | key, harmonies, blend | DSP/harmony engine; convincing choir may be offline-only |
| Creative Magic | original layers | style/texture variants | mood, genre, preserve DNA | optional generative model; cannot guarantee strict note preservation |
| Mix & Master Magic | multitrack mix | balanced mastered stereo | warmth, loudness target, dynamics | deterministic DSP first, A/B and clipping checks |
| Preserve Magic | archival audio | restored authentic recording | hiss, clicks, clarity | restoration; do not synthesize identity without consent |

### Live vs offline
`Record First`: dry mic capture -> offline analysis -> previews -> apply. `Play Live`: input -> low-latency onset/pitch tracking -> instrument sampler -> headphone monitor; simultaneously capture dry mic and timestamped performance events. High-quality offline rendering may replace preview after recording. Detect latency/CPU overruns and degrade gracefully. Do not market arbitrary full neural voice transformation as zero-latency.

## Commercial release packages (hypotheses, test pricing)
- Free Creator: record, loop, limited transforms, save and preview; clear limits.
- Studio Finish (~$9.99/song): mastered MP3/WAV depending on policy.
- Studio Plus (~$24.99/song): higher-fidelity output, stems and additional mastering options.
- Music Video (~$39.99–$69.99/video): photo/performance/AI scenes with credits, duration caps.
- Cinematic Release (~$99–$149): premium audio + extended video/keepsake.
These are **research hypotheses**, not validated prices. Measure actual GPU/video rendering costs, margins, retries and support before charging.

## Video creation
On Studio Finish panel: `Visualizer | Photo Story | My Performance | Generate Scenes`. User can prompt mood/story, upload authorized photos and performance video, choose scenes and sync to song sections. Start with FFmpeg photo montage, captioning and visualizers; AI video via separately licensed provider/model later. Require permissions and consent for recognizable people; protect minors and archival likenesses.
