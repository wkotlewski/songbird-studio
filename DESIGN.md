# Songbird design system

Copyright © 2026 Whitney Kotlewski. All rights reserved.

This page uses two reference images in `site/assets/`.

- `songbird-design-system.png` is the source for type, color, spacing, radius, and control shapes.
- `emerald-blush-mist.jpg` is the page background. Panels, cards, and the studio chrome are liquid glass: a light tint and a blur, so the image stays visible. The timeline itself is clear. It is also copied as `site/mist.jpg`.

The written color rule on this page is stricter than the pink Apply button on the board. Mint is the action color. Pink is for recording, sliders, selected waveform regions, and edit marks.

## Color

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#071C17` | Page background |
| `--surface` | `#10352C` | Panels and cards |
| `--surface-low` | `#0B2820` | Inactive tracks and fields |
| `--surface-high` | `#18483C` | Hover surfaces |
| `--mint` | `#34D399` | Primary buttons, active chips, normal waveforms |
| `--pink-light` | `#F9A8D4` | Slider thumbs, selected waveforms, beat marks |
| `--pink` | `#EC4899` | Record button and recording emphasis |
| `--text` | `#FFFBF2` | Primary text |
| `--gold` | `#E8B86D` | Delete and other warnings, so they are not the record pink |

Focus is a 2px mint outline. Disabled controls fade to 42% opacity. Hover brightens mint. Pressed mint is `#22b07e`.

## Type

Plus Jakarta Sans, weights 300, 400, 500, 600, and 700.

| Token | Use |
|---|---|
| `--type-display` | Large display, 40px bold |
| `--type-screen` | Screen titles such as My Music, 28px bold |
| `--type-section` | Panel titles, 22px semibold |
| `--type-body` | Body copy, 15px regular |
| `--type-button` | Button labels, 14px semibold |
| `--type-helper` | Hints, 12px regular |
| `--type-meta` | Badges and the Original / Edited mark, 11px medium |

## Space and radius

Spacing is 4, 8, 16, 24, and 32 pixels (`--space-1` through `--space-5`).

Radius is 12, 20, and 28 pixels. Buttons and chips are fully rounded. Cards, dock items, and plans use 28. The studio canvas uses 20.

## UI cleanup

Use this when a control stops looking like a control. Glass is for panes, song cards, and the studio bar. It is not for buttons, chips, or sliders. A grey wash or a transparent fill makes a button look like text.

The board in `site/assets/songbird-design-system.png` is the shape reference. Mint fills a primary action. A dark green surface with a mint outline is the secondary action. Pink is the record circle and the slider thumb. Delete stays amber so it is not the record button.

| Control | Class | Look |
|---|---|---|
| Primary | `button.btn-primary` | Mint pill, dark text, 44px tall |
| Secondary | `button.btn-secondary` | `#10352C` pill, mint outline, off-white text |
| Choice card | `button.plan`, `button.tile`, `button.dock-btn` | 28px corners, dark green fill, mint outline. Selected (`.on`) turns mint |
| Chip | `button.chip` | Same pill as secondary. `.on` is mint |
| Play | `#play-btn` | 44px mint circle. While playing, `.is-on` is a dark circle with a mint ring and a square |
| Record | `#rec-btn`, `button.mic` | Pink circle. Recording adds a pink ring |
| Undo, redo, close | `button.icon-btn` | 44px dark circle, mint outline |
| Mute and solo | `button.mini` | 36px circle. `.on` is mint |
| Delete | `button.btn-danger` | Amber outline, not pink |
| Slider | `input[type=range].slider` | Light track, pink thumb. Not a text field |

Rules:

- Do not add button classes to the glass selector.
- Do not style `.field input` in a way that also matches `input[type=range]`.
- Range inputs keep `appearance: none` only together with a visible track and a 22px thumb.
- Play must change to a stop mark and a ring while audio is running. Record must show a ring while the microphone is open.
- Mix always shows the volume, bass, treble, left/right, and space sliders, plus a fader on each channel strip.
- Corners stay 12, 20, or 28, or a full pill. Do not leave a control on the browser's square default.

## Studio canvas

The mist image is fixed on the page, `cover` and `center`, with no green veil. Library, inspector, song cards, the studio bar, and the dock are glass: about 30% dark tint, a 28px blur, and a light edge. The timeline is open so the image stays sharp there. Reduced motion turns off waveform sweeps and meter hops.

Wave bars come from the layer's audio peaks. Unselected layers are mint. The selected layer is pink. A selected section is a pink band. Bar lines sit on the ruler from the song tempo. Fit, 1.5×, and 2× change how wide the timeline is. The timeline still scrolls sideways.

Original layers and edited layers are labeled. An edited layer is one added from a transform. The original recording stays.

## Magic tools

Magic Transform is the Transform panel. Choosing a package keeps the original and adds a layer. Strings, synth, Magic Clean, Magic Tune, Magic Erase, and Magic Marker are not connected. The Magic Log lists the layers that are actually in the song and says so. It does not report a cleanup that did not run.

## Layout

My Music and Studio stay the two places. Under 760px the library and studio swap, and panels are a bottom sheet. From 760px to 1099px the open panel is a side sheet. At 1100px and up, library, timeline, and panel sit in three columns.

There is no component showcase in this repository. The page itself is the review surface.
