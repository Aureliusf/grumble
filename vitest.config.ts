import { defineConfig } from 'vitest/config'

// Root tests only. server/ carries its own Vitest setup (server/package.json) and runs from there.
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'] },
})
