# 01 — Product

## One line

Grumble shows survivors what their own dinner does to their blood sugar, and gets them to eat it earlier, walk after, and not eat it alone.

## The five parts

All five read and write one object, the person's **food graph** (`02-food-graph.md`).

| # | Part | What the person sees | What it answers | Spec |
|---|---|---|---|---|
| 1 | Intake | A five-minute conversation, not a form | Who are you, what do you eat, who do you eat with, what's a good day for you | `03` |
| 2 | What-if | Pick a dish, a time, a walk; see the curve | Does a late dinner matter, is a walk worth it, how much is enough | `04` |
| 3 | Daily Grumble | One screen a day: energy, hunger, mood, who's coming to dinner; one suggestion back | What should I do tonight | `05` |
| 4 | Versailles table | Host a table or find a seat; the menu; fund a week | Who am I eating with | `06` |
| 5 | Coach view | The program at a glance, who to call first | Who is sliding and why | `07` |

## Why a table is the product

The synthetic program's strongest signal is not a nutrient. Coaching moved HbA1c −0.22; emailed tips −0.06. The overnight fast added −0.04 on top of coaching. Walking after dinner was the strongest single behavior (Spearman −0.26 with HbA1c change); total steps were not (+0.12). The things that worked are the things a dinner at 6:30 with a walk down Calle Ocho after does by construction: early meal, familiar dish, movement right after, and a person across the table. Nobody at the table has to understand glucose.

## The user

Primary: a person in Miami-Dade or Broward who finished cancer treatment and is enrolled in or referred from a Sylvester survivorship program. Median age in the challenge data is 67. 34% prefer Spanish, 4% Haitian Creole. The modal case is a retiree eating alone in front of the TV at 9:30 pm.

Secondary: the Sylvester coach running the program, who gets a screen that says who to call first.

Tertiary: a donor who funds a week at the table.

## Success criteria for the hackathon build

1. Marisol's demo (`13-demo-script.md`) runs end to end in under three minutes with no network.
2. The simulator reproduces the three answers in `README.md` for any dish in `dishes.json`, with the numbers traceable to `data/simulator-params.json`.
3. Jean (night shift) is never told his 2 am dinner is late.
4. Tony ($60/week) is never suggested a dish that costs more than his budget allows.
5. Spanish works on every screen in the demo path.
6. Nothing in the UI uses the words lonely, depressed, poor, obese, avoid, should, or cheat.

## Out of scope

Real CGM pairing, real tracker sync, accounts, payments (the donation screen is a mock), push notifications, the Creole translation beyond the daily check-in.

## Risks the build must respect

| Risk | Mitigation in the build |
|---|---|
| Simulator reads as a medical forecast | Curve is drawn as a band, titled "people like you", with the n shown; never a single line |
| Tone reads as flip to a clinician | The character is dry, never mocking; copy reviewed against `09` |
| Night-shift timing logic breaks | All timing is relative to `schedule.sleep_start`; Jean is a test fixture |
| Four half-built screens | Build order in `README.md`; each step demoable alone |
| Mood check-in surfaces distress | Mood ≤ 2 three days → coach notified; a red screen shows the Sylvester line; no self-help scripts |
