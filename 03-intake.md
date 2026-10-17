# 03 — Intake: the blueprint conversation

Intake produces a valid food graph for a new person in about five minutes. It is a conversation, in the person's language, run by the Grumble character. It follows the Attestify blueprint's elicitation order: risks first, then standards negotiated against them, then what gets checked, then who shows up.

Two modes. **Scripted** is the default and must work with no network. **LLM** (Claude via `VITE_ANTHROPIC_KEY`) is optional and runs the same stages with freer language.

## Stages

Each stage writes one section of the food graph. The person can skip any question; skipped fields are left absent, never defaulted to a guess.

### Stage 0 — Language and the character

First screen: three buttons, English / Español / Kreyòl. Grumble introduces itself in one line (see `09`). No cancer talk yet.

### Stage 1 — Who you are (`person`)

Name (display only), age, what you'd call your food ("Cuban", "Haitian", "a little of everything"), when you sleep and wake, do you work and when, do you have a dog. Cancer type and time since treatment are asked last in this stage, as "and the reason Sylvester sent you here", with a skip button.

Blood sugar group: ask "has a doctor said prediabetes or diabetes?" with three answers. If the person wears a CGM, say so.

Night shift detection: if `schedule.type == "night shift"`, every later time question is phrased relative to sleep ("how long before you sleep do you usually have your last meal?"), and every standard written gets `relative_to_sleep: true`.

### Stage 2 — The four risks (`risks`)

Asked as ordinary questions, never as a screen. Order: taste, convenience, money, company. Company goes last because by then the person has been talking about food for three minutes and the question lands as natural.

**Taste.** "Name five things you'd eat every week if nobody was watching." Autocomplete from `dishes.json` by cuisine; free text allowed. "Anything you won't eat?" "What did you grow up on?" If GLP-1 or chemo appetite is mentioned: `appetite_pattern: "cycles"` or `"low"`.

**Convenience.** "How many dinners a week come from a restaurant or a window?" "Which places?" (autocomplete: Versailles, La Carreta, Pollo Tropical, Chipotle, Cava, pho, Chef Creole, Le Chic, El Palacio de los Jugos, Publix hot bar). "How many nights do you cook?"

**Money.** "About what do you spend on food in a week?" (slider $30–$300, or skip). "Do you use SNAP?" (yes/no/skip). "Who does the shopping and cooking?" "Which store?"

**Company.** "Who do you usually have dinner with?" (alone / partner / family / friends / it varies). "Who do you see in a normal week?" (free list; the UI suggests: daughter, neighbor, church, domino table, the cashier you've known for ten years). "If you had a bad day, who would you call?" Then: "There's a table at Versailles on Tuesdays for people in the program. Nobody pays. Would you want a seat sometime?" and "Would you ever host one?"

### Stage 3 — What a good day is (`standards`)

Grumble proposes, the person edits. Proposals come from a rules table keyed on the risks and the simulator:

| Trigger | Proposed standard | Statement template (en) | Why line |
|---|---|---|---|
| always | `last_meal_by` = 3 h before sleep (or 20:00 if sleep ≥ 23:00) | "Dinner by {time} so I sleep" | "People like you ran {late_peak_delta} mg/dL higher after late dinners" |
| always | `walk_after_dinner_min` = 10 | "Ten minutes walking after dinner{, with buddy}" | "Ten minutes cut the peak {walk_peak_delta} mg/dL; more didn't add anything" |
| any rice/plantain/bread dish in loves | `protein_first` | "Beans and meat before the rice" | "Fiber and protein first flattens the peak" |
| any starch dish | `starch_portion_g` = 100 | "One cup of rice, not two" | "Each 10 g of carbohydrate adds about 6 mg/dL" |
| pastry/sweet in loves | `custom` morning-only | "The {dish} in the morning, not at night" | "Same {dish}, lower peak, and it doesn't sit on the overnight fast" |
| `open_to_table` | `social_nights_per_week` = 1 (table) | "Tuesdays at Versailles with the table" | "Coaching with company moved HbA1c four times more than tips" |
| cooks ≥ 3 days | `home_cooked_days_per_week` = cooks | "Cook {n} nights" | "Days you cook are the days the numbers are real" |
| fiber in loved dishes < 8 g median | `legume_meals_per_week` = 3 | "Beans three times a week" | "Biggest fiber lever in your food" |
| `blood_sugar_group` ≠ normal and sleep window allows | `overnight_fast_hours` = 13 | "Thirteen hours between dinner and breakfast" | "The program's fast group pulled evening calories from 22% to 13%" — **skip for night shift** |

Each proposal is shown as a card with the statement editable inline and a "not this one" button. Accepting writes `negotiated_on` = today. The person must accept at least `last_meal_by` and `walk_after_dinner_min` to proceed; if they decline both, Grumble says so dryly and proceeds anyway with a `custom` "I'll figure it out" standard, flagged for the coach.

`{late_peak_delta}` and `{walk_peak_delta}` come from `simulator-params.json` → `dinner_effects_by_group[blood_sugar_group]`.

### Stage 4 — What gets checked (`procedures`)

Not a conversation. Generated one-to-one from accepted standards per the table in `02-food-graph.md`, then shown as a single screen: "Here's what I'll keep an eye on. Nothing else." The person can switch any procedure to `manual` (self-report).

### Stage 5 — Who shows up (`accountable`)

Coach is prefilled (program default). Buddy: "Who from your list would walk with you, if you asked?" Table role from Stage 2. Dog name if `has_dog`.

### Stage 6 — Your rotation (`dishes`)

For each loved dish found in `dishes.json`, Grumble writes a `move` from the rules table in `09-voice-and-copy.md` (the moves vocabulary) and shows it: dish name, the move, estimated cost. The person stars the ones they want as defaults. Places from Stage 2 become `places` entries with a generic order template per venue (see `data/example-food-graph.marisol.json` for the Versailles entry).

### Stage 7 — The contract (`contract`)

"How do you want me to talk to you?" Suggestive (default) or direct. "Anything you don't want me to bring up?" (free list → `never_mention`). Quiet hours default to the sleep window.

Done. The graph is validated, saved, and the "your plan" screen renders it.

## Scripted mode implementation

A state machine over the stages above, one question per screen, with the rules tables as data (`src/intake/rules.ts`). Answers go straight into a draft graph; validation runs at the end of each stage. The whole thing is about 30 screens with skips.

## LLM mode implementation

Same stages, same rules tables, but each stage is one Claude call with a system prompt that: states the stage's goal, lists the fields to fill, passes the current draft graph, passes the rules table for proposals, requires the response to be JSON `{ "say": "<one or two sentences in the person's language>", "patch": { ...fields... }, "done": bool }`. The UI shows `say`, applies `patch`, repeats until `done`. The character's voice lives in the system prompt (copy from `09`). Hard rules in the prompt: never diagnose, never use the forbidden words, never set `relative_to_sleep: false` for night shift, never invent a dish not in `dishes.json` without marking it `custom`.

## Test fixtures

Running scripted intake with the answers in `10-personas.md` must produce graphs that validate and match the shape of `example-food-graph.marisol.json` (Marisol) within the fields intake sets.
