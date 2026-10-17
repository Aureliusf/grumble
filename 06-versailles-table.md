# 06 — The Versailles table

The flagship. A standing early-evening table at Versailles, 3555 SW 8th St, open to anyone in the program, with a Grumble menu and the portions already set, and a walk down Calle Ocho after. Every lever in one evening: early meal, familiar dish, ten minutes of movement, a person across the table. Nobody at the table has to understand any of it, and nobody at the table pays.

Everyone in Miami knows Versailles. That is the reason it is Versailles and not a list of restaurants. Do not generalize this screen to "restaurants" in the hackathon build.

## Three screens

### 1. Host or find

One screen, two halves, no label on which kind of person you are.

- **Find a seat.** Upcoming tables (demo: next four Tuesdays). Each shows the night, 6:30 pm, seats left of 8, the host's first name and "5 years out" (from `years_since_treatment`, rounded), the language at the table. Button: "Save me a seat." Writes `accountable.table.role = guest` and a reservation in `log.tables[]`.
- **Host a table.** "You pick the Tuesday. We fill the seats and cover the plates." Form: which Tuesday, how many seats (4–8), language. Writes `role = host` and a hosted table. The host sees guests' first names and, from each guest's food graph, `dietary_restrictions` and `never_mention`, nothing else. This is the blueprint doing real work: the host knows before anyone sits down.

A person can be both. Hosts are survivors further out; the demo seeds two hosts (from `personas.json`: Tony hosts, Marisol is a guest) and two from invented names in the fixture.

### 2. The menu

The Tuesday menu at Versailles, five plates, each with its move already applied and its numbers from `dishes.json`:

| Plate | The move | ~kcal | carbs g | fiber g |
|---|---|---|---|---|
| Vaca frita, moros, no maduros | beans in the moros first, one scoop | 620 | 60 | 11 |
| Pollo a la plancha, frijoles negros, small rice | beans first | 560 | 45 | 10 |
| Pescado a la plancha, ensalada, small rice | as is | 480 | 35 | 5 |
| Picadillo, moros, two maduros | picadillo first, two not four | 640 | 70 | 6 |
| Sopa de pollo, Cuban bread (one piece) | as is | 420 | 40 | 4 |

Cafecito after. Flan is on the menu for the table to share, one, cut eight ways. Grumble says so on the screen; it is the permission stance made literal.

(Numbers above are derived from `dishes.json` medians with the portion rules in `04-simulator.md`; recompute in code, don't hardcode.)

The menu screen has one button: "What this does for me," which opens the simulator pre-loaded with the plate, 6:30 pm, and a 10-minute walk, versus the person's starred dinner at their usual time with no walk. For Marisol that comparison is the demo's hero number.

### 3. Fund a week

The donation screen. Mock payment; the point is what one gift covers.

- Headline: "One Tuesday at Versailles, eight people, eight plates and cafecito: about **$160**." (8 × ~$20 incl. tax and tip; label as an estimate, Versailles plates are in the mid-teens.)
- Three buttons: Fund a seat ($20), Fund a table ($160), Fund a month ($640).
- Beneath, the ledger for the demo: "October: 3 tables funded, 24 seats, 19 taken."
- A line for Sylvester's development office: "Tables are funded through Sylvester Comprehensive Cancer Center. Donors can sponsor a Tuesday in someone's name." Donor names appear on the table's card as "This Tuesday's table is from the García family" if they choose.

No real payment in the hackathon build. The button writes to `log.donations[]` and updates the ledger.

## After the table

The next morning's Daily Grumble opens with one line: "Tuesday was a good one. {n} people, dinner at 6:30, and you walked." Attendance writes `table-tuesday` as passed for the week and `accountable.table.last_attended`. Walking after is inferred from the tracker or self-reported on the same line ("Did you walk? yes / a little / no").

## Why this screen exists, for the pitch

- Meal Train and the casserole brigade exist for people in treatment and stop the week treatment ends. The table starts when the casseroles stop.
- Coaching beat tips four to one in the synthetic program. The table is coaching with a plate.
- The economic-ability risk and the company risk are answered by the same $20.
- Sylvester's liability is a reservation, not a stranger's kitchen.

## Fixtures

`src/fixtures/tables.json`: four upcoming Tuesdays, two hosted (Tony, "Ana R., 6 years out"), seats, languages, one funded by "the García family".
