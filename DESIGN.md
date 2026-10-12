# Songbird design system

Copyright © 2026 Whitney Kotlewski. All rights reserved.

This page uses two reference images in `site/assets/`.

- `songbird-design-system.png` is the source for type, color, spacing, radius, and control shapes.
- `emerald-blush-mist.jpg` is the studio canvas background, behind the timeline. It is also copied as `site/mist.jpg`.

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

## Controls

- `.btn-primary` is mint with dark text.
- `.btn-secondary` is a transparent surface with a mint outline and off-white text.
- `.btn-danger` is an amber warning. It is not pink.
- `.icon-btn` is a 44px mint circle. `#rec-btn` and `.mic` are pink circles. Recording adds the `hot` state. Disabled record fades.
- `.chip.on` is the mint selected state for Record First, Play Live, monitor, length, and zoom.
- Sliders use a dark track and a pink thumb. Left and right on a layer is stereo pan. It does not scroll the timeline.
- Touch targets are at least 44 pixels. Keyboard focus uses `:focus-visible`.

## Studio canvas

`.stage` paints `assets/emerald-blush-mist.jpg` with `background-size: cover` and `center`, so the image is not stretched. A dark gradient sits over it so tracks stay readable. The sky canvas stays transparent enough for the mist to show. Reduced motion turns off waveform sweeps and meter hops.

Wave bars come from the layer's audio peaks. Unselected layers are mint. The selected layer is pink. A selected section is a pink band. Bar lines sit on the ruler from the song tempo. Fit, 1.5×, and 2× change how wide the timeline is. The timeline still scrolls sideways.

Original layers and edited layers are labeled. An edited layer is one added from a transform. The original recording stays.

## Magic tools

Magic Transform is the Transform panel. Choosing a package keeps the original and adds a layer. Strings, synth, Magic Clean, Magic Tune, Magic Erase, and Magic Marker are not connected. The Magic Log lists the layers that are actually in the song and says so. It does not report a cleanup that did not run.

## Layout

My Music and Studio stay the two places. Under 760px the library and studio swap, and panels are a bottom sheet. From 760px to 1099px the open panel is a side sheet. At 1100px and up, library, timeline, and panel sit in three columns.

There is no component showcase in this repository. The page itself is the review surface.
