# 09 — Voice and copy

Grumble is a stomach with its arms crossed. It is on the person's side and it is not impressed. It has seen the pastelito. It is not going to pretend it hasn't.

## The stance

**Permission, not restriction.** Grumble never says don't. It says here's what that does, and here's the cheaper, earlier, smaller or shared version of the same thing. The person keeps the dish.

**The grumble is the complaint, not the person.** A stomach grumbles when it's empty; a person grumbles when nobody's listening. Both mean something needed isn't being met. Grumble says what the body says before the person will.

**Dry, never mocking.** The joke is always at the situation, never at the person. "Nine forty last night. Not a crime. Tonight, eight." Never "you did it again."

**Grumble is not your friend.** It never says "I'm here for you", "we're in this together", "I believe in you". It gets the person to a human. The one promise is "you won't be left alone with this", and it keeps that promise by showing up every day, dry and unbothered, and by always having a person on the card.

**Never label.** The four risks are structure, not vocabulary. Grumble never says lonely, isolated, depressed, anxious, poor, low-income, obese, overweight, non-compliant, cheat, bad, guilty, should, must, avoid, forbidden, allowed. It never names a diagnosis the person hasn't said.

**Suggestive by default.** `contract.framing == "suggestive"`: "Eight would be better." Direct, only if the person chose it: "Eat at eight."

## The moves vocabulary

Every suggestion is a move on a dish the person already eats. The code picks from this list by dish attributes; the copy is fixed and translated.

| Move id | When | en | es |
|---|---|---|---|
| `earlier` | last_meal_by missed | "Same plate, an hour earlier." | "El mismo plato, una hora antes." |
| `walk10` | always paired with dinner | "Ten minutes after. Then I'll stop grumbling." | "Diez minutos después. Y dejo de refunfuñar." |
| `beans-first` | dish has beans/legume | "Beans first, rice last." | "Primero los frijoles, el arroz al final." |
| `protein-first` | dish has protein + starch | "Meat before rice." | "La carne antes del arroz." |
| `one-cup` | rice ≥ 150 g equivalent | "One cup of rice, not two. Same vaca frita." | "Una taza de arroz, no dos. La misma vaca frita." |
| `two-not-four` | maduros / tostones | "Two maduros, not four. Nobody's counting but me." | "Dos maduros, no cuatro. Nadie cuenta, solo yo." |
| `morning-not-night` | pastry, sweet | "The pastelito in the morning. Same pastelito." | "El pastelito por la mañana. El mismo pastelito." |
| `add-beans` | fiber < 5 g | "Add a side of black beans. It's the cheapest thing on the menu." | "Agrega frijoles negros. Es lo más barato del menú." |
| `half-the-bread` | bread/roll with a plate | "Half the bread. Keep the butter." | "Medio pan. La mantequilla se queda." |
| `share-it` | kcal > 900 | "That's two dinners. Share it or box half before you start." | "Eso son dos cenas. Comparte o guarda la mitad antes de empezar." |
| `soup-counts` | low appetite | "Sancocho counts as dinner." | "El sancocho cuenta como cena." |
| `table` | Tuesday, open_to_table | "Versailles, six thirty. Seat's yours." | "Versailles, seis y media. Tu silla está lista." |
| `as-is` | mediterranean_style and fiber ≥ 6 | "As is. Don't let anyone tell you otherwise." | "Así como está. Que nadie te diga lo contrario." |

Haitian Creole for the daily check-in and the table card only in the hackathon build; the rest falls back to English with the language chip showing "EN".

## Fixed lines

| Where | en |
|---|---|
| Intake open | "I'm Grumble. I'm the part of you that's hungry and annoyed about it. Five minutes, then I'll know what you actually eat." |
| Intake, cancer question | "And the reason Sylvester sent you here. You can skip this." |
| Intake, table question | "There's a table at Versailles on Tuesdays for people in the program. Nobody pays. Want a seat sometime?" |
| Intake, both timing standards declined | "Fine. I'll figure it out from what you log. Lourdes will probably ask." |
| Check-in open, amber yesterday | "Nine forty last night. Not a crime. Tonight, eight." (time filled from the log) |
| Check-in, who's at the table | "Who's at the table tonight?" |
| Post-dinner nudge | "Ten minutes. Then I'll stop grumbling." |
| Morning after the table | "Tuesday was a good one. Eight of you, dinner at six thirty, and you walked." |
| Red week | "Lourdes is going to call you this week. Tonight: whatever you were going to eat, before eight, then ten minutes outside." |
| Simulator, normal group | "Even for you, the walk is worth twenty points. Just saying." |
| Simulator, unknown dish | "I don't have numbers for that one yet. Closest I've got:" |
| Simulator band title | "People like you — prediabetes, 5,472 dinners" |
| Walk at 20 or 30 | "Same as ten. Ten is the whole trick." |
| Alone tonight, no buddy, no dog | "At the table, not the couch. Ten minutes outside after. The bay's right there." |

## The character

The stomach from the logo: coral, arms crossed, one eyebrow up. Three states only: **grumbling** (default, arms crossed), **fed** (arms down, eyes closed, used after a green day and after the table), **listening** (head tilted, used during intake and the check-in). No celebration animations, no confetti, no streaks. A green day gets the fed face and nothing else.

## i18n

All strings in `src/i18n/{en,es,ht}.json`, keyed by the ids above and screen paths. Spanish is Miami Spanish: *cafecito, frijoles negros, maduros, refunfuñar*. Use *usted* throughout. Haitian Creole keys exist for the check-in and the table card; missing keys fall back to English, never to Spanish.

## Review checklist before any copy ships

- [ ] No word from the never-label list.
- [ ] Every suggestion has a dish, a time, a walk and a person (or "the bay's right there").
- [ ] The joke is at the situation.
- [ ] It would read fine on a screen held by a 71-year-old in Hialeah and a 48-year-old nurse coming off a night shift.
- [ ] A Sylvester clinician could read it over the person's shoulder without wincing.
