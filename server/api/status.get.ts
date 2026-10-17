// What the server can do right now. `ai` is false without ANTHROPIC_API_KEY, so /api/log and /api/meal
// return 503 and the pages fall back to the local word match; the frontend shows a banner for it.
export default defineEventHandler(() => ({ ai: !!process.env.ANTHROPIC_API_KEY }))
