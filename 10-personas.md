# 10 — Personas

Four real records from the synthetic program (`data/personas.json`), chosen so each is a test fixture for one of the four risks. Names are invented; everything else is the participant's actual row.

| | Marisol | Jean | Dani | Tony |
|---|---|---|---|---|
| participant_id | N0771 | N1904 | N0581 | N0170 |
| Risk she/he tests | Company | Convenience (night shift) | Taste (cycling appetite) | Money |
| Age, sex | 71 F | 65 M | 25 (demo: 36) | 62 M |
| Food background | Cuban | Haitian | Colombian or Venezuelan | Southern US |
| Language | Spanish | Haitian Creole | English | English |
| Cancer | breast, 3 y | colorectal | (see json) | prostate |
| Blood sugar group | prediabetes | type 2 diabetes | normal | normal |
| Work | retired | night shift | works from home | retired |
| CGM | yes | yes | no | no |
| Program arm | coaching | (see json) | (see json) | (see json) |
| Modal last-ate | 22:06 | 00:50 | 22:16 | 21:53 |
| Evening calories | 37% | (see json) | (see json) | (see json) |
| After-dinner walk days | 27% | (see json) | (see json) | (see json) |
| Top dishes | cafecito, café con leche, pastelito de guayaba | griot with diri ak pwa and pikliz, bannann peze with fried pork, poisson gros sel | pabellón criollo, ajiaco, soda | shrimp and grits, smothered pork chops, biscuit with sausage gravy |
| Week 0 → 12 HbA1c | 5.8 → 5.8, weight 69.0 → 71.4 kg | (see json) | (see json) | (see json) |

Fill the "(see json)" cells from `personas.json` when building fixtures; they are left out here so this file doesn't drift from the data.

## Marisol — the demo

71, Hialeah, widowed, retired, breast cancer three years out, prediabetes, wore a sensor. In the coaching arm and it didn't reach her: HbA1c flat at 5.8, weight up 2.4 kg over 12 weeks, 37% of her calories after 8 pm, last bite at ten. Her log is cafecito and pastelitos; dinner is whatever's left, late, alone, in front of the TV. She walks a lot during the day (13,800 steps) and almost never after dinner. She is exactly the person the table is for.

Demo answers for intake: food = Cuban; loves = pastelito de guayaba, café con leche, vaca frita, arroz con pollo, picadillo; refuses cilantro and "fish that smells like fish"; dinners out = 2 (Versailles, La Carreta); cooks 5 nights; budget $90; Sedano's; dinner company = alone; sees daughter Sundays and Carmen from the 4th floor sometimes; would call Yesenia; yes to the table; no to hosting; sleeps 11:30–7. Her graph is `data/example-food-graph.marisol.json`.

## Jean — the night-shift fixture

65, Haitian, colorectal, type 2 diabetes, hospital night shift, modal last meal at 00:50. Every timing rule in the app must resolve relative to his sleep window (demo: sleeps 09:00–16:30). His "dinner" at 02:00 is not late; a meal at 06:00 is. He is the reason `relative_to_sleep` exists and the reason the overnight-fast standard is never proposed to him. In the data, night-shift workers finish the program 69% of the time and the fast arm does nothing for them. His Creole check-in is the Creole test.

## Dani — the founder's shape

25 in the data; the demo ages Dani to 36 and layers in the founder's journal (`example-food-graph.founder.json`): a GLP-1 weekly appetite arc (peak suppression Fri–Sun, hunger Wed–Fri), restaurant math for Pollo Tropical, Chipotle, Cava, pho, Korean BBQ, a planned social night, and the fact that "10-min post-meal walk" sat on his crash-fix list for three months and was never executed. Dani tests `appetite_pattern: cycles` (low-appetite cards on peak days, bigger portions on trough days), the restaurant playbook, and the social-night standard.

## Tony — the budget fixture

62, Black, Southern US, prostate, normal glucose, retired, Social Security. Shrimp and grits, smothered pork chops, biscuits and gravy: cheap, familiar, high fat, low fiber. Budget $60/week, SNAP. Every suggestion to Tony must carry a cost and stay under budget; beans, eggs and canned fish are his levers; salmon is never suggested. He is also the demo's second host at the Versailles table (the data has him at normal glucose and retired, with time and a table of his own), which is the point: the host gets as much as the guest.

## What the personas are for

- Intake: scripted answers above must produce valid graphs.
- Simulator: Marisol's vaca frita at 21:30 vs 19:00 + walk is the hero comparison.
- Daily Grumble: each persona hits a different priority card (see `05`).
- Coach view: Marisol at the top of the list in week 4 with three low days; Jean with the night-shift badge.
- Table: Marisol guest, Tony host.
