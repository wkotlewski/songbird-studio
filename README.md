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
- The goal, on top of that, is a loop pedal without the technical steps. A kid or an adult records a section, loops it for the song length they want, can edit or remove sections on that layer, and stacks other layers the way a performance builds. Fill layer with this section loops the selected part across the layer you have selected. Add, rename, and Remove still change the song's sections. Each new recording stays its own layer. Undo puts a filled layer back.
- Build also asks what the song should do, and offers the usual shapes: steady, a soft intro that builds and then softens, a climax, or verse and chorus. The shape changes loudness across the song. The original recording stays as it was.
- Record listens for tempo first. Clap, snap, or beatbox a pulse and the metronome follows it, with a count of four before the next take. A hummed recording sets the tempo instead when you have not already given a pulse.
- Record uses the microphone. The click plays through the speakers and is not mixed into the take.
- Transform lists 25 genre packages. Preview plays only the steps this browser can render, such as chords, bass, and a drum cell, without adding them. Apply puts those layers on the timeline and leaves the recording in place. Undo removes that package. Variations that are not playable yet stay labeled that way. Magic Clean, Magic Tune, Magic Timing, Magic Eraser, and Magic Marker are listed and do not process audio.
- Transform starts from the recording. It picks a package, variation, and time period, then you can change them. Choose vocals or an instrument. Vocals can stay solo, sit as background, or become a synthesized choir. Instruments can be solo notes or chords, then piano, Rhodes, guitar, horn, drums, or bass. Pitch correction eases a voice toward the note it heard. Autotune pulls harder. As recorded leaves the take alone. Mic choices are close, room, or bright tone, not a model of a real microphone. Reverb, echo, and a small, medium, or large room are heard on the layer. A time period updates that same layer. Undo puts the original back. A genre package can still add its ready instruments beside the recording. These are played in the browser, not recordings of those instruments.
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
