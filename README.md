# Songbird

Copyright © 2026 Whitney Kotlewski. All rights reserved.

Songbird is a browser music studio. You start from a sound you already have — a hum, a clap, a beatbox, or an instrument — and turn it into a song you can shape, mix, and come back to.

**Open Songbird:** [wkotlewski.github.io/songbird-studio](https://wkotlewski.github.io/songbird-studio/)

## Use it for

- Keeping a recording and building a song from it
- Looping a section and stacking another layer on top
- Trying a different sound on a layer you already kept
- Mixing the layers and downloading the song
- Finding your songs again in My Music on this device

## What you can do

My Music and Studio are the two places. Record, Build, Transform, Mix, and Finish open over the song.

- **Record** from the microphone, or start from a simple vibe.
- **Build** the shape of the layer you kept.
- **Transform** that layer, or add a genre package beside the recording.
- **Mix** the layers together.
- **Finish** downloads a song file. Nothing is uploaded.
- **Undo** steps back through edits.

Songs you make stay listed in this browser. The recording itself stays in the tab.

## For engineers

The public page is a static site: HTML, CSS, and JavaScript, hosted on GitHub Pages. There is no application framework and no server.

Sound runs in the browser with the Web Audio API. The microphone uses the MediaRecorder API. Song titles and settings stay in the browser's local storage.

Genre packages are Songbird's own. They are informed by open music references, which are credited here and are not bundled into the page:

- [Open Music Theory V2](https://open.umn.edu/opentextbooks/textbooks/1254)
- [Music Theory for the 21st-Century Classroom](https://open.umn.edu/opentextbooks/textbooks/1010)
- [music21](https://music21.org/music21docs/)
- [librosa](https://librosa.org/doc/latest/)
- [Ableton Learning Music](https://learningmusic.ableton.com/)
- [Berklee: Writing and Analyzing Hit Songs](https://online.berklee.edu/courses/writing-and-analyzing-hit-songs)

Type on the page is [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans).

How those packages become sound, and the rest of the product design, stay with the Songbird team.

## Copyright

The Songbird name, interface, and product are owned by Whitney Kotlewski. Looking at this repository or using the public page does not grant any right to copy, reproduce, modify, distribute, or build from the Songbird idea or interface.

All rights reserved.
