# 13 — Demo script

Five minutes on stage: about two minutes of slides (`presentation/`), two and a half of live demo, a thirty-second close. The demo is Marisol, in English, from the deck's **Open Grumble** button, which opens `/today?demo`: Marisol's plan, nothing logged, English. Demo date: a Tuesday, week 4.

## Slides (≈1:55)

| t | Slide | Presenter says |
|---|---|---|
| 0:00 | 1 · Thesis | "Treatment ends. People stop checking in. Dinner gets late, and it's alone. Grumble helps with what you eat, when you eat, and who you eat with." |
| 0:25 | 2 · The social side | "808 real cancer survivors in NHANES: with severe depressive symptoms they eat 370 fewer calories and a third less fiber, and twice as many have diabetes. Distress shows up as skipped meals, not binges." |
| 0:50 | 3 · The levers | "The challenge asked three questions. Late dinner: yes, plus 24 at the peak. A walk: yes, minus 23. How much: ten minutes; twenty adds nothing. And four things shape the plate: money, social, the meals, time." |
| 1:15 | 4 · The table | "So the product isn't a chart. It's a seat. One Tuesday at Versailles hits every lever, and a survivor hosts. Nobody at the table pays." |
| 1:40 | 5 · Around the table | "Around it, one loop a day: an intake that learns, Today, and What if." |

## Demo (≈2:30): four beats

| t | Screen | Do | Say | The judge sees |
|---|---|---|---|---|
| 1:55 | Today | Read the nudge. Lunch → type "a burger and fries" → Add. | "Tuesday. She had a burger at lunch, and she tells Grumble in plain words. It doesn't scold. It keeps the burger and makes dinner the lean one." | "Dinner was at 9:40 last night. Not a crime. Tonight, aim for 8." The foods with USDA numbers, "How today's going", the spike bar moving |
| 2:40 | Today → the card | Energy, how's the day, "Just me" → Done. Open "What is this?". Tap "I'll be there". | "And it doesn't hand her a chart. It hands her a seat. Who pays? Nobody at the table. What's the catch? None." | The Versailles card: 6:30, Tony hosting; the four answers; "✓ Tuesday" |
| 3:25 | What if | Vaca frita, 9:30 pm, no walk. Then walk 10 → 20. | "Her own dinner at 9:30 against Grumble's move: same plate, earlier, one cup of rice, ten minutes outside. Twenty minutes? Same as ten. Ten is the whole trick." | The two curves, about 188 → 135 at the peak, −80% over two hours; the "Same as ten" chip |
| 3:55 | Any screen | Tap ES. | "And all of it in Spanish." | The same screen in Miami Spanish |

## Close (≈0:30)

Back to the deck, slide 7: "Four levers. One evening. Someone across the table." Stop talking.

## Backup paths

- **Logging is slow or offline:** say "it's reading what she typed", wait; without the key or the network, the word-match fallback still logs simple foods ("rice, chicken, beans"). Have the What if beat ready to go first if it stalls.
- **"Is this real data?"** "Two kinds, and every number is tagged on screen. NHANES is real survivors: distress travels with lower income, less fiber and higher HbA1c. The program and the glucose patterns are the challenge's synthetic data, Sylvester's design. We say 'people like you', a range, never a forecast."
- **"Isn't this another glucose app?"** "The curve is table stakes. Nobody has a plan for bandeja paisa, nobody asks who you're eating with, and nobody's buying the table."
- **"Where's the coach?"** "Designed (07), next to build: who to call first. Today, three low days in a week routes to the coach, quietly."
- More answers: `pitch/README.md` § Q&A.

## Pre-flight

- [ ] Restart `npm run dev` (resets seats and funding; the server keeps them in memory).
- [ ] `.env` has `ANTHROPIC_API_KEY`; on the venue Wi-Fi, log "a burger and fries" once to confirm, then open `/today?demo` to clear it.
- [ ] Deck open (`npm run deck` or the file), fullscreen (F), timer (T) at the start.
- [ ] Walk slider checked: 10 / 20 / 30 show the same number.
