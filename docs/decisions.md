# Decisions log

Every project decision, when it was made, and why. When a decision changes, don't delete the old row: mark it as replaced and add a new row explaining what changed and why.

| Date | Area | Decision | Reason |
|---|---|---|---|
| 2026-11-13 | Code | Plain HTML, CSS, JavaScript ES modules. No framework, no build step | Every file stays readable for a beginner |
| 2026-11-13 | Workflow | After the first commit, never commit directly to `main`; every change goes through a branch and a pull request | Gives the owner a review step before anything reaches `main` |
| 2026-11-13 | Platform | Web app added to the iPad home screen, offline after first load | No App Store and no paid developer account |
| 2026-11-13 | Repo | Public | Free GitHub Pages. The repo holds only app code, never names, notes, photos, or practice data |
| 2026-11-13 | Data | (Replaced, see the last Data row.) `localStorage` for weeks, checkmarks, stars, stickers. IndexedDB for note photos | Nothing leaves the device. Photos are too big for `localStorage` |
| 2026-11-13 | Entering the list | One text box, one item per line, filled by keyboard dictation, typing, or pasting | All three keep the list on the device. Sending the photo to an AI service, and publishing a weekly file in this repo, were both considered and rejected for privacy |
| 2026-11-13 | Design | iPad first, overriding the shared "phone first" rule | The app is used on an iPad |
| 2026-11-13 | Design | System keyboard allowed on the list screen only, overriding the shared "no system keyboard" rule | The player reads and types fluently, and dictation needs the system keyboard |
| 2026-11-13 | Week | A week runs lesson to lesson and starts when a new list is entered | The checklist always matches the current teacher's note |
| 2026-11-13 | Goal | 3 practice days a week by default, adjustable | Matches the usual schedule |
| 2026-11-13 | Rewards | Stars per item, a gift box after each finished practice, a golden gift at the weekly goal, a sticker album (space, animals, sports, places), no repeat stickers | Owner's choice. A "mystery song" reward was considered and dropped |
| 2026-11-13 | Pacing | A week streak counts weeks that met the goal, with parent-set holiday weeks. Extra days are never prompted | Keeps to the shared "kind pacing" rule while fitting a 3-days-a-week habit |
| 2026-11-13 | Honesty | Checkmarks are self-reported. No timers, no microphone | Trust and simplicity |
| 2026-11-13 | Features | Removed the "Read it to me" button | The owner decided it isn't needed: the player reads the list without help |
| 2026-11-13 | Features | Removed the photo of the teacher's note | The owner decided it isn't needed, because the list is dictated or typed straight from the paper note |
| 2026-11-13 | Data | Everything is in `localStorage`. IndexedDB is no longer used | There are no photos to store |
| 2026-11-13 | Rewards | Added two sticker sets, "Music" and "Things that go", for 60 stickers in all | The owner asked for room for more stickers. At about 3 practices a week, 40 would run out in roughly 3 months |
| 2026-11-13 | Design | A night-sky look: each practice day is a gold star sitting on a music staff like a note. The home screen also shows the last eight weeks as star stacks, with the streak drawn as a gold line, and running totals | The owner asked for a more appealing look and to see the streak and successes on the home screen |
| 2026-11-13 | Design | Short animations only where the player does something: a checkbox pops, a gift lid lifts, confetti falls once. All are switched off when the device asks for less motion. A rounded system font is used, so nothing is downloaded | Keeps to the shared rules: no external requests, kind pacing |
| 2026-11-13 | Name | The app is called "Starry Keys" (it was "Practice Stars" while being built). The repo keeps the name `piano-practice` | The owner asked for a name. It joins the two things on screen: stars and piano keys |
| 2026-11-13 | Icon | A gold star with a note stem in a night sky, above piano keys. Drawn by `assets/make-icons.py` | Matches the home screen, where practice days are star-notes |
