# Songbird

Copyright © 2026 Whitney Kotlewski. All rights reserved.

Songbird is a browser music studio. People keep their own recordings, shape a song on one timeline, and come back to it from My Music. This public repository is the interactive page. It is not a license to copy the product.

Internal product, design, and architecture notes are kept in a private repository for the engineering team. They are not published here.

## What the public page does

There are two places: **My Music** and **Studio**. Everything else opens over the song.

- My Music lists songs on this device and opens one into the studio.
- The timeline scrolls sideways through the song. That is separate from stereo pan, which places a layer left, center, or right in the speakers.
- My Music includes five example songs you can play. Each one keeps the original sound and adds a part made from it: humming becomes piano, guitar, or choir; claps become drums; a beatbox becomes bass. The song has a length and a shape.
- Build asks how long the song should be, in your own words or from a few common lengths. A take then loops until the song is that long.
- Build also asks what the song should do, and offers the usual shapes: steady, a soft intro that builds and then softens, a climax, or verse and chorus. The shape changes loudness across the song. The original recording stays as it was.
- Record listens for tempo first. Clap, snap, or beatbox a pulse and the metronome follows it, with a count of four before the next take. A hummed recording sets the tempo instead when you have not already given a pulse.
- Record uses the microphone. The click plays through the speakers and is not mixed into the take.
- A kept take can be played, and volume, mute, solo, and stereo pan apply to it.
- Undo and redo step through those edits.
- Naming a layer as guitar, drums, bass, or another instrument does not change the recorded sound. Export and video are not connected.

Recordings stay in the browser tab. Refreshing the page keeps the song list on this device and drops the audio.

## How it was built

The page is static HTML, CSS, and JavaScript in `site/`. There is no application framework and no server. The script uses the Web Audio API for playback, metering, and the click, and the MediaRecorder API for the microphone. Song metadata is stored in `localStorage`. Audio buffers stay in memory for the life of the tab.

GitHub Pages serves the `gh-pages` branch at [wkotlewski.github.io/songbird-studio](https://wkotlewski.github.io/songbird-studio/). The files in `site/` are copied to the root of that branch. `404.html` matches `index.html` so a refresh still opens the page. `.nojekyll` keeps Pages from running the files through a site generator.

To publish a change, update `site/`, copy those files to a checkout of `gh-pages`, commit, and push that branch.

## Copyright

The Songbird name, interface, interaction design, and product are owned by Whitney Kotlewski. Looking at this repository or using the public page does not grant any right to copy, reproduce, modify, distribute, or build from the Songbird idea or interface.

All rights reserved.
