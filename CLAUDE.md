# piano-stars: working rules for Claude Code

Shared rules for all coding projects are in `../CLAUDE.md`, and they apply here. This file adds this project's rules. The full decision history is in `docs/decisions.md`; when a decision changes, update that file and note why. The original plan and phases are in `../_briefs/piano-stars/brief.md`.

## Workflow

- **Never commit directly to `main`.** The first commit was the only exception. All work goes on a branch and reaches `main` through a pull request that the owner merges.
- This repo is public. Write "the player" in every file, commit message, branch name, and pull request. Never a name, age, or pronoun.

## Locked decisions

- **Platform:** web app added to the iPad home screen. Works offline after the first load (Phase 3).
- **Code:** plain HTML, CSS, and JavaScript ES modules. No framework, no build step.
- **Repo:** public.
- **Hosting:** GitHub Pages from `main`.
- **Data:** weeks, checkmarks, stars, and stickers in `localStorage`. Nothing leaves the device.
- **Week:** runs from one lesson to the next. A week starts when a new list is entered.
- **Testing:** Node's built-in test runner (`node --test`). Logic lives in modules that don't touch the page, so it can be tested.

## Design rules

Kids' app rules in `../CLAUDE.md` apply, with these changes for this project:

- **iPad first.** Designed for an iPad in either orientation; must still work on a phone. Tap targets at least 48px.
- **System keyboard on one screen only.** The "This week's list" box uses the system keyboard so the player can dictate, type, or paste. Everything else is tap only.
- **Kind pacing.** No timers, no points shop. Every finished practice gets a gift. Extra practice days are never prompted. A missed week is shown without scolding.
- **Stickers are original SVG drawings** made from simple shapes. No commercial characters, team logos, or brand colors. Every sticker gets the same finish when it is shown (an even outline, a white cut-out border, a shadow, and a gloss), from the `sticker-look` filter in `src/app.js`, so a new drawing only needs flat shapes and colors.
- **No external network requests.** No CDNs, web fonts, or third-party scripts.
- **Look:** a night sky. Practice days are gold stars on a music staff. Colors and the font are set once at the top of `styles.css`; use those variables instead of new colors.
- **Motion:** only in answer to a tap (check pop, gift lid, confetti), and always switched off under `prefers-reduced-motion`.

## Repo layout

```
index.html         the one page; screens are drawn into it by src/app.js
styles.css         all styling
src/week.js        the week's data and rules (no page code, so it is testable)
src/rewards.js     the rules for stars, gifts, and stickers (testable)
src/history.js     past weeks and the week streak (testable)
src/prize.js       the grown-up-set prize and its progress (testable)
src/backup.js      builds and checks the backup file (testable)
src/storage.js     saves and loads from localStorage
src/app.js         draws the screens and handles taps
data/stickers.js   the sticker album: sets of ten original drawings. Add a
                   set or a sticker here and the album makes room for it
sw.js              service worker: saves the app's files so it opens offline.
                   Add every new file to its FILES list (a test checks this)
manifest.webmanifest  name, icon, and colors for the home-screen app
assets/            app icons. icon.svg is the drawing; the three PNG files are
                   copies of it at fixed sizes (see README)
tests/             node --test files
docs/decisions.md  decision history
```

## Preview locally

`python3 -m http.server 8002`, then open http://localhost:8002.
