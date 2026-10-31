# Songbird

Copyright © 2026 Whitney Kotlewski. All rights reserved.

**For anyone with a hum, or a song in their heart.**

Songbird is a music studio that fits in your pocket. You bring whatever you've got: a hum, a sung line, a clap, a beatbox, a few chords on a guitar. Songbird helps you build it into a song you'd be proud to play for anyone.

You don't need to play an instrument. You don't need to know what a compressor is, or how to set up a mix. Sing the melody and Songbird can play it back as piano, guitar, bass, choir, horns, or drums. Pick a sound from the 1920s, the '70s, or today. Blend genres: gospel chords under an R&B groove, a parlor piano behind a hip-hop beat. You make the music. Songbird does the studio work.

**Open Songbird:** [wkotlewski.github.io/songbird-studio](https://wkotlewski.github.io/songbird-studio/)

## Like a loop pedal, without the learning curve

Watch someone perform with a loop pedal: they tap a beat on the guitar body, and it loops. They hum a bass line on top, and that loops too. Then chords, then a harmony, and then they sing over a whole band they built in front of you, one layer at a time.

That's the feeling Songbird is built around, for everyone, not only people who own the gear.

1. **Tap record.** Songbird counts you in: 1, 2, 3, 4.
2. **Make a sound.** Clap, hum, beatbox, or play for 2, 4, or 8 bars. You can also record until you tap stop.
3. **It loops.** Songbird closes the loop on the beat and plays it back right away, over and over.
4. **Stack the next layer.** Tap record again, and it comes in from the top, in time with what's already there.
5. **Make it magic.** Turn your hum into piano chords, your claps into a drum kit, your voice into a choir. Then mix it, and download the song.

Kids can just play. Grandparents can hum the hymn they've carried for fifty years. Musicians can sketch an idea in a minute, before it's gone.

## Who it's for

- **Kids** who want to make noise and hear it turn into music
- **Seniors and families** keeping old melodies and family songs alive
- **Hobbyists** with unfinished songs and no studio
- **Musicians** who want a quick sketchpad for a loop, a groove, or an arrangement

Songbird never guesses what you can do from your age. Big, clear controls are there for everyone, and the deeper controls are there when you want them.

## What you can do

My Music and Studio are the only two places. Everything else opens over your song.

- **Record:** use the microphone with the loop pedal, or start from a vibe: claps, snaps, guitar strums, or piano chords in the key you pick.
- **Build:** shape a layer. Keep it steady, build it up to a climax, or go verse and chorus.
- **Transform:** turn a layer into another instrument or a vocal sound. Choose the era: 1900s parlor, 1920s, '50s, '60s, '70s, '80s, '90s, 2000s, or today. Add a genre package, from 25 including gospel, R&B, hip-hop, country, jazz, Afrobeats, lo-fi, cinematic, and children's music. Or blend two together. Magic clear tidies hiss and brings a voice forward.
- **Mix:** set each layer's volume, bass, treble, left and right, and space, or pick a mix preset. Magic timing tightens notes that are barely off the beat.
- **Finish:** download the song as a WAV file.
- **Undo** steps back through any edit. Your original recording is always kept, so you can go back.

Everything stays on your device. Your songs and recordings are not uploaded anywhere.

## Still growing

Songbird is being built in the open, one phase at a time. When a feature isn't fully working yet, the studio says so instead of pretending. Coming next: tools to mark and erase a single sound in a take, and live instrument monitoring while you sing.

## For engineers

The public page is a static site: HTML, CSS, and JavaScript, hosted on GitHub Pages. There is no application framework and no server.

Sound runs in the browser with the Web Audio API. The microphone uses the MediaRecorder API. Building instruments and genre packages runs in a Web Worker, so the studio keeps playing and scrolling while a layer is being built. A looped layer is built for one pass and then repeated. Song titles and recordings stay in this browser.

`node check-packages.js` checks the genre packages and the sound engine.

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
