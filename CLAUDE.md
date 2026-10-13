# Speaking Room

Mendy's daily English speaking practice app. He takes private speaking lessons 2 to 3 times a week with a teacher named Jonathan. The goal is fluency: give a lecture in English by the end of the academic year. Reading is strong; speaking lacks basics.

Live at https://vibecodingedu.github.io/speaking-room/ (GitHub Pages, branch main, root). Static files only, no build step.

## Files
* `bank.js`: leveled sentence bank for fresh random practice (see Levels below).
* `content.js`: all public practice content (decks, cards, free talk topics, chat scenarios, lesson log). This is what changes after each lesson.
* `app.js`: the app (drill with speech recognition and word diff, AI chat partner, one minute free talk with words per minute, progress and persistence score, settings).
* `app.css`, `index.html`, `sw.js`, `manifest.webmanifest`, `icons/`.
* `apps-script/`: the Google Apps Script backend (Anthropic key, sync, private cards). Setup in `SETUP.md`. Mendy deploys it himself; changes there need a new deployment version.

## After each lesson (the main recurring task)
Mendy pastes Jonathan's lesson summary (corrections, vocabulary, homework, attached PDF topics).
1. Add an entry to `CONTENT.lessons` (n, date, focus, notes).
2. Turn every correction into a card in deck `lesson` (Hebrew prompt, English target, short Hebrew note on the rule). Add `fix` cards for the grammar focus of the lesson and `ask` questions that force the new structure. If the lesson introduces a new grammar topic, update `SYSTEM_COACH` in `app.js` so AI feedback focuses on it.
3. Card ids are permanent and unique (`l11`, `f16`, ...). Never renumber or reuse an id; progress is stored by id. To retire a card, delete it; do not reuse its id.
4. Bump `CACHE` in `sw.js` (`speaking-room-vN`) so phones pick up the change.
5. Commit and push to main.

## Levels and the sentence bank
* `bank.js` holds about 290 general sentences in six levels (`BANK.levels`, `BANK.rows[level]`), plus free talk topics per level. Each daily session (14 cards) = up to 6 due reviews + up to 6 new lesson cards (newest decks first, at most 2 per deck) + fresh bank sentences at the current level (one stretch sentence from the level above), shuffled.
* Bank ids are positional (`b3-012`). Only append rows at the end of a level; never insert, reorder or delete (replace a retired row with `null`).
* Level engine (`recordLevel` in `app.js`): only the FIRST attempt at a bank sentence of the current level counts. Score = average of recognition accuracy and the self rating (95/72/35). After 25 attempts: average 85+ and 70%+ fluent moves up; after 15: average under 60 or 40%+ misses moves down. A fresh sentence rated fluent on first try goes to box 4 (back in a week); others enter normal repetition.
* Grammar in the bank must stay inside what the lessons have covered. When a lesson adds a structure, add rows using it to the right levels (append only) and say so in the lesson entry.
* Keep each level well stocked: when the summary shows he has seen most rows of his level, add 30 to 40 more.
* Later, with the server running, live generation by Claude can add fresh sentences on top of the bank.

## Card kinds
translate (`he` to English), fix (`bad` sentence), ask (`q`, open answer), transform (`src` English sentence + `task` in Hebrew such as "אמור בעבר" or "אמור בשלילה"). Decks so far: lesson, fix, past, goodwell, vocab, edsound, whisky, music, lipchitz, lecture, ask, personal. Bank rows use kind "x" for transform with the task as the 7th field.

## Personal content stays out of this repo
The repo is public. No names of family, his school, his city, his university, his teacher's company, or other identifying details in plain text anywhere in the repo. Lipchitz facts in third person are fine.
Sentences about Mendy himself live encrypted in `personal.enc.json` (AES-GCM, key derived with PBKDF2). The app decrypts them in the browser with the personal key, which each device gets once from Mendy's personal link (`#k=<key>`). The key is never committed.
To add personal cards: ask Mendy for his personal link (the key is the part after `#k=`), then
`node tools/personal.mjs decrypt <key> > private/personal-cards.json`, edit (cards: `{"id":"p21","he":"...","en":"...","note":"..."}`, optional `d` of an existing deck, `q` for open questions, `bad` for fix cards, `src`+`task` for transforms; ids permanent), then `node tools/personal.mjs encrypt private/personal-cards.json <key>`, commit only `personal.enc.json`. `private/` is gitignored.

## Persistence score
0 to 100 over the last 14 days (or since the first practice day): 60% days practiced (full day = 10 active minutes), 25% average minutes on active days (target 15), 15% streak (target 7). Only active time counts: gaps over 2 minutes between interactions are not counted. When Mendy pastes the progress summary from the app, review it honestly: name the score, what slipped, which sentences keep failing, and what to change.

## Writing rules for anything shown to Mendy
* Hebrew UI, plain and natural. English only for practice content.
* Never use an em dash or an en dash as a separator, anywhere (UI strings, notes, prompts, docs). En dash only in number ranges. Use commas, colons, parentheses or new sentences.
* No emojis. No inflated wording.

## Notes
* Speech recognition: Web Speech API (`webkitSpeechRecognition`). Works in Safari on Mac and iPhone (needs Dictation enabled) and in Chrome. Apple's recognizer sometimes silently fixes grammar, so the word diff is a guide; the self rating stays.
* The drill scores the primary transcript only; alternatives are used only when the primary is clearly a mishearing (score under 0.5).
* Level state (`S.level`) merges by newest `updatedAt`, in both merges. Day counters are stored per device (`S.days[date][deviceId]`) so Mac and iPhone add up. The merge rules exist twice (`mergeState` in `app.js` and in `Code.gs`); keep them identical.
* AI models are chosen in `Code.gs` (`MODELS`): quick for chat turns and open answer checks, smart for free talk feedback.
* Releases: bump `CACHE` in `sw.js` AND the `?v=N` on the script and style tags in `index.html` to the same N. GitHub Pages sends a 10 minute browser cache, so without the version query phones keep running the old app.
* Microphone: the default engine is the on-device one (Whisper via transformers.js, `Xenova/whisper-base.en`), because it can pick the device. `openMic` skips virtual inputs (eqMac, Zoom, projectors, loopback); Mendy's Mac has eqMac first in the list and Chrome's default input was silent because of it. The browser recognizer is still available in Settings.
