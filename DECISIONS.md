# Decisions

Choices made where the spec was silent or the installed versions differed from it.

## 2026-10-17 — frontend scaffold (14)

- **Versions.** Nuxt 4.6, Nuxt UI 4.12 (Tailwind v4), @nuxtjs/i18n 10.6. Nuxt UI v4 configures colors the same way 14 describes for v3 (`app.config.ts` + `@theme` in `main.css`); `UButtonGroup` is `UFieldGroup` in v4.
- **Repo layout.** The specs stay at the repo root instead of moving to `specs/`, so every path in `CLAUDE.md` (`data/…`, `04-simulator.md`) still resolves. `app/`, `server/`, `shared/` sit beside them as 00 describes.
- **i18n lives in `app/i18n/{en,es}.json`** (14), not `src/i18n` (CLAUDE.md predates the Nuxt choice). `fallbackLocale: 'en'` so a missing Spanish string shows English, never a key.
- **`ssr: false`.** Single-laptop demo, no SEO, avoids hydration surprises with the fixture fallback.
- **Missing API routes.** With `ssr: false`, Nuxt answers an unknown `/api/*` with the SPA's HTML and a 200. `apiCall()` treats any non-JSON response as a miss and falls back to the fixture.
- **Fixture-mode state.** When a POST falls back (seat, host, fund), the result is kept in `useDemoState()` so a seat taken on `/today` shows on `/table`. With real routes it stays empty and the server owns the state.
- **Graph and dishes fixtures** import `data/example-food-graph.marisol.json` and `data/dishes.json` directly rather than copying them into `app/fixtures/`.
- **Fonts via @nuxt/fonts** (bundled with Nuxt UI) instead of the Google Fonts `<link>`: same families and weights, but they're downloaded once and served locally, so the demo works with no network once warmed.
- **Icons** from the local `@iconify-json/lucide` package, served by the app; no Iconify CDN calls.
- **Light mode forced** (`colorMode.preference: 'light'`): 14 says don't design for dark today; the dark classes are in place for later.
- **Cafecito shades 200/400/600/800/950** interpolated between 14's stops because Nuxt UI reads every shade of a palette. No new hues.
- **Spanish register.** The strings 14 spells out literally ("Lo que comes", "Tus platos", "Guárdame una silla", "Anfitrión: ¿tú?") are kept as written, even though they use *tú*; new strings use *usted* per 09.
- **"skip:" in Spanish** is "otro día:" so the line reads as a move, not a prohibition (rule 1).
- **Spanish nudge and table-card action labels** in `app/fixtures/today.es.json` were written here (16 only gives the Spanish title and body).
- **Move card sentence** on `/whatif` is built from the `grumble.applied_moves` ids via `moveShort.*` (e.g. "Mismo plato. Una taza, frijoles primero, diez minutos, más temprano."), so it never disagrees with the curve.
- **"Same as ten" chip** shows when `same_as_ten` is true and the walk is above 10. At exactly 10 the chip would say the obvious.
- **Unknown dish on `/whatif`** (table-menu plates not in dishes.json) shows the 09 line and up to three dishes with the most matching words in their ids.
- **`/` is a splash page** (character, the line from the README, one button to `/plan`): the demo opens on the logo (13).
