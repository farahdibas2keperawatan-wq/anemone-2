# Design system: "Magical Underwater"

Tokens live in `src/app/globals.css` (`@theme`). Primitives live in `src/components/ui.tsx` and `games/shared.tsx`.

## Colour
| Token | Hex | Use |
|---|---|---|
| `ink` / `ink-soft` | #1d3557 / #4a6382 | Text (never pure black) |
| `sea` | #4cc3f5 | Primary actions, speaker button |
| `lagoon` | #2fd1b5 | Go / correct / "Mulai" |
| `coral` | #ff8a7a | Mascot, warm accents |
| `sun` | #ffcd4d | Stars, rewards, current item, hints |
| `lilac` | #b9a2ff | Magic, XP, parent gate |
| `sand` / `shell` / `foam` | #fff4dc / #ffe3ec / #f2fbff | Card and surface fills |

The background is a light water gradient with a sandy floor and slow rising bubbles. The palette has no dark or threatening tones, and **red is never used for wrong answers**.

## Typography
- **Baloo 2** (600/800) for display text: titles, every letter, syllable and word the child reads.
- **Nunito** (600/800) for body text.
- Reading content is shown at 48–72px. The smallest text in the child's screens is 18px; small captions appear only in the parent area.
- Fonts are self-hosted via `@fontsource`, so there are no third-party font requests.

## Shape & components
- **`.btn-chunky`** is the core tappable element: a solid colour face with a 6px "edge" shadow underneath that presses down when tapped. Tones: `sea`, `lagoon`, `coral`, `sun`, `lilac`, `white`, `sand`.
- Corner radius is 24–40px. Tap targets are at least 56px; answer cards are 112px or taller.
- `OptionCard` has these states: `idle`, `selected` (sun-coloured), `wrong` (soft wiggle), `correct` (lagoon-coloured pop), `hint` (sun outline that pulses), `matched`, `dim`.
- Iconography: Lucide icons for controls, emoji for content until illustrations are commissioned.

## Mascot: Anemone
An original SVG sea anemone with a coral body and six pastel tentacles. Moods: `happy`, `cheer`, `think`, `sleepy`. It sways all the time and speaks through a speech bubble together with the voice.

## Motion
- Spring-based entrances (stiffness 220–260), with 200–600ms transitions.
- At most one looping animation in focus at a time: the current hint, the next word, or the mascot.
- `prefers-reduced-motion` turns off the bubbles and shortens all animations.
