# Audiences, scenarios and core journeys

## Personas
1. **Young creator (5+)** — wants to clap, sing, invent characters and share with parent; big buttons, spoken cues, parental account, private by default. No direct child-facing public community.
2. **Senior/hobby musician** — may have decades of melodies, hums quietly, may record in reverberant rooms; needs confidence, accessible text and authentic voice preservation.
3. **Parent/family collaborator** — layers multiple people's recordings, saves family songs, imports photos and chooses sharing permissions.
4. **Songwriter/experienced musician** — wants exact timing, deliberate vibrato and pitch bends preserved, MIDI inspection, manual controls and independent mode.
5. **Gift/legacy buyer** — imports old hymns/recordings, restores rather than impersonates the original voice, produces a private keepsake.

## Primary journey (two screens)
`My Music -> Create New -> Studio empty canvas -> Record First / Play Live -> record -> preview/retake -> loop -> layer created -> Magic Log analyzes -> Tune / Transform / Keep Original -> preview/accept -> Add Sound -> repeat -> mix -> finish/master -> optional video -> export/share -> My Music`.
Opening a prior song goes `My Music -> Studio (restore saved session)`.

## Story A: child makes a song
Guardian opens a private child profile; child claps, hears a 4-beat loop, chooses drum-kit icon, hums melody over it, transforms to piano, taps Magic Fix when app suggests removing an accidental pop, listens, saves. Guardian controls any export/share and AI-video usage.

## Story B: grandfather finishes a hymn
Creates a song by humming; app detects quiet notes and background fan, proposes cleanup; he retains his authentic hum as one layer and adds a guitar and choir as *separate* layers; adjusts mix; exports studio WAV; shares privately with family.

## Story C: live instrument performance
User selects Play Live -> Bass; app measures device capability and audio route; input vocal pitch maps to sample/MIDI instrument in headphones; dry mic is recorded with aligned transformed event stream. If monitoring is too delayed, warn and offer Record First; later offline render improves tone without losing timing.

## Story D: old family recording
Adult imports authorized archival audio, selects Preserve; app detects hiss/clicks and offers reversible restoration; never generates a deceased person's synthetic voice without rights/consent review; combines original recording with a new arrangement; produces a photo keepsake video.

## Story E: incomplete session
User closes app mid-song; autosave stores edit commands, raw audio, loop settings and render state; My Music shows draft and last-edited time; tapping resumes at last playhead/selection. Recovery must handle upload or render interruption.

## Recording sound expectations
Hum: unstable pitch, breaths, room tone. Clap: transients, irregular intervals. Beatbox: bass/snare/hat-like phonemes, wind noise. Child voice: changes in level and timing. Group: overlapping voices and laughter. Instrument: polyphony and plucks. Archival: hiss, hum, wow/flutter, clipping. Metronome: internal click in monitor mix and possible speaker bleed. **Do not label intentional creative sounds as defects without confirmation.**
