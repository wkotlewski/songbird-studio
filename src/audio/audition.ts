/** Ask the studio to play the current session so a sound change is audible immediately. */
let play: (() => void) | null = null

export function bindAudition(next: (() => void) | null): void {
  play = next
}

export function audition(): void {
  play?.()
}
