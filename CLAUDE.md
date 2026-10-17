# Grumble — instructions for the dev agent

You are building Grumble, a companion app for cancer survivors in Miami that shows how meals, meal timing and movement shape blood sugar, and turns that into advice people will follow. This directory is the spec. Read `README.md` first, then the numbered specs in order. Build in the order `00-FIVE-HOURS.md` gives.

## Rules that override your defaults

1. **Permission, never restriction.** Grumble never tells anyone not to eat something. Every suggestion is a cheaper, earlier, smaller or shared version of what the person was going to eat anyway. If you find yourself writing "avoid", rewrite it as a move (see `09-voice-and-copy.md`).
2. **Timing is relative to sleep, not the clock.** Every "late" or "early" rule reads `person.schedule.sleep_start`. Night-shift users are the test case: dinner at 2 am is not late for someone who sleeps at 9 am.
3. **The simulator shows what happened to people like you.** It is parameterized from the synthetic CGM data (`data/simulator-params.json`) and labeled as a range, never a forecast. The data is made up; the README from the challenge says so and so do we.
4. **Company is a first-class input.** The daily check-in asks who the person is eating with. The Versailles table is the flagship feature, not a nice-to-have.
5. **Grumble is never the companion.** The app does not say "I'm here for you." It gets the person to a human: the table, a buddy, the coach, a dog.
6. **Never label the person.** The four risks (company, taste, money, convenience) are internal structure. The UI never says "lonely", "low income" or "depressed". Mood check-ins of 2 or below on three days route to the coach, quietly.
7. **Three languages.** English, Spanish, Haitian Creole. All copy lives in `src/i18n/{en,es,ht}.json`. Never hardcode a user-facing string.
8. **The food graph is the only state.** One JSON object per person, validated against `data/food-graph.schema.json`. Every screen reads and writes it. No other persistence.
9. **Demo data only.** Use `data/personas.json` (four real synthetic participants) and `data/dishes.json` (127 Miami dishes). Do not invent dishes or nutrients. Do not fetch anything at runtime.
10. **Do the math in code, not in prose.** When a number appears on screen, it was computed from the params file or the person's log.

## Conventions

- **Today is a five-hour build. `00-FIVE-HOURS.md` overrides everything else in this directory.**
- Nuxt 3 + Nuxt UI + @nuxtjs/i18n for the frontend (`14-frontend-nuxt.md`, owner Miguel). Nitro server routes in the same repo for the backend (`15-backend-nitro.md`, owner Aurelio). The contract between them is `16-api-contract.md` and `shared/types.ts`; the frontend uses the fixtures in `16` until a route is real.
- `npm run dev` must work from a clean clone with no env vars. No LLM calls today.
- Theme is the friendly food-app register: Fredoka + Nunito, coral primary, cafecito secondary, warm crema neutrals (`14` §Theme). No new colors.
- Tests only where they're cheap: the simulator hand check in `04` §Tests as one Vitest file. Nothing else today.
- Commit after each screen works. Commit messages name the spec file ("14: whatif page against fixture").

## When the spec is silent

Pick the option that keeps the dish, moves the time earlier, adds a 10-minute walk, or adds a person. Then note the decision in `DECISIONS.md` at the repo root with the date.
