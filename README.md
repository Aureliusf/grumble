# Grumble — spec root

**Grumble** is a companion app for people in Miami who have finished cancer treatment. It shows them how their meals, meal times and movement shape their blood sugar, and turns that into advice they will follow, because it starts from the food they already love and the people they could eat it with.

Built for Challenge 2 ("Dose and Timing") of the Miami AI Hackathon, sponsored by UHealth Sylvester Comprehensive Cancer Center.

The stomach grumbles when it's empty. A person grumbles when nobody's listening. Same complaint. Grumble feeds both.

## The three answers (from the challenge's own data)

| Question the challenge asks | Answer in the synthetic CGM data | Where it lives |
|---|---|---|
| Does a late dinner matter? | Yes. Dinner after 8 pm: +13 to +31 mg/dL on the peak, 39% to 59% more glucose exposure over two hours, worse the higher your starting glucose | `04-simulator.md`, `data/simulator-params.json` |
| Is an evening walk worth it? | Yes. Any walk right after dinner: −16 to −25 mg/dL on the peak, about a third less exposure | same |
| How much movement is enough? | Ten minutes. Benefit is complete by 10 min; 20 or 30 add nothing further | same |

And the one the challenge didn't ask but the data answers: **coaching moved HbA1c four times more than emailed tips.** The relationship did the work. That is why Grumble's flagship feature is a dinner table, not a chart.

## Directory map

```
specs/
├── CLAUDE.md                  rules for the dev agent (read first)
├── 00-FIVE-HOURS.md           TODAY: the cut, the split, the clock (overrides the rest)
├── README.md                  this file: what, why, build order
├── 01-product.md              the five parts, the demo flow, success criteria
├── 02-food-graph.md           the one data object; schema walkthrough
├── 03-intake.md               the blueprint conversation that writes the food graph
├── 04-simulator.md            dish + time + walk → glucose curve; the math
├── 05-daily-grumble.md        the daily check-in and the one suggestion
├── 06-versailles-table.md     host-or-find, the menu, the donation screen
├── 07-coach-view.md           population screen with the planted patterns
├── 08-data-pipeline.md        how the JSON in data/ was made; how to regenerate
├── 09-voice-and-copy.md       tone, the moves vocabulary, i18n, what Grumble never says
├── 10-personas.md             Marisol, Jean, Dani, Tony: real synthetic records
├── 11-stack-and-architecture.md
├── 12-evidence-pack.md        the four charts for the pitch and their numbers
├── 13-demo-script.md          three minutes, Marisol end to end
├── 14-frontend-nuxt.md        Miguel: Nuxt + Nuxt UI, theme, the four pages
├── 15-backend-nitro.md        Aurelio: Nitro routes, the math, the rules, seeded state
├── 16-api-contract.md         shared/types.ts + the fixtures both sides use
├── roadmap-backend.md         Aurelio's planning doc, kept as the Phase 2 roadmap
├── data/
│   ├── food-graph.schema.json         JSON Schema for the person object
│   ├── example-food-graph.marisol.json the demo persona's graph
│   ├── example-food-graph.founder.json a 49-dish graph derived from a real 13-week program
│   ├── dishes.json                    127 Miami dishes with nutrients
│   ├── personas.json                  4 synthetic participants, full records
│   └── simulator-params.json          fitted glucose-response parameters
└── analysis/
    ├── cgm_model.py          fits the simulator params (run on the challenge data)
    ├── nhanes_pass.py, nhanes_phq.py   the NHANES survivor analysis
    ├── synth_pass.py         the synthetic program analysis (group effects, dropout)
    ├── assets.py             builds dishes.json and personas.json
    ├── meal_responses.csv    21,231 meals with their 3-hour glucose response
    └── cgm_summary.json
```

The challenge data itself is not in this directory. The pipeline (`08-data-pipeline.md`) expects it at `../challenge-data/` with the layout from the challenge README: `nhanes_us_adults.csv`, `synthetic_data/`, `CGMacros/`.

## Build order

**For the hackathon, follow `00-FIVE-HOURS.md`.** The order below is the full product, for after.

1. **Scaffold + food graph** (`02`, `11`): Vite app, schema validation, load `example-food-graph.marisol.json`, render it as a readable "your plan" screen. Persist to localStorage.
2. **Simulator** (`04`): the what-if screen. Dish picker from `dishes.json`, time slider, walk toggle, two curves side by side. This alone answers the challenge.
3. **Daily Grumble** (`05`): the check-in and the one suggestion, driven by the food graph and today's answers.
4. **Versailles table** (`06`): host-or-find, the Tuesday menu, the donation screen.
5. **Intake** (`03`): scripted conversation that produces a food graph for a new person. LLM mode if there is time.
6. **Coach view** (`07`): the population screen from `personas.json` plus aggregates in `12`.
7. **Polish** (`09`, `13`): Spanish pass, the character, the demo path end to end.

## What this is not

- Not a glucose tracker. Levels, January AI and Nutrisense exist. Grumble's simulator is table stakes; the table is the product.
- Not medical advice. Grumble sits inside a Sylvester-coached program and routes red weeks to a human.
- Not a claim about real people. The synthetic patterns are the Crane Lab's design. The NHANES association (depressive symptoms, income and HbA1c among survivors) is real, observational and unweighted, and the pitch says so.

## Sources to credit

- Gutierrez-Osuna R, Kerr D, Mortazavi B, Das A. CGMacros (v1.0.0). PhysioNet, 2025. https://physionet.org/content/cgmacros/1.0.0/
- CDC, National Health and Nutrition Examination Survey 2011–2014 with 2019 linked mortality.
- Synthetic 12-week program: Crane Lab, Sylvester Comprehensive Cancer Center, for this hackathon.
