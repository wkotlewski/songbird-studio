# Songbird — Cursor Product & Engineering Blueprint

**Status:** product specification and implementation blueprint, not a completed application.  
**Vision:** *You bring the creativity. Songbird brings the studio expertise.*  
**Product:** mobile-first, adaptive, human-first AI music studio for making music from humming, singing, clapping, tapping, beatboxing, instruments and archival recordings.

## Start here in Cursor
1. Open this folder or copy its contents into your existing Songbird repository. Do not overwrite existing code without reviewing it.
2. Read `product/PRODUCT_BRIEF.md`, `product/JOURNEYS_AND_PERSONAS.md`, `design/UX_SPEC.md`, `product/MAGIC_LOG_AND_PACKAGES.md`, and `architecture/TECHNICAL_ARCHITECTURE.md`.
3. Review the reference images in `design/`. They are **visual direction, not exact implementation requirements**; the written UX spec is authoritative where images conflict.
4. Paste `engineering/CURSOR_BUILD_PROMPT.md` into Cursor Agent. Work through the phases in `engineering/ROADMAP_AND_ACCEPTANCE.md`, one phase at a time.
5. Review `architecture/OPEN_SOURCE_MATRIX.md` and `docs/SAFETY_RIGHTS_AND_COMPLIANCE.md` before integrating any models, soundfonts, or user uploads.

## Folder guide
- `product/`: mission, audience, user journeys, Magic Log, transformations, packages, requirements.
- `design/`: dark-mode references, responsive UX, interaction and flow specifications.
- `architecture/`: system components, audio pipeline, data model, API contracts, open-source integrations.
- `engineering/`: Cursor prompt, phased plan, test and quality gates.
- `.cursor/rules/`: coding/product guardrails.
- `docs/`: trust, copyright, accessibility, privacy, pricing and metrics.

## Important product decisions
- **Exactly two top-level destinations:** `Studio` and `My Music`. Everything else is an in-canvas mode, contextual panel, drawer, or modal.
- **Responsive:** mobile studio uses horizontally pannable *timeline content* and contextual sheets; tablet/desktop show wider timeline, library rail, and inspector simultaneously. Do not force users through five distinct screens.
- **Always preserve original dry audio** and an editable project history. No destructive transformations.
- **Two recording experiences:** Record First and Play Live; live monitoring is a separate low-latency engine from offline studio-quality rendering.
- **Signature differentiator:** Magic Log / AI Producer + Magic Marker / Magic Eraser, one-tap, explainable, reversible fixes.
- **Sound packages:** Tune Original, Transform Instrument, Vocal/Harmony, Rhythm, Creative Style, Mix/Master; final audio/video delivery packages are distinct paid offerings.
- **No fake AI:** If a backend is not integrated, show an explicit prototype/demo state, not a misleading completed fix.

## Proof-of-concept goal
A user records claps with an optional metronome, loops them, transforms the rhythm to a drum kit, records humming in sync, transforms it to piano or bass, previews Magic Fix recommendations, undoes/redoes changes, autosaves and restores the session, and exports a synchronized stereo WAV. Original audio remains recoverable throughout.

## Out of scope for initial MVP
Public social feed, sophisticated AI video generation, realistic zero-latency vocal-to-choir, professional DAW parity, unlicensed voice cloning, guaranteed perfect removal of sound overlapping a vocal performance.
