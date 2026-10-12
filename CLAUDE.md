# Speaking Room

Mendy's daily English speaking practice app. He takes private speaking lessons 2 to 3 times a week with a teacher named Jonathan. The goal is fluency: give a lecture in English by the end of the academic year. Reading is strong; speaking lacks basics.

Live at https://vibecodingedu.github.io/speaking-room/ (GitHub Pages, branch main, root). Static files only, no build step.

## Files
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

## Personal content stays out of this repo
The repo is public. No names of family, his school, his city, his university, his teacher's company, or other identifying details in `content.js`. Lipchitz facts in third person are fine. Sentences about Mendy himself go into a private deck: write a JSON array of cards (`{"id":"p5","he":"...","en":"...","note":"..."}`, optional `d` of an existing deck, `q` for open questions, `bad` for fix cards) and give it to him to import in Settings. It syncs through his server. Keep personal JSON under `private/` (gitignored) if you need a local copy.

## Persistence score
0 to 100 over the last 14 days (or since the first practice day): 60% days practiced (full day = 10 active minutes), 25% average minutes on active days (target 15), 15% streak (target 7). Only active time counts: gaps over 2 minutes between interactions are not counted. When Mendy pastes the progress summary from the app, review it honestly: name the score, what slipped, which sentences keep failing, and what to change.

## Writing rules for anything shown to Mendy
* Hebrew UI, plain and natural. English only for practice content.
* Never use an em dash or an en dash as a separator, anywhere (UI strings, notes, prompts, docs). En dash only in number ranges. Use commas, colons, parentheses or new sentences.
* No emojis. No inflated wording.

## Notes
* Speech recognition: Web Speech API (`webkitSpeechRecognition`). Works in Safari on Mac and iPhone (needs Dictation enabled) and in Chrome. Apple's recognizer sometimes silently fixes grammar, so the word diff is a guide; the self rating stays.
* The drill scores the primary transcript only; alternatives are used only when the primary is clearly a mishearing (score under 0.5).
* Day counters are stored per device (`S.days[date][deviceId]`) so Mac and iPhone add up. The merge rules exist twice (`mergeState` in `app.js` and in `Code.gs`); keep them identical.
* AI models are chosen in `Code.gs` (`MODELS`): quick for chat turns and open answer checks, smart for free talk feedback.
