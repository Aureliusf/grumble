# 14 — Frontend: Nuxt + Nuxt UI

Owner: Miguel, with Claude Code. Four pages, one layout, one theme. Everything reads the API in `16-api-contract.md` and falls back to its fixtures.

## Setup (first 20 minutes)

```
npx nuxi@latest init grumble && cd grumble
npx nuxi module add ui          # Nuxt UI v3 (Tailwind v4 under the hood)
npx nuxi module add i18n        # @nuxtjs/i18n, en + es
npm i
```

Check the installed Nuxt UI major with `npm ls @nuxt/ui` before writing components; v3 configures colors in `app.config.ts` and custom palettes in `app/assets/css/main.css` with `@theme`. If it's v2, the same tokens go in `tailwind.config.ts` and `app.config.ts` `ui.primary`. Don't fight the version; match it.

`nuxt.config.ts`: `modules: ['@nuxt/ui', '@nuxtjs/i18n']`, `i18n: { locales: [{code:'en',file:'en.json'},{code:'es',file:'es.json'}], defaultLocale: 'es', strategy: 'no_prefix' }`, `app.head` with the Google Fonts link below. Default locale Spanish because the demo runs in Spanish.

## Theme: friendly food app, Grumble's own

The reference is the fast-food app register: big friendly type, one loud brand color, chunky rounded buttons, cards you can hit with a thumb, photos of food, zero clinical feel. Grumble borrows the confidence and the ergonomics, not the red and yellow. The brand color is the stomach's coral; the second color is cafecito.

```css
/* app/assets/css/main.css */
@import "tailwindcss";
@import "@nuxt/ui";

/* Layout: one phone-width column (max 430px) centered on desktop inside a soft page ground;
   bottom tab bar; every screen = header strip + one scrolling column of cards */
@theme {
  /* brand coral — from the character */
  --color-grumble-50:  #fff1ee;
  --color-grumble-100: #ffe0d9;
  --color-grumble-200: #ffc4b7;
  --color-grumble-300: #ff9f8a;
  --color-grumble-400: #fb7a60;
  --color-grumble-500: #f05a3d;   /* primary */
  --color-grumble-600: #d8432a;
  --color-grumble-700: #b23420;
  --color-grumble-800: #8e2d1e;
  --color-grumble-900: #74291d;
  --color-grumble-950: #3f1109;
  /* cafecito — warm brown, the secondary */
  --color-cafecito-50:  #faf5f0;
  --color-cafecito-100: #f1e6d9;
  --color-cafecito-300: #d3b48f;
  --color-cafecito-500: #9c6b3f;
  --color-cafecito-700: #6b4527;
  --color-cafecito-900: #3b2415;
  /* neutral with a warm bias, not grey */
  --color-crema-50:  #fffaf5;   /* page ground, light */
  --color-crema-100: #fdf3ea;
  --color-crema-200: #f5e6d8;
  --color-crema-800: #3a3128;
  --color-crema-900: #2a221b;
  --color-crema-950: #1b1511;   /* page ground, dark */

  --font-display: "Fredoka", "Nunito", system-ui, sans-serif;
  --font-sans: "Nunito", system-ui, sans-serif;
  --radius-grumble: 1.25rem;
}
```

`app.config.ts`:

```ts
export default defineAppConfig({
  ui: {
    colors: { primary: 'grumble', secondary: 'cafecito', neutral: 'stone', success: 'green', warning: 'amber', error: 'red' },
    button: { slots: { base: 'rounded-full font-display font-semibold' }, defaultVariants: { size: 'xl' } },
    card:   { slots: { root: 'rounded-[var(--radius-grumble)] shadow-sm ring-0 bg-white dark:bg-crema-900' } },
  }
})
```

Fonts: `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700&display=swap">`. Fredoka for headings, numbers and buttons (it's round and loud, the fast-food energy without the brand); Nunito for everything else. Type scale: 34/26/20/17/15, body 17 (Marisol is 71; nothing under 15 on a tappable surface).

Semantic color is separate from brand: green/amber/red for day status only, and only as a small chip or stripe, never a full card.

Dark mode: Nuxt UI handles it via `color-scheme`; the `crema` ground flips to 950. Test once; don't design for it today.

## Layout

`app/layouts/default.vue`:

- Page ground `bg-crema-50 dark:bg-crema-950`, one column `max-w-[430px] mx-auto min-h-dvh flex flex-col`.
- **Header strip** (sticky): the Grumble wordmark in Fredoka 700, the character small at right (state from the store), a language pill `ES | EN` (`UButton` group, `size="xs"`), and a tiny dev strip under it in `nuxt dev` only: demo clock from `/api/clock` and a "fixture" chip when a route fell back.
- **Content**: `<slot />` with `px-4 py-5 flex flex-col gap-4`.
- **Bottom tab bar** (fixed, safe-area padded): four tabs with icons from `@iconify` lucide set: Plan `i-lucide-clipboard-list`, What if `i-lucide-activity`, Today `i-lucide-sun`, Table `i-lucide-utensils`. Active tab coral.

The character: `components/Grumble.vue`, three states `grumbling | fed | listening`, props `state` and `size`. Use the cropped PNG from `specs/assets/` as the base; states are a CSS filter/transform for today (fed: slight tilt + `brightness(1.05)`; listening: `rotate(-6deg)`). Real art is Phase 2.

## Pages

### `/plan` — her plan

`pages/plan.vue`. `useApi('/api/graph/N0771')`.

1. Hero card: "Marisol" in Fredoka 34, one line under it from `person` ("Hialeah · Cuban · 71"), the character grumbling at right.
2. **"Un buen día" / "A good day"**: one `UCard` per standard. Statement in Fredoka 20 (her words; `statement` in es, `statement_en` in en), the `why` line in Nunito 15 `text-crema-800/70`. Kind icon left: clock, footprints, bean, rice bowl, croissant, utensils.
3. **"Lo que comes" / "What you eat"**: rotation as horizontal-scroll cards (`snap-x`), each with dish name, the `move` in coral, a star for starred, cost chip if present. Tapping one opens `/whatif?dish=<id>`.
4. **"Dónde comes" / "Where you eat"**: `places` as two compact rows (Versailles, La Carreta): order in bold, avoid as a small "skip:" line.
5. **"Quién aparece" / "Who shows up"**: three `UBadge`-style chips: coach Lourdes, buddy Carmen (4th floor, walks), table Tuesdays. Never the word "support".

### `/whatif` — the two curves

`pages/whatif.vue`. The hero of the demo. State in a composable `useWhatIf()`; calls `POST /api/simulate` on every change, debounced 150 ms.

Controls, stacked, big:
- `USelectMenu` dish picker, searchable, Marisol's rotation first under a "Tus platos" group, then "Todo Versailles / Cuban", then the rest by cuisine. Default: vaca frita.
- Time: `USlider` 17:00–23:00 step 30 min, value shown in Fredoka 26 above it ("9:30 pm"). Default 21:30.
- Walk: three `UButton`s in a group, `0 · 10 · 20 min`. Default 0.
- Move toggle: `USwitch` "La movida de Grumble" with the applied moves listed as small chips when on.

Chart: `components/GlucoseCurve.vue`, hand-rolled SVG, no chart library. Props: `current`, `grumble`, `baseline`, `height`. Draw:
- y axis 70–240 mg/dL, light grid at 100/140/180, a dashed line at 140 labeled "140" (post-meal reference), baseline as a thin line.
- `current` as a coral stroke 3 px with a 12% coral fill under it; its `band` as 8% fill.
- `grumble` as a cafecito stroke 3 px, same treatment.
- Peak markers: a dot and the number in Fredoka 17 at each peak.
- x ticks 0 · 1h · 2h · 3h · 4h. `viewBox="0 0 400 220"`, `width="100%"`.
- `prefers-reduced-motion` respected; otherwise the grumble line draws in over 600 ms when it changes.

Under the chart, three stat tiles in one row (`grid-cols-3`), Fredoka numbers: **Pico** (207 → 143), **En 2 h** (−75%), **De vuelta** (215 → 190 min). Caption under: "Gente como tú · prediabetes · 5,472 cenas" from the response. Never the word predict/predecir.

Below: the move card. "Mismo plato. Siete, frijoles primero, una taza, diez minutos." with a "Ver esto el martes" button that deep-links to `/table`.

Walk at 20: the tile shows the same number and a chip "Igual que diez" / "Same as ten". Make the chip visible; it's a line in the script.

### `/today` — Daily Grumble

`pages/today.vue`. `GET /api/today/N0771` on load; `POST /api/checkin/N0771` on submit.

1. If `nudge` is non-null: one line at top in Fredoka 20, character grumbling. No red. No streak.
2. The check-in: four rows. Energy, hunger, mood as five large round face buttons (`URadioGroup` restyled, or plain buttons 56 px) with text labels under them. Company as five chips: "Solo yo" · "Viene alguien" · "Salgo" · "La mesa" · "No sé". One primary button "Listo".
3. After submit, the card slides in (`<Transition>`): `kind` decides the layout.
   - `table`: coral header band with "Versailles · 6:30", body copy, Tony's name as a chip, two buttons from `actions`. "I'll be there" posts the action and flips the button to a check with "Martes" and the character to `fed`.
   - `dinner`: dish name Fredoka 26, the move, the time and walk as two chips, the person as a chip if present.
   - `place`: venue, order in bold, "skip:" line.
   - `red`: calm card, Lourdes's name, the one instruction. Nothing else on screen.
4. Evidence chip bottom-right of the card: "patrón observado" / "observed pattern" in `text-xs`. Aurelio's evidence level, rendered.

### `/table` — the Versailles table

`pages/table.vue`. `UTabs` with three tabs: **Mesa** · **Menú** · **Fondear** (en: Table · Menu · Fund a week).

**Mesa**: a short line at top ("Martes a las seis y media en Versailles. Nadie paga."). Then a list from `GET /api/tables`: each `UCard` with the date in Fredoka 20, host name + "4 años" chip, language chip, "3 sillas" with a mini seat row (8 dots, filled = taken), `funded_by` as "Esta mesa la paga la familia García" when present. Button: "Guárdame una silla" → `POST /api/tables/:id/seat` → card shows "Tu silla" and the character goes `fed`. The host-less table (`t4`) shows "Anfitrión: ¿tú?" with a button that opens a `UModal` form (date fixed, seats 4–8 slider, language) → `POST /api/tables`.

**Menú**: five rows from `/api/tables/menu`: name Fredoka 17, move in coral, numbers small and tabular (kcal · carbs · fiber). Last row, not from the API, hardcoded copy: "Flan: uno para la mesa, en ocho." Button per row "¿Qué me hace esto?" → `/whatif?dish=<id>&time=18:30&walk=10&move=1`.

**Fondear**: headline "Un martes en Versailles, ocho personas, ocho platos y cafecito: unos $160." Three big buttons from `Fund`: $20 silla · $160 mesa · $640 mes. Optional name field "A nombre de…". `POST /api/fund` → ledger updates in place and a toast "Gracias. Ese martes ya tiene mesa." Ledger as one row of three Fredoka numbers: mesas · sillas · ocupadas. A line in `text-xs`: "A través de Sylvester Comprehensive Cancer Center."

## Composables

- `useApi<T>(path, { fixture })`: `$fetch` with the fixture on error; sets `devStrip.fixture = true`.
- `useLang()`: wraps i18n; the `ES | EN` pill; persists to localStorage in try/catch.
- `useGrumble()`: character state store (`grumbling` default; `fed` after a seat or a green action; `listening` during the check-in). Pinia or `useState`.

## i18n

`app/i18n/en.json`, `es.json`. Keys by screen: `plan.*`, `whatif.*`, `today.*`, `table.*`, `nav.*`, `moves.*` (the vocabulary ids from `09`). API strings arrive already localized (`?lang=`), so the frontend only translates chrome and static copy. Spanish is Miami Spanish, `usted`.

## Component checklist

- [ ] `Grumble.vue` (3 states)
- [ ] `GlucoseCurve.vue`
- [ ] `StandardCard.vue`, `DishCard.vue`, `PlaceRow.vue`
- [ ] `FaceRow.vue` (1–5), `CompanyChips.vue`
- [ ] `SuggestionCard.vue` (4 kinds)
- [ ] `TableCard.vue`, `SeatDots.vue`, `HostModal.vue`, `MenuRow.vue`, `FundButtons.vue`
- [ ] `DevStrip.vue`

## Don'ts for today

No auth, no SSR-only data (use `useAsyncData` with `server: false` if hydration bites), no animation beyond the curve draw and the card transition, no third chart library, no new colors outside the three palettes, no word from the never-label list in `09`.
