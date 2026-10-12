# Songbird

Copyright © 2026 Whitney Kotlewski. All rights reserved.

Songbird is a browser music studio. People keep their own recordings, shape a song on one timeline, and come back to it from My Music. This public repository is the interactive page. It is not a license to copy the product.

Internal product, design, and architecture notes are kept in a private repository for the engineering team. They are not published here.

## What the public page does

There are two places: **My Music** and **Studio**. Everything else opens over the song.

- My Music lists every song in one list. There are no separate song filters. A song can be deleted, or shared by email. Share saves the address in this browser and opens your mail app with a message. It does not deliver the recording by itself.
- Mute and solo change what you hear while the song plays. Finish downloads a song file of that mix. Nothing is uploaded.
- The timeline scrolls sideways. Drag the play line, or click a section, to move through the song. Each layer name can be edited. That is separate from stereo pan, which places a layer left, center, or right in the speakers.
- My Music lists the songs made in this browser. Opening a song shows the timeline first. Use Transform, Build, Mix, and Finish from there. Singing keeps a take as a voice. A drum pocket can turn claps into a backbeat or a boom-bap kit.
- Build asks how long the song should be, in your own words or from a few common lengths. A take then loops until the song is that long.
- Build also asks what the song should do, and offers the usual shapes: steady, a soft intro that builds and then softens, a climax, or verse and chorus. The shape changes loudness across the song. The original recording stays as it was.
- Record listens for tempo first. Clap, snap, or beatbox a pulse and the metronome follows it, with a count of four before the next take. A hummed recording sets the tempo instead when you have not already given a pulse.
- Record uses the microphone. The click plays through the speakers and is not mixed into the take.
- Transform uses the layer you select. Pick a time from the 1900s through today, then solo or chords, then hold, strum, or on the beat, then a sound: acoustic piano, Rhodes, acoustic guitar, electric guitar, horn, drums, bass, or choir. Solo is one note. Chords are a triad from each note. Strum rolls the chord down and up. On the beat hits with the click. Drums stay a kit. Bass stays on single notes. The original recording stays. Selecting a sound you already added and picking again switches that sound, its time, and how it plays. These are played in the browser, not recordings of those instruments.
- Mix is a channel strip for each layer, with large presets for the whole song and for vocals, instruments, drums, bass, and choir. Fine tune adjusts volume, bass, treble, left and right, and space. Mute and solo are on each strip.
- Play and record wake a night sky behind the song. Stars, light, and each waveform move with the sound. Keeping a take or adding a new part does the same for a moment.
- Undo and redo step through those edits.
- Naming a layer as guitar, drums, bass, or another instrument does not change the recorded sound. Export and video are not connected.

Recordings stay in the browser tab. Refreshing the page keeps the song list on this device and drops the audio.

## How it was built

The page is static HTML, CSS, and JavaScript in `site/`. The look is the Songbird design system in `DESIGN.md`: Plus Jakarta Sans, mint for actions, pink for recording and sliders, and the emerald blush mist as the page background, with glass panels over it. There is no application framework and no server. The script uses the Web Audio API for playback, metering, the click, and a sky that moves with the sound, and the MediaRecorder API for the microphone. Song metadata is stored in `localStorage`. Audio buffers stay in memory for the life of the tab.

GitHub Pages serves the `gh-pages` branch at [wkotlewski.github.io/songbird-studio](https://wkotlewski.github.io/songbird-studio/). The files in `site/` are copied to the root of that branch. `404.html` matches `index.html` so a refresh still opens the page. `.nojekyll` keeps Pages from running the files through a site generator.

To publish a change, update `site/`, copy those files to a checkout of `gh-pages`, commit, and push that branch.

## Copyright

The Songbird name, interface, interaction design, and product are owned by Whitney Kotlewski. Looking at this repository or using the public page does not grant any right to copy, reproduce, modify, distribute, or build from the Songbird idea or interface.

All rights reserved.
