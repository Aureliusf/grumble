# Grumble — the pitch deck (presenter notes)

This file is for the team, not the audience; it lives outside `public/` so the deployed site doesn't serve it. The deck itself is `public/presentation/index.html`, public at `/presentation/`.

Seven slides, five minutes: about two minutes of slides, two and a half of live demo, a thirty-second close. The full talk track is `13-demo-script.md`; the speaker notes (N) carry it slide by slide.

## Run it

Open `public/presentation/index.html` in a browser (double-click works), or run `npm run deck` and go to http://127.0.0.1:8765/presentation/ (local only, port 8765). It's one self-contained file. Offline, the fonts fall back to the system font and nothing else changes. The app also serves it at `/presentation/`, locally and on Vercel.

Start the app before the pitch (`npm run dev` at the repo root). The demo slide's **Open Grumble** button opens `/today?demo` on whatever server is showing the deck, or `http://localhost:3000/today?demo` when the deck is opened from disk or `npm run deck`. `?demo` resets the app to the demo state: Marisol's plan, nothing logged, English. If the app runs elsewhere, open the deck as `index.html?app=http://localhost:3456`. Add `?debug` to any app URL to see the date strip and the "fixture" chip again.

Add `?presenter` to the deck URL to show the key hints. The keys work either way.

| Key | Does |
|---|---|
| → / Space / click right | next slide |
| ← / click left | previous |
| F | fullscreen |
| N | speaker notes (what to say, per slide) |
| T | the 5:00 timer, which turns coral past five minutes |

## The five minutes

| Time | Slide | The point |
|---|---|---|
| 0:00–0:25 | 1 · Thesis | Treatment ends. People stop checking in. Dinner gets late, and it's alone. Grumble helps with what you eat, when you eat, and who you eat with. |
| 0:25–0:50 | 2 · The social side | NHANES, 808 real survivors: with severe depressive symptoms they eat *less* (1,414 vs 1,781 kcal), fiber drops (10.9 vs 15.4 g), HbA1c 5.9 vs 5.7, diabetes 45% vs 22%. |
| 0:50–1:15 | 3 · The levers | First the challenge's three questions (late dinner +24, walk −23, ten minutes is enough), then money, social, the meals, time: one number each, tagged real or synthetic. Associations, not proof. |
| 1:15–1:40 | 4 · **The table** | The center of the pitch. One Tuesday at Versailles hits every lever. Survivors host; donors pay $20 a seat. |
| 1:40–1:55 | 5 · Around the table | The daily loop: intake that learns, Today, What if. |
| 1:55–4:30 | 6 · Demo | Four beats: burger at lunch → dinner turns lean; check in → the table card → "I'll be there"; What if, walk 20 = "Same as ten"; tap ES. |
| 4:30–5:00 | 7 · Close | "Four levers. One evening. Someone across the table." |

## Pre-flight

- [ ] Restart `npm run dev` (seats and funding live in server memory; a restart resets them).
- [ ] `.env` has `ANTHROPIC_API_KEY`. On the venue Wi-Fi, log "a burger and fries" once to confirm Claude answers, then open `/today?demo` to clear it.
- [ ] Deck open, fullscreen (F), timer (T) started on slide 1.
- [ ] One full run-through with the timer: the demo beats in under 2:30.

## Q&A: short answers

- **Is this real data?** Two kinds, tagged on every number. NHANES 2011–2014 is real (808 cancer survivors, observational, unweighted). The 12-week program and the glucose patterns are the challenge's synthetic data, the Crane Lab's design. On screen it's "people like you", a range, never a forecast. Nutrients are USDA FoodData Central.
- **Isn't this another glucose app?** The curve is table stakes. Nobody asks who you eat with, nobody plans around bandeja paisa or vaca frita, and nobody funds the table.
- **Who runs the table, and who's liable?** It's a reservation at a restaurant everyone in Miami knows, inside a Sylvester survivorship program, not a stranger's kitchen. Hosts are survivors further out. The host sees first names and what guests don't eat, nothing else (06).
- **Who pays, and does it scale?** Donors, through Sylvester: about $20 a seat, $160 a table, $640 a month of Tuesdays. Versailles is the pilot because everyone knows it; the same table works at any familiar restaurant (a Haitian place in Little Haiti, a Colombian one in Doral).
- **What goes to Claude?** Only the words the person typed about a meal, and the language. No name, no diagnosis, no person id. Claude can only answer with foods and dishes from our fixed lists, and every number on screen is computed in code, not by the model.
- **Does it work without AI?** Yes: without the key, a word match logs simple foods; everything else (balancing, the simulator, the table) is plain code.
- **Night shifts?** "Late" is measured from the person's own bedtime. A nurse's 2 am dinner before sleeping at 9 am isn't late. Covered by a test.
- **Where's the coach?** Designed (spec 07), next to build: a screen that tells the coach who to call first. Today, three low days in a week already route to the coach, quietly.
- **Why 188 here and 207 in the spec?** Same math, 85.8 mg/dL above baseline. The app reports the top of the drawn curve, whose shape peaks at 0.786 of that.

## Where the numbers come from

Every number is from `12-evidence-pack.md`, which is built from the `analysis/` scripts:
- Slide 2: NHANES 2011–2014, real, unweighted, observational.
- Slides 3–4: the challenge's synthetic program and CGM data (the Crane Lab's design), labeled as such on the slides.

Change a number in `12` first, then here.
